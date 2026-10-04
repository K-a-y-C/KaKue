export interface PartMesh {
  name: string;
  positions: Float32Array;
  normals?: Float32Array;
  indices: Uint32Array;
  faces: { first: number; last: number; color?: number[] | null }[];
}
export interface PartAsset {
  sourceName: string;
  sourceFormat: 'STEP';
  source: Blob;
  sourceHash: string;
  sourceUnits: string;
  outputUnits: 'meter';
  meshes: PartMesh[];
  partToBase: readonly number[];
}
