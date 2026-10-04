import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { robotDefinition as d } from '../../src/robot/definition.ts';
import { forwardKinematics } from '../../src/robot/forward-kinematics.ts';
import { encodeGlb } from './glb.mjs';
const root=fileURLToPath(new URL('../../',import.meta.url)),out=root+'assets/robot/';
const require=createRequire(import.meta.url),init=require('occt-import-js');
const sha=data=>createHash('sha256').update(data).digest('hex');
// An optional local path is useful for verifying rejection; it is never a
// replacement identity or a way to bypass the approved source grouping.
const raw=readFileSync(process.argv[2] ? new URL(process.argv[2], 'file://'+root) : root+d.source.path);
if(sha(raw)!==d.source.sha256 || raw.length!==d.source.bytes) throw new Error('Supplied robot STEP identity differs: grouping cannot be used');
if(sha(readFileSync(root+d.source.jointPath))!==d.source.jointSha256) throw new Error('Pinned joint source differs');
if(require('occt-import-js/package.json').version!==d.importSettings.version) throw new Error('Importer version differs: grouping must be revalidated');
const occt=await init();
const result=occt.ReadStepFile(raw,{linearUnit:'millimeter',linearDeflectionType:'absolute_value',linearDeflection:1,angularDeflection:.25});
if(!result.success || result.meshes.length!==81) throw new Error('Supplied robot import failed or mesh ordering changed');
const pose=forwardKinematics(d,d.home),compiled=JSON.parse(JSON.stringify(d));
mkdirSync(out+'evidence',{recursive:true});mkdirSync(out+'notices',{recursive:true});
const bounds=positions=>{const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];for(let i=0;i<positions.length;i++){const j=i%3;min[j]=Math.min(min[j],positions[i]);max[j]=Math.max(max[j],positions[i]);}return {min,max};};
function localize(mesh,m) {
  const positions=[],normals=[];
  for(let i=0;i<mesh.attributes.position.array.length;i+=3) {
    const p=mesh.attributes.position.array.slice(i,i+3).map((v,j)=>v*.001-m[12+j]);
    for(let j=0;j<3;j++) positions.push(m[j*4]*p[0]+m[j*4+1]*p[1]+m[j*4+2]*p[2]);
  }
  const sourceNormals=mesh.attributes.normal?.array;
  if(sourceNormals) for(let i=0;i<sourceNormals.length;i+=3) for(let j=0;j<3;j++) normals.push(m[j*4]*sourceNormals[i]+m[j*4+1]*sourceNormals[i+1]+m[j*4+2]*sourceNormals[i+2]);
  return {positions,normals:sourceNormals?normals:undefined,indices:mesh.index.array,color:mesh.color};
}
const overlay=[],measurements=[];
for(const link of compiled.links) {
  const source=link.sourceMeshIndices.map(i=>result.meshes[i]),local=source.map(mesh=>localize(mesh,pose.linkMatrices[link.name]));
  const bytes=encodeGlb(local,link.name);writeFileSync(out+link.mesh,bytes);
  link.sha256=sha(bytes);link.bytes=bytes.length;
  link.localBounds=bounds(local.flatMap(m=>m.positions));
  const sourceBounds=bounds(source.flatMap(m=>m.attributes.position.array));
  measurements.push({link:link.name,sourceMeshIndices:link.sourceMeshIndices,sourceBoundsMm:sourceBounds,localBoundsM:link.localBounds,triangles:source.reduce((n,m)=>n+m.index.array.length/3,0)});
  for(const mesh of source) overlay.push({positions:mesh.attributes.position.array.map(v=>v*.001),normals:mesh.attributes.normal?.array,indices:mesh.index.array,color:mesh.color});
}
writeFileSync(out+'evidence/source-core.glb',encodeGlb(overlay,'original-core-at-supplied-pose'));
writeFileSync(out+'robot-definition.json',JSON.stringify(compiled,null,2)+'\n');
const report={sourceSha256:sha(raw),sourceBytes:raw.length,settings:d.importSettings,sourceMeshCount:result.meshes.length,sourceTriangles:result.meshes.reduce((n,m)=>n+m.index.array.length/3,0),coreTriangles:measurements.reduce((n,m)=>n+m.triangles,0),measurements,omissions:compiled.omissions,sourceCoreOverlaySha256:sha(readFileSync(out+'evidence/source-core.glb'))};
writeFileSync(out+'evidence/preparation.json',JSON.stringify(report,null,2)+'\n');
for(const file of ['license.occt-import-js.txt','license.occt.txt']) copyFileSync(new URL('./node_modules/occt-import-js/dist/'+file,import.meta.url),out+'notices/'+file);
copyFileSync(new URL('./node_modules/three/LICENSE',import.meta.url),out+'notices/three-LICENSE');
console.log(JSON.stringify({sourceSha256:report.sourceSha256,sourceMeshes:report.sourceMeshCount,coreTriangles:report.coreTriangles,links:compiled.links.map(l=>({name:l.name,sha256:l.sha256,bytes:l.bytes}))},null,2));
