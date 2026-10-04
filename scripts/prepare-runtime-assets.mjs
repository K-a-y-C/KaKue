import { readFile, mkdir, writeFile, cp } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
const root = resolve(import.meta.dirname, '..');
const robot = JSON.parse(await readFile(resolve(root, 'assets/robot/robot-definition.json')));
const door = JSON.parse(await readFile(resolve(root, 'assets/door/manifest.json')));
const assets = [['assets/door/door.glb', door.cache.sha256], ...robot.links.map(link => ['assets/robot/'+link.mesh, link.sha256])];
for (const [path, hash] of assets) {
  const bytes = await readFile(resolve(root, path));
  if (createHash('sha256').update(bytes).digest('hex') !== hash) throw new Error('Runtime asset identity mismatch: '+path);
  const output = resolve(root, 'public/demo-v1', path.replace('assets/', ''));
  await mkdir(resolve(output, '..'), { recursive: true });
  await writeFile(output, bytes);
}
console.log('Verified and staged eight actual CAD caches for same-origin serving.');
await cp(resolve(root, 'assets/runtime-notices'), resolve(root, 'public/demo-v1/notices'), { recursive: true });
const source = await readFile(resolve(root, door.source.path));
if (source.byteLength !== door.source.bytes || createHash('sha256').update(source).digest('hex') !== door.source.sha256) throw new Error('Bundled STEP identity mismatch');
await writeFile(resolve(root, 'public/demo-v1/door/DOOR-of-CAR.step'), source);
const parserOutput = resolve(root, 'public/parser/occt-import-js/0.0.23');
await mkdir(parserOutput, { recursive: true });
for (const name of ['occt-import-js.js', 'occt-import-js.wasm', 'license.occt-import-js.txt', 'license.occt.txt']) await cp(resolve(root, 'node_modules/occt-import-js/dist', name), resolve(parserOutput, name));
