import test from 'node:test';
import assert from 'node:assert/strict';
import { robotDefinition } from '../../../src/robot/definition.ts';
import { forwardKinematics } from '../../../src/robot/forward-kinematics.ts';

// Expected values are direct STEP cylinder/plane measurements, retained in
// docs/research/robot-verification.md; they do not call production math.
const positionMm = matrix => Array.from(matrix.slice(12,15), x => x * 1000);
const near = (actual, expected, tolerance = 0.001) => actual.forEach((n,i) => assert.ok(Math.abs(n-expected[i]) <= tolerance, `${actual} != ${expected}`));
test('home robot flange and scanner emitter coincide with independently measured CAD datums', () => {
  const pose = forwardKinematics(robotDefinition, robotDefinition.home);
  near(positionMm(pose.linkMatrices.link_1), [0,0,520]);
  near(positionMm(pose.linkMatrices.link_2), [160,0,520]);
  near(positionMm(pose.linkMatrices.link_3), [160,0,1300]);
  near(positionMm(pose.linkMatrices.link_5), [815.000003067,0,1450]);
  near(positionMm(pose.flange), [968.000003067,0,1450]);
  near(positionMm(pose.emitter), [1048.000003067,0,1450]);
  near(Array.from(pose.emitter.slice(8,11)), [1,0,0]);
});

test('signed A1 motion carries flange and rigid emitter clockwise and rejects invalid intervals', () => {
  const pose = forwardKinematics(robotDefinition, [Math.PI/2,-Math.PI/2,Math.PI/2,0,0,0]);
  near(positionMm(pose.flange), [0,-968,1450]);
  near(positionMm(pose.emitter), [0,-1048,1450]);
  near(Array.from(pose.emitter.slice(8,11)), [0,-1,0]);
  assert.throws(() => forwardKinematics(robotDefinition, [0,0,0,0,0,NaN]), /finite/);
  assert.throws(() => forwardKinematics(robotDefinition, [0,0,0,0,0]), /six/);
  assert.throws(() => forwardKinematics(robotDefinition, [0,2,0,0,0,0]), /A2.*interval/);
  assert.throws(() => { robotDefinition.joints[0].axis[2] = 1; }, TypeError);
});

test('independently constructed A5 wrist bend carries the flange 153 mm and emitter another 80 mm downward', () => {
  const pose=forwardKinematics(robotDefinition,[0,-Math.PI/2,Math.PI/2,0,Math.PI/2,0]);
  near(positionMm(pose.flange),[815,0,1297]);
  near(positionMm(pose.emitter),[815,0,1217]);
  near(Array.from(pose.emitter.slice(8,11)),[0,0,-1]);
  near(Array.from(pose.tool0.slice(8,11)),[0,0,-1]);
});
