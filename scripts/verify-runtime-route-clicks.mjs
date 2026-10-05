import {readFile,writeFile} from 'node:fs/promises';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {forwardKinematics} from '../src/robot/forward-kinematics.ts';
import {robotDefinition as robot} from '../src/robot/definition.ts';
import demo from '../assets/demo/manifest.json' with {type:'json'};
const loader=new GLTFLoader(),scene=new THREE.Scene(),pose=forwardKinematics(robot,demo.homeAngles);
async function glb(path,matrix){const raw=await readFile(path),group=(await loader.parseAsync(raw.buffer.slice(raw.byteOffset,raw.byteOffset+raw.byteLength),'')).scene;group.matrixAutoUpdate=false;group.matrix.fromArray(matrix);scene.add(group);return group;}
for(const link of robot.links)await glb(`assets/robot/${link.mesh}`,new THREE.Matrix4().fromArray(pose.linkMatrices[link.name]).multiply(new THREE.Matrix4().fromArray(link.visualTransform)).elements);
const tool=new THREE.Group();tool.matrixAutoUpdate=false;tool.matrix.fromArray(pose.tool0);scene.add(tool);
const scanner=new THREE.Mesh(new THREE.BoxGeometry(...robot.scanner.dimensions));scanner.position.fromArray(robot.scanner.tool0ToCenter);tool.add(scanner);
const emitter=new THREE.Mesh(new THREE.CircleGeometry(.012,16));emitter.position.fromArray(robot.scanner.tool0ToEmitter);tool.add(emitter);
const fanGeometry=new THREE.BufferGeometry();fanGeometry.setAttribute('position',new THREE.Float32BufferAttribute([0,0,0,-.09,0,1,.09,0,1],3));
const laser=new THREE.Mesh(fanGeometry);laser.position.fromArray(robot.scanner.tool0ToEmitter);laser.visible=false;laser.scale.z=.1;tool.add(laser);
const door=await glb('assets/door/door.glb',demo.partToBase);scene.updateMatrixWorld(true);
const bounds=new THREE.Box3();scene.children.forEach(child=>bounds.expandByObject(child));const center=bounds.getCenter(new THREE.Vector3()),distance=bounds.getSize(new THREE.Vector3()).length()/(2*Math.sin(THREE.MathUtils.degToRad(20)))*1.1;
const camera=new THREE.PerspectiveCamera(40,1130/790,.01,30);camera.up.set(0,0,1);camera.position.copy(center).add(new THREE.Vector3(-1.6,-2.4,1.5).normalize().multiplyScalar(distance));camera.lookAt(center);camera.updateMatrixWorld(true);
const rows=demo.representativeRoute.map(p=>{const ndc=new THREE.Vector3().fromArray(p.surfacePosition).project(camera);const ray=new THREE.Raycaster();ray.setFromCamera(new THREE.Vector2(ndc.x,ndc.y),camera);const hit=ray.intersectObject(door,true)[0];return {id:p.id,x:(ndc.x+1)*1130/2,y:110+(1-ndc.y)*790/2,nearestSurfaceErrorMm:hit?hit.point.distanceTo(new THREE.Vector3().fromArray(p.surfacePosition))*1000:null,triangleIndex:hit?.faceIndex};});
await writeFile('docs/verification/issue-07-runtime-route-clicks.json',JSON.stringify({viewport:{width:1440,height:900},canvas:{x:0,y:110,width:1130,height:790},camera:camera.position.toArray(),center:center.toArray(),rows},null,2)+'\n');console.log(rows);
