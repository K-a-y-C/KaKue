import { loadBundledSource } from '../import/step-import';
import type { PartAsset } from '../import/types';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { robotDefinition } from '../robot/definition';
import { forwardKinematics } from '../robot/forward-kinematics';
import manifest from '../../assets/demo/manifest.json';
export interface SceneInformation { doorWidthMm: string; doorHeightMm: string; robotLinkCount: number; emitterMm: string[] }
function disposeObject(object: THREE.Object3D) {
  object.traverse(node => {
    if ((node instanceof THREE.Mesh || node instanceof THREE.LineSegments)) {
      node.geometry.dispose();
      const materials = Array.isArray(node.material) ? node.material : [node.material];
      materials.forEach(material => material.dispose());
    }
  });
}
export interface SceneHandle { clearPart(): void; replacePart(part: PartAsset): void; dispose(): void }
/** Owns the scene and replaceable part GPU resources. */
export function openDemoScene(host: HTMLElement, ready: (info: SceneInformation, part: PartAsset) => void, fail: (message: string) => void): SceneHandle {
  let active = true;
  const initialization = new AbortController();
  let currentPart: THREE.Group | undefined;
  let publishPart: (part: THREE.Group, asset: PartAsset) => void = () => {};
  const clearPart = () => { if (currentPart) { scene.remove(currentPart); disposeObject(currentPart); currentPart = undefined; } };
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#e8edf1');
  let renderer: THREE.WebGLRenderer;
  try { renderer = new THREE.WebGLRenderer({ antialias: true }); }
  catch { fail('WebGL2 is required to display this scene. Use a desktop browser with hardware acceleration enabled, then reload.'); return { clearPart() {}, replacePart() {}, dispose() {} }; }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.domElement.setAttribute('role', 'img');
  renderer.domElement.setAttribute('aria-label', '3D robot and door scene');
  host.append(renderer.domElement);
  const camera = new THREE.PerspectiveCamera(40, 1, .01, 30);
  camera.up.set(0, 0, 1);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  scene.add(new THREE.HemisphereLight(0xffffff, 0x7c8896, 2));
  const light = new THREE.DirectionalLight(0xffffff, 3); light.position.set(2, -3, 4); scene.add(light);
  const grid = new THREE.GridHelper(4, 40, 0x8593a3, 0xc7d0d9); grid.rotation.x = Math.PI/2; scene.add(grid);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(4,4), new THREE.MeshStandardMaterial({ color: 0xe3e9ee, roughness: 1, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 }));
  scene.add(floor);
  const majorGrid = new THREE.GridHelper(4, 8, 0x708498, 0xa1b0bf); majorGrid.rotation.x = Math.PI/2; scene.add(majorGrid);
  const resize = () => { const { width, height } = host.getBoundingClientRect(); renderer.setSize(width, height); camera.aspect = width/height; camera.updateProjectionMatrix(); };
  const observer = new ResizeObserver(resize); observer.observe(host); resize();
  const loader = new GLTFLoader();
  const load = async (path: string) => {
    let loaded: THREE.Group;
    try { loaded = (await loader.loadAsync(`${import.meta.env.BASE_URL}demo-v1/${path}`)).scene; }
    catch { throw new Error(`Required asset unavailable: ${path}.`); }
    if (!active) { disposeObject(loaded); throw new Error('Scene closed'); }
    return loaded;
  };
  void (async () => {
    const pose = forwardKinematics(robotDefinition, manifest.homeAngles);
    for (const link of robotDefinition.links) {
      const group = await load('robot/'+link.mesh); group.matrixAutoUpdate = false;
      group.matrix.fromArray(pose.linkMatrices[link.name]).multiply(new THREE.Matrix4().fromArray(link.visualTransform)); scene.add(group);
    }
    const tool = new THREE.Group(); tool.matrixAutoUpdate = false; tool.matrix.fromArray(pose.tool0); scene.add(tool);
    const scanner = new THREE.Mesh(new THREE.BoxGeometry(...robotDefinition.scanner.dimensions as [number,number,number]), new THREE.MeshStandardMaterial({ color: 0x273e51, roughness: .4 }));
    scanner.position.fromArray(robotDefinition.scanner.tool0ToCenter); tool.add(scanner);
    const emitter = new THREE.Mesh(new THREE.CircleGeometry(.012, 16), new THREE.MeshBasicMaterial({ color: 0xf34444, side: THREE.DoubleSide }));
    emitter.position.fromArray(robotDefinition.scanner.tool0ToEmitter); tool.add(emitter);
    const door = await load('door/door.glb'); currentPart = door; door.matrixAutoUpdate=false; door.matrix.fromArray(manifest.partToBase); scene.add(door);
    const bundled = await loadBundledSource({ signal: initialization.signal });
    const meshes: PartAsset['meshes'] = [];
    door.traverse(node => {
      if (!(node instanceof THREE.Mesh)) return;
      const geometry = node.geometry;
      meshes.push({ name: node.name, positions: new Float32Array(geometry.getAttribute('position').array), normals: geometry.getAttribute('normal') ? new Float32Array(geometry.getAttribute('normal').array) : undefined, indices: geometry.index ? new Uint32Array(geometry.index.array) : Uint32Array.from({ length: geometry.getAttribute('position').count }, (_, i) => i), faces: [] });
    });
    publishPart = (door, asset) => {
    scene.updateMatrixWorld(true);
    const doorSize = new THREE.Box3().setFromObject(door).getSize(new THREE.Vector3());
    const bounds = new THREE.Box3(); scene.children.filter(child => child !== floor && child !== grid && child !== majorGrid && !(child instanceof THREE.Light)).forEach(child => bounds.expandByObject(child));
    const center = bounds.getCenter(new THREE.Vector3());
    controls.target.copy(center);
    const distance = bounds.getSize(new THREE.Vector3()).length() / (2*Math.sin(THREE.MathUtils.degToRad(20))) * 1.1;
    camera.position.copy(center).add(new THREE.Vector3(-1.6,-2.4,1.5).normalize().multiplyScalar(distance));
    controls.update();
    renderer.setAnimationLoop(() => { controls.update(); renderer.render(scene, camera); });
    renderer.render(scene,camera);
    ready({ doorWidthMm: (doorSize.y*1000).toFixed(1), doorHeightMm: (doorSize.z*1000).toFixed(1), robotLinkCount: robotDefinition.links.length, emitterMm: Array.from(pose.emitter.slice(12,15), n => (n*1000).toFixed(1)) }, asset);
    };
    publishPart(door, { ...bundled, meshes });
  })().catch(error => { if (active) fail(`Could not load the supplied scene assets. ${error instanceof Error ? error.message : String(error)} Reload after checking the required files.`); });
  return {
    clearPart,
    replacePart(part) {
      if (!active) return;
      clearPart();
      const group = new THREE.Group(); group.matrixAutoUpdate = false; group.matrix.fromArray(part.partToBase);
      for (const mesh of part.meshes) {
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(mesh.positions, 3));
        geometry.setIndex(new THREE.BufferAttribute(mesh.indices, 1));
        if (mesh.normals) geometry.setAttribute('normal', new THREE.BufferAttribute(mesh.normals, 3)); else geometry.computeVertexNormals();
        const object = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: 0x8fa8bc, side: THREE.DoubleSide }));
        object.userData.cadFaces = mesh.faces; group.add(object);
      }
      currentPart = group; scene.add(group); publishPart(group, part);
    },
    dispose() { active=false; initialization.abort(); observer.disconnect(); controls.dispose(); renderer.setAnimationLoop(null); disposeObject(scene); renderer.dispose(); renderer.domElement.remove(); } };
}
