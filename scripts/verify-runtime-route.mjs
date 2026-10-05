/** Runtime solver answers; frozen route joints are never fed to preflight. */
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {preflight} from '../src/motion/preflight.ts';
import demo from '../assets/demo/manifest.json' with {type:'json'};
import robot from '../assets/robot/robot-definition.json' with {type:'json'};
import door from '../assets/door/manifest.json' with {type:'json'};
const hashes=[];
for(const src of [door.source,robot.source]){const bytes=await readFile(src.path),sha256=createHash('sha256').update(bytes).digest('hex');if(bytes.length!==src.bytes||sha256!==src.sha256)throw Error(`Source identity mismatch ${src.path}`);hashes.push({path:src.path,sha256,bytes:bytes.length});}
for(const [path,spec] of [[door.cache.path,door.cache],...robot.links.map(l=>[`assets/robot/${l.mesh}`,l])]){const bytes=await readFile(path);if(bytes.length!==spec.bytes||createHash('sha256').update(bytes).digest('hex')!==spec.sha256)throw Error(`Mesh identity mismatch ${path}`);}
const points=demo.representativeRoute.map(p=>({id:p.id,order:p.id,basePosition:p.surfacePosition,baseNormal:p.approachNormal,partPosition:p.partLocalPosition,partNormal:p.approachNormal,meshIndex:0,triangleIndex:p.triangleIndex,status:'selected'}));
const start=performance.now(),plan=preflight(points,100),elapsedMs=performance.now()-start;
if(plan.blocked)throw Error('Frozen actual surface route blocked');
const evidence={sourceHashes:hashes,standOffMm:100,solverElapsedMs:elapsedMs,homeAngles:plan.homeAngles,points:plan.points};
await writeFile('docs/verification/issue-07-runtime-route.json',JSON.stringify(evidence,null,2)+'\n');
console.log(JSON.stringify({points:plan.points.length,elapsedMs,maxPositionErrorMm:Math.max(...plan.points.map(p=>p.positionErrorMm)),maxOrientationErrorDeg:Math.max(...plan.points.map(p=>p.orientationErrorDeg))}));
