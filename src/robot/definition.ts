import manifest from '../../assets/robot/robot-definition.json' with { type: 'json' };

export type Vector3 = readonly number[];
export interface RobotJoint {
  readonly name: string;
  readonly parent: string;
  readonly child: string;
  readonly origin: Vector3;
  readonly originRotation: Vector3;
  readonly axis: Vector3;
  readonly lower: number;
  readonly upper: number;
  readonly ratedSpeed: number;
  readonly demoSpeed: number;
}
export interface RobotDefinition {
  readonly joints: readonly RobotJoint[];
  readonly links: readonly {
    readonly name: string; readonly mesh: string; readonly sha256: string | null;
    readonly sourceMeshIndices: readonly number[]; readonly visualTransform: readonly number[];
  }[];
  readonly home: readonly number[];
  readonly flangeLink: string;
  readonly linkToFlange: readonly number[];
  readonly flangeToTool0: readonly number[];
  readonly flangeToEmitter: readonly number[];
  readonly scanner: { readonly dimensions: Vector3; readonly tool0ToCenter: Vector3; readonly tool0ToEmitter: Vector3; readonly opticalAxis: Vector3 };
  readonly source: typeof manifest.source;
  readonly importSettings: typeof manifest.importSettings;
}
function freeze<T>(value: T): T {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}
/** One immutable source for rendering, preprocessing, FK and later IK. */
export const robotDefinition: RobotDefinition = freeze(manifest);
