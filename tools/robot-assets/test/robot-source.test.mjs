import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { robotDefinition as d } from '../../../src/robot/definition.ts';
const sourcePath=p=>new URL('../../../'+p,import.meta.url);
const numbers=s=>s.split(/[,\s]+/).filter(Boolean).map(Number);
const radians=value=>Number(/radians\((-?[\d.]+)\)/.exec(value)[1])*Math.PI/180;

test('all compiled signed axes, origins, intervals, speeds and fixed frames match pinned joint source', () => {
  const xml=readFileSync(sourcePath(d.source.jointPath),'utf8');
  const joints=[...xml.matchAll(/<joint name="\$\{prefix\}joint_a(\d)" type="revolute">([\s\S]*?)<\/joint>/g)];
  assert.equal(joints.length,6);
  for(const [,index,body] of joints) {
    const joint=d.joints[Number(index)-1];
    assert.deepEqual(joint.origin,numbers(/<origin xyz="([^"]+)"/.exec(body)[1]));
    assert.deepEqual(joint.originRotation,numbers(/rpy="([^"]+)"/.exec(body)[1]));
    assert.deepEqual(joint.axis,numbers(/<axis xyz="([^"]+)"/.exec(body)[1]));
    for(const [attribute,key] of [['lower','lower'],['upper','upper'],['velocity','ratedSpeed']]) {
      const expected=radians(new RegExp(attribute+'="([^"]+)"').exec(body)[1]);
      assert.ok(Math.abs(joint[key]-expected)<1e-14);
    }
    assert.ok(Math.abs(joint.demoSpeed-.1*joint.ratedSpeed)<1e-14);
    assert.equal(joint.parent,/parent link="\$\{prefix\}([^"]+)"/.exec(body)[1]);
    assert.equal(joint.child,/child link="\$\{prefix\}([^"]+)"/.exec(body)[1]);
  }
  assert.match(xml,/<joint name="\$\{prefix\}joint_6-flange"[\s\S]*?<origin xyz="0 0 0" rpy="0 0 0"/);
  assert.match(xml,/<joint name="\$\{prefix\}flange-tool0"[\s\S]*?<origin xyz="0 0 0" rpy="0 \$\{radians\(90\)\} 0"/);
});

test('actual STEP cylinder axes and flange plane independently coincide with compiled home chain', () => {
  const step=readFileSync(sourcePath(d.source.path),'utf8');
  const entities=new Map([...step.matchAll(/#(\d+)\s*=\s*([^;]+);/g)].map(m=>[m[1],m[2]]));
  const refs=e=>[...entities.get(e).matchAll(/#(\d+)/g)].map(m=>m[1]);
  const vector=e=>numbers(/\(\s*'[^']*'\s*,\s*\(([^)]+)\)/.exec(entities.get(e))[1]);
  const measured=[];
  const cases=[['11813',[0,0,0],[0,0,1]],['11735',[160,0,520],[0,1,0]],['10756',[160,0,1300],[0,1,0]],['10704',[815,0,1450],[1,0,0]],['11262',[815,0,1450],[0,1,0]],['16600',[968,0,1450],[1,0,0]]];
  for(const [entity,center,axis] of cases) {
    const placement=refs(entity)[0], [point,direction]=refs(placement), p=vector(point),v=vector(direction);
    // Axis line has arbitrary point and sign; transverse displacement must vanish.
    const delta=p.map((n,i)=>n-center[i]), along=delta.reduce((s,n,i)=>s+n*axis[i],0);
    const error=Math.hypot(...delta.map((n,i)=>n-along*axis[i]));
    assert.ok(error<.001);
    assert.ok(Math.abs(v.reduce((s,n,i)=>s+n*axis[i],0))>.999999);
    measured.push({entity,placement,pointMm:p,direction:v,transverseResidualMm:error});
  }
  console.log('independent actual STEP axes/flange:',JSON.stringify(measured));
});

test('hard intervals and rated speeds agree with qualified official original-model numerical evidence', () => {
  const manufacturer=JSON.parse(readFileSync(sourcePath('assets/sources/robot-joints/manufacturer-evidence.json')));
  assert.equal(manufacturer.model,'KR 16 R1610');
  assert.equal(manufacturer.source.originalPdfBytesRetained,false);
  assert.equal(manufacturer.facts.axisCount,6);
  for(let i=0;i<6;i++) {
    const actual=d.joints[i], expected=manufacturer.facts.joints[i];
    assert.equal(actual.name,expected.name);
    for(const [key,record] of [['lower','minimumDeg'],['upper','maximumDeg'],['ratedSpeed','ratedSpeedDegPerSecond']]) assert.ok(Math.abs(actual[key]*180/Math.PI-expected[record])<1e-10);
  }
});
