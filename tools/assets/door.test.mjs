import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync, copyFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const cli = new URL('./door.mjs', import.meta.url).pathname;

test('validation identifies an absent authoritative STEP without accepting another asset', () => {
  const missing = join(mkdtempSync(join(tmpdir(), 'door-missing-')), 'DOOR-of-CAR.step');
  const result = spawnSync(process.execPath, [cli, 'validate', '--source', missing], { encoding: 'utf8' });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Required door STEP is missing/);
});

test('validation rejects source bytes whose identity differs from the supplied replacement', () => {
  const changed = join(mkdtempSync(join(tmpdir(), 'door-invalid-')), 'DOOR-of-CAR.step');
  writeFileSync(changed, 'ISO-10303-21; END-ISO-10303-21;');
  const result = spawnSync(process.execPath, [cli, 'validate', '--source', changed], { encoding: 'utf8' });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Door source identity mismatch/);
});

test('preparation preserves the original STEP and produces a meter-space indexed GLB cache', () => {
  const source = new URL('../../3d files/car-front-door-1/DOOR-of-CAR.step', import.meta.url);
  const before = readFileSync(source);
  const output = mkdtempSync(join(tmpdir(), 'door-prepared-'));
  const result = spawnSync(process.execPath, [cli, 'prepare', '--output', output], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  const manifest = JSON.parse(readFileSync(join(output, 'manifest.json'), 'utf8'));
  assert.equal(manifest.source.sha256, 'a2662bda82f6bb30ffd70266ad4fc6398871c36c5d2803f138ef9abd57ef53ef');
  assert.equal(manifest.cache.units, 'meter');
  assert.deepEqual(readFileSync(source), before);
  assert.equal(createHash('sha256').update(before).digest('hex'), manifest.source.sha256);
  const glb = readFileSync(join(output, 'door.glb'));
  assert.equal(glb.readUInt32LE(0), 0x46546c67);
  assert.equal(glb.readUInt32LE(4), 2);
  const jsonLength = glb.readUInt32LE(12);
  const model = JSON.parse(glb.subarray(20, 20 + jsonLength).toString());
  assert.ok(model.meshes.length > 0);
  assert.ok(model.meshes.every(m => m.primitives.every(p => p.indices !== undefined)));
  assert.ok(model.accessors.filter(a => a.type === 'VEC3').some(a => a.min && a.max));
  const native = JSON.parse(readFileSync(new URL('../../docs/verification/door-native-report.json', import.meta.url), 'utf8'));
  const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
  for (const mesh of model.meshes) for (const primitive of mesh.primitives) {
    for (const name of ['POSITION', 'NORMAL']) {
      const accessor = model.accessors[primitive.attributes[name]];
      const view = model.bufferViews[accessor.bufferView];
      for (let vertex = 0; vertex < accessor.count; vertex++) {
        const vector = [0,1,2].map(k => glb.readFloatLE(28 + jsonLength + view.byteOffset + (vertex * 3 + k) * 4));
        assert.ok(vector.every(Number.isFinite));
        if (name === 'POSITION') for (let k = 0; k < 3; k++) {
          min[k] = Math.min(min[k], vector[k] * 1000); max[k] = Math.max(max[k], vector[k] * 1000);
        } else assert.ok(Math.abs(Math.hypot(...vector) - 1) < 1e-6);
      }
    }
  }
  for (let k = 0; k < 3; k++) {
    assert.ok(Math.abs(min[k] - native.nativeSurfaceBoundsMm.min[k]) <= 5);
    assert.ok(Math.abs(max[k] - native.nativeSurfaceBoundsMm.max[k]) <= 5);
  }
  assert.equal(createHash('sha256').update(glb).digest('hex'), createHash('sha256').update(readFileSync(new URL('../../assets/door/door.glb', import.meta.url))).digest('hex'));

});

test('validation refuses a corrupted derived cache instead of announcing readiness', () => {
  const output = mkdtempSync(join(tmpdir(), 'door-cache-corrupt-'));
  writeFileSync(join(output, 'door.glb'), 'broken-cache');
  writeFileSync(join(output, 'manifest.json'), JSON.stringify({ cache: { sha256: 'expected' } }));
  const result = spawnSync(process.execPath, [cli, 'validate', '--cache', output], { encoding: 'utf8' });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Door cache identity mismatch/);
});

test('GLB accessor bounds describe the serialized Float32 positions exactly', () => {
  const output = mkdtempSync(join(tmpdir(), 'door-glb-bounds-'));
  const result = spawnSync(process.execPath, [cli, 'prepare', '--output', output], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  const glb = readFileSync(join(output, 'door.glb'));
  const jsonLength = glb.readUInt32LE(12);
  const model = JSON.parse(glb.subarray(20, 20 + jsonLength).toString());
  const binaryStart = 28 + jsonLength;
  for (const mesh of model.meshes) for (const primitive of mesh.primitives) {
    const accessor = model.accessors[primitive.attributes.POSITION];
    const view = model.bufferViews[accessor.bufferView];
    const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
    for (let i = 0; i < accessor.count * 3; i++) {
      const value = glb.readFloatLE(binaryStart + view.byteOffset + i * 4);
      min[i % 3] = Math.min(min[i % 3], value); max[i % 3] = Math.max(max[i % 3], value);
    }
    assert.deepEqual(accessor.min, min);
    assert.deepEqual(accessor.max, max);
  }
});

test('a missing cache reports its own path while the authoritative STEP remains available', () => {
  const directory = mkdtempSync(join(tmpdir(), 'door-cache-missing-'));
  const result = spawnSync(process.execPath, [cli, 'validate', '--cache', directory], { encoding: 'utf8' });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Required door cache is missing/);
  assert.ok(result.stderr.includes(join(directory, 'manifest.json')));
});

test('validation rejects a cache manifest that claims a different original STEP', () => {
  const directory = mkdtempSync(join(tmpdir(), 'door-cache-provenance-'));
  const manifest = JSON.parse(readFileSync(new URL('../../assets/door/manifest.json', import.meta.url), 'utf8'));
  manifest.source.sha256 = 'another-source';
  copyFileSync(new URL('../../assets/door/door.glb', import.meta.url), join(directory, 'door.glb'));
  writeFileSync(join(directory, 'manifest.json'), JSON.stringify(manifest));
  const result = spawnSync(process.execPath, [cli, 'validate', '--cache', directory], { encoding: 'utf8' });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Door cache provenance mismatch/);
});

test('validation rejects a cache prepared with unverified tessellation settings', () => {
  const directory = mkdtempSync(join(tmpdir(), 'door-cache-settings-'));
  const manifest = JSON.parse(readFileSync(new URL('../../assets/door/manifest.json', import.meta.url), 'utf8'));
  manifest.importer.settings.linearDeflection = 0.5;
  copyFileSync(new URL('../../assets/door/door.glb', import.meta.url), join(directory, 'door.glb'));
  writeFileSync(join(directory, 'manifest.json'), JSON.stringify(manifest));
  const result = spawnSync(process.execPath, [cli, 'validate', '--cache', directory], { encoding: 'utf8' });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Door cache importer settings mismatch/);
});
