import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import occtFactory from 'occt-import-js';

const sourcePath = '3d files/car-front-door-1/DOOR-of-CAR.step';
const source = option('--source', fileURLToPath(new URL(`../../${sourcePath}`, import.meta.url)));
const output = option('--output', fileURLToPath(new URL('../../assets/door', import.meta.url)));
const identity = { bytes: 14456880, sha256: 'a2662bda82f6bb30ffd70266ad4fc6398871c36c5d2803f138ef9abd57ef53ef' };
const settings = { linearUnit: 'meter', linearDeflectionType: 'absolute_value', linearDeflection: 0.001, angularDeflection: 0.25 };
function option(name, fallback) { const i = process.argv.indexOf(name); return i < 0 ? fallback : process.argv[i + 1]; }
function sha256(bytes) { return createHash('sha256').update(bytes).digest('hex'); }

// Minimal deterministic glTF 2.0 binary encoding; source coordinates remain unchanged except mm → m.
function encodeGLB(meshes) {
  const chunks = [], views = [], accessors = [], models = [];
  let offset = 0;
  function attribute(values, componentType, type, target, bounds) {
    const data = componentType === 5126 ? new Float32Array(values) : new Uint32Array(values);
    const bytes = Buffer.from(data.buffer);
    chunks.push(bytes); views.push({ buffer: 0, byteOffset: offset, byteLength: bytes.length, target }); offset += bytes.length;
    accessors.push({ bufferView: views.length - 1, componentType, count: values.length / (type === 'VEC3' ? 3 : 1), type, ...bounds });
    return accessors.length - 1;
  }
  const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
  for (const mesh of meshes) {
    const positions = Float32Array.from(mesh.attributes.position.array);
    const meshMin = [Infinity, Infinity, Infinity], meshMax = [-Infinity, -Infinity, -Infinity];
    for (let i = 0; i < positions.length; i++) {
      if (!Number.isFinite(positions[i])) throw new Error('Door contains nonfinite positions.');
      const k = i % 3; meshMin[k] = Math.min(meshMin[k], positions[i]); meshMax[k] = Math.max(meshMax[k], positions[i]);
      min[k] = Math.min(min[k], positions[i]); max[k] = Math.max(max[k], positions[i]);
    }
    const attributes = { POSITION: attribute(positions, 5126, 'VEC3', 34962, { min: meshMin, max: meshMax }) };
    if (mesh.attributes.normal) attributes.NORMAL = attribute(mesh.attributes.normal.array, 5126, 'VEC3', 34962);
    const indices = attribute(mesh.index.array, 5125, 'SCALAR', 34963);
    models.push({ name: mesh.name || 'Door surface', primitives: [{ attributes, indices, mode: 4, material: 0 }] });
  }
  const binary = Buffer.concat(chunks);
  const document = { asset: { version: '2.0', generator: 'KaKue door preparation / occt-import-js 0.0.23' },
    scene: 0, scenes: [{ nodes: models.map((_, i) => i) }], nodes: models.map((_, i) => ({ mesh: i })), meshes: models,
    materials: [{ name: 'Door', pbrMetallicRoughness: { baseColorFactor: [0.62, 0.65, 0.68, 1], metallicFactor: 0.15, roughnessFactor: 0.65 }, doubleSided: true }],
    buffers: [{ byteLength: binary.length }], bufferViews: views, accessors,
    extras: { sourceSha256: identity.sha256, units: 'meter', frame: 'original STEP coordinates, Z up' } };
  const json = Buffer.from(JSON.stringify(document)); const padded = Buffer.alloc(Math.ceil(json.length / 4) * 4, 0x20); json.copy(padded);
  const glb = Buffer.alloc(28 + padded.length + binary.length);
  glb.writeUInt32LE(0x46546c67, 0); glb.writeUInt32LE(2, 4); glb.writeUInt32LE(glb.length, 8);
  glb.writeUInt32LE(padded.length, 12); glb.writeUInt32LE(0x4e4f534a, 16); padded.copy(glb, 20);
  glb.writeUInt32LE(binary.length, 20 + padded.length); glb.writeUInt32LE(0x004e4942, 24 + padded.length); binary.copy(glb, 28 + padded.length);
  return { glb, bounds: { min, max }, triangleCount: meshes.reduce((n, m) => n + m.index.array.length / 3, 0) };
}

try {
  const bytes = readFileSync(source);
  if (bytes.length !== identity.bytes || sha256(bytes) !== identity.sha256) throw new Error('Door source identity mismatch: only the supplied replacement STEP is accepted.');
  const command = process.argv[2];
  if (command === 'prepare') {
    const occt = await occtFactory();
    const result = occt.ReadStepFile(bytes, settings);
    if (!result.success) throw new Error('Door STEP parsing failed.');
    if (!result.meshes?.length || result.meshes.some(m => !m.index.array.length)) throw new Error('Door STEP has no usable mesh.');
    const { glb, bounds, triangleCount } = encodeGLB(result.meshes);
    const manifest = { schemaVersion: 1,
      source: { path: sourcePath, name: 'DOOR-of-CAR.step', format: 'STEP AP214', units: 'millimeter', provenance: 'User-supplied replacement STEP, 2026-10-04; no conversion', ...identity },
      importer: { package: 'occt-import-js', version: '0.0.23', settings },
      cache: { path: 'assets/door/door.glb', units: 'meter', geometryScope: 'Triangle surfaces only; original STEP loose edges/wires are preserved in source bytes', bytes: glb.length, sha256: sha256(glb), meshCount: result.meshes.length, triangleCount, bounds },
      verificationEvidence: 'docs/verification/door-native-report.json',
      placement: { status: 'Unplaced; issue #3 freezes part-to-base transform after independent pose checks' } };
    mkdirSync(output, { recursive: true });
    writeFileSync(join(output, 'door.glb'), glb);
    writeFileSync(join(output, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
    console.log(JSON.stringify(manifest));
  } else if (command === 'validate') {
    const cacheDirectory = option('--cache', null);
    if (cacheDirectory) {
      const manifest = JSON.parse(readFileSync(join(cacheDirectory, 'manifest.json'), 'utf8'));
      const cache = readFileSync(join(cacheDirectory, 'door.glb'));
      if (sha256(cache) !== manifest.cache.sha256) throw new Error('Door cache identity mismatch.');
      if (manifest.source?.sha256 !== identity.sha256 || manifest.source?.bytes !== identity.bytes || manifest.source?.units !== 'millimeter') throw new Error('Door cache provenance mismatch.');
      if (manifest.importer?.package !== 'occt-import-js' || manifest.importer?.version !== '0.0.23' || Object.entries(settings).some(([key, value]) => manifest.importer?.settings?.[key] !== value)) throw new Error('Door cache importer settings mismatch.');
    }
    console.log(JSON.stringify({ source, ...identity }));
  } else throw new Error('Usage: node door.mjs validate|prepare [--source path] [--output directory]');
} catch (error) {
  console.error(error.code === 'ENOENT' ? `Required door ${error.path === source ? 'STEP' : 'cache'} is missing: ${error.path}` : error.message);
  process.exitCode = 1;
}
