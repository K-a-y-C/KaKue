import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const root = fileURLToPath(new URL('../../../',import.meta.url));
const require = createRequire(import.meta.url);
const init = require('occt-import-js');

function readGlb(file) {
  const data=readFileSync(file);
  assert.equal(data.readUInt32LE(0),0x46546c67);
  assert.equal(data.readUInt32LE(4),2);
  assert.equal(data.readUInt32LE(8),data.length);
  const jsonLength=data.readUInt32LE(12), json=JSON.parse(data.subarray(20,20+jsonLength));
  const binary=data.subarray(28+jsonLength);
  return json.meshes.flatMap(mesh=>mesh.primitives.map(p=>{
    const a=json.accessors[p.attributes.POSITION], v=json.bufferViews[a.bufferView];
    const vertices=[];
    for(let i=0;i<a.count*3;i++) vertices.push(binary.readFloatLE((v.byteOffset??0)+(a.byteOffset??0)+i*4));
    return { vertices, indices:json.accessors[p.indices].count };
  }));
}

test('prepared rigid links independently reassemble onto every actual STEP core vertex at home', async () => {
  execFileSync(process.execPath,['--experimental-strip-types','tools/robot-assets/prepare.mjs'],{cwd:root,stdio:'pipe'});
  const d=JSON.parse(readFileSync(root+'assets/robot/robot-definition.json'));
  const occt=await init();
  const imported=occt.ReadStepFile(readFileSync(root+d.source.path),{
    linearUnit:'millimeter',linearDeflectionType:'absolute_value',linearDeflection:1,angularDeflection:.25,
  });
  assert.equal(imported.success,true);
  assert.equal(imported.meshes.length,81);
  // Independent home placements: only link2 has -90deg about Y; the
  // remaining home link orientations are identity. CAD axis centers supply translations.
  const home={base_link:[0,0,0],link_1:[0,0,520],link_2:[160,0,520],link_3:[160,0,1300],link_4:[815,0,1450],link_5:[815,0,1450],link_6:[968,0,1450]};
  let worst=0, vertices=0;
  for(const link of d.links) {
    const exported=readGlb(root+'assets/robot/'+link.mesh);
    assert.equal(exported.length,link.sourceMeshIndices.length);
    for(let n=0;n<exported.length;n++) {
      const expected=imported.meshes[link.sourceMeshIndices[n]], actual=exported[n];
      assert.equal(actual.indices,expected.index.array.length);
      for(let i=0;i<actual.vertices.length;i+=3) {
        const [x,y,z]=actual.vertices.slice(i,i+3).map(v=>v*1000), p=home[link.name];
        const placed=link.name==='link_2'?[p[0]-z,p[1]+y,p[2]+x]:[p[0]+x,p[1]+y,p[2]+z];
        worst=Math.max(worst,Math.hypot(...placed.map((v,j)=>v-expected.attributes.position.array[i+j])));
        vertices++;
      }
    }
  }
  assert.ok(worst<.001,`Exported vertex residual ${worst} mm`);
  console.log(`independent exported-core overlay: ${vertices} vertices, maximum ${worst} mm`);
});

test('preparation explicitly rejects a source whose identity does not authorize the core grouping', () => {
  assert.throws(()=>execFileSync(process.execPath,['--experimental-strip-types','tools/robot-assets/prepare.mjs','assets/sources/robot-joints/LICENSE'],{cwd:root,stdio:'pipe',timeout:2000}),/identity differs/);
});
