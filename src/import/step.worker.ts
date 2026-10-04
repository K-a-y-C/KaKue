/// <reference lib="webworker" />
interface OcctMesh {
  name: string;
  attributes: { position: { array: number[] }; normal?: { array: number[] } };
  index: { array: number[] };
  brep_faces: { first: number; last: number; color?: number[] | null }[];
}
declare function occtimportjs(options: { locateFile(name: string): string }): Promise<{ ReadStepFile(bytes: Uint8Array, options: Record<string, string | number>): { success: boolean; meshes: OcctMesh[] } }>;
const workerScope = self as unknown as DedicatedWorkerGlobalScope;
/* Classic worker: published OCCT loader uses importScripts and same-origin WASM. */
workerScope.onmessage = async ({ data }) => {
  let phase = 'initialization';
  const failure = (code: string, message: string) => Object.assign(new Error(message), { code });
  try {
    workerScope.importScripts(data.parserBase + 'occt-import-js.js');
    const occt = await occtimportjs({ locateFile: name => data.parserBase + name });
    phase = 'parsing';
    const sourceHash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', data.buffer)), n => n.toString(16).padStart(2, '0')).join('');
    const text = new TextDecoder().decode(data.buffer);
    const entities = new Map(Array.from(text.matchAll(/#(\d+)\s*=\s*([^;]+);/g), match => [match[1], match[2]]));
    const units = new Set<string>();
    for (const context of text.matchAll(/GLOBAL_UNIT_ASSIGNED_CONTEXT\s*\(\s*\(([^)]+)\)/gi)) {
      for (const reference of context[1].matchAll(/#(\d+)/g)) {
        const entity = entities.get(reference[1]) || '';
        if (!/LENGTH_UNIT\s*\(/i.test(entity)) continue;
        const conversion = entity.match(/CONVERSION_BASED_UNIT\s*\(\s*'([^']+)'/i);
        const si = entity.match(/SI_UNIT\s*\(\s*([^,]+),\s*\.METRE\.\s*\)/i);
        units.add(conversion ? conversion[1].toLowerCase() : si ? ({ '.MILLI.': 'millimeter', '.CENTI.': 'centimeter', '$': 'meter' } as Record<string, string>)[si[1].trim().toUpperCase()] || 'unknown' : 'unknown');
      }
    }
    const sourceUnits = units.size === 1 ? [...units][0] : units.size ? 'mixed' : 'unknown';
    const result = occt.ReadStepFile(new Uint8Array(data.buffer), { linearUnit: 'meter', linearDeflectionType: 'absolute_value', linearDeflection: .001, angularDeflection: .25 });
    if (!result.success) throw failure('malformed', 'Malformed STEP: the parser could not read this file.');
    const meshes = result.meshes.map(mesh => {
      const positions = mesh.attributes.position.array;
      const indices = mesh.index.array;
      const normals = mesh.attributes.normal?.array;
      if (!positions.length || positions.length % 3 || !positions.every(Number.isFinite) || indices.length % 3 || !indices.every(index => Number.isInteger(index) && index >= 0 && index < positions.length / 3) || (normals && (normals.length !== positions.length || !normals.every(Number.isFinite)))) throw failure('invalid-geometry', 'Invalid STEP geometry: nonfinite coordinates, normals or invalid triangle indices.');
      const normalized = { name: mesh.name, positions: new Float32Array(positions), normals: normals ? new Float32Array(normals) : undefined, indices: new Uint32Array(indices), faces: mesh.brep_faces };
      if (!normalized.positions.every(Number.isFinite) || (normalized.normals && !normalized.normals.every(Number.isFinite))) throw failure('invalid-geometry', 'Invalid STEP geometry: coordinates or normals overflow render buffers.');
      return normalized;
    });
    const usable = (mesh: { positions: Float32Array; indices: Uint32Array }) => {
      for (let i = 0; i < mesh.indices.length; i += 3) {
        const a = mesh.indices[i] * 3, b = mesh.indices[i + 1] * 3, c = mesh.indices[i + 2] * 3;
        const p = mesh.positions;
        const u = [p[b]-p[a], p[b+1]-p[a+1], p[b+2]-p[a+2]];
        const v = [p[c]-p[a], p[c+1]-p[a+1], p[c+2]-p[a+2]];
        if (Math.hypot(u[1]*v[2]-u[2]*v[1], u[2]*v[0]-u[0]*v[2], u[0]*v[1]-u[1]*v[0]) > 0) return true;
      }
      return false;
    };
    if (!meshes.some(usable)) throw failure('no-mesh', 'No usable mesh: the STEP contains no triangle surfaces.');
    workerScope.postMessage({ meshes, sourceHash, sourceUnits }, meshes.flatMap(mesh => [mesh.positions.buffer, mesh.indices.buffer, ...(mesh.normals ? [mesh.normals.buffer] : [])]));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const memory = /out of memory|array buffer allocation failed|cannot enlarge memory|memory\.grow|bad_alloc/i.test(message);
    const code = memory ? 'memory-exhausted' : phase === 'initialization' ? 'parser-initialization' : (error as { code?: string })?.code || 'parser-failure';
    const readable = memory ? 'Memory exhausted while importing STEP. Choose a smaller or simpler part and try again.' : phase === 'initialization' ? 'Parser/WASM initialization failed. Check the local parser assets and try again.' : message;
    workerScope.postMessage({ error: { code, message: readable } });
  }
};
