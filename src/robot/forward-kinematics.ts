import type { RobotDefinition } from './definition.ts';

export type RigidMatrix = Float64Array;
export function identity(): RigidMatrix {
  return new Float64Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]);
}
export function multiply(a: ArrayLike<number>, b: ArrayLike<number>): RigidMatrix {
  const out = new Float64Array(16);
  for (let c=0;c<4;c++) for (let r=0;r<4;r++) {
    for (let k=0;k<4;k++) out[c*4+r] += a[k*4+r]*b[c*4+k];
  }
  return out;
}
export function jointTransform(origin: readonly number[], axis: readonly number[], angle: number): RigidMatrix {
  const [x,y,z] = axis, c=Math.cos(angle), s=Math.sin(angle), t=1-c;
  return new Float64Array([
    t*x*x+c, t*x*y+s*z, t*x*z-s*y, 0,
    t*x*y-s*z, t*y*y+c, t*y*z+s*x, 0,
    t*x*z+s*y, t*y*z-s*x, t*z*z+c, 0,
    ...origin, 1,
  ]);
}
export interface RobotPose {
  linkMatrices: Record<string, RigidMatrix>;
  flange: RigidMatrix;
  tool0: RigidMatrix;
  emitter: RigidMatrix;
}
/** Distances remain meters; joint input angles remain radians. */
export function forwardKinematics(definition: RobotDefinition, angles: readonly number[]): RobotPose {
  if (angles.length !== 6) throw new Error('Robot pose requires exactly six angles');
  definition.joints.forEach((joint,i) => {
    if (!Number.isFinite(angles[i])) throw new Error(`${joint.name} angle must be finite`);
    if (angles[i] < joint.lower || angles[i] > joint.upper) throw new Error(`${joint.name} is outside its hard interval`);
  });
  const linkMatrices: Record<string, RigidMatrix> = { base_link: identity() };
  definition.joints.forEach((joint,i) => {
    linkMatrices[joint.child] = multiply(linkMatrices[joint.parent],jointTransform(joint.origin,joint.axis,angles[i]));
  });
  const flange=multiply(linkMatrices[definition.flangeLink],definition.linkToFlange);
  return { linkMatrices, flange, tool0:multiply(flange,definition.flangeToTool0), emitter:multiply(flange,definition.flangeToEmitter) };
}
