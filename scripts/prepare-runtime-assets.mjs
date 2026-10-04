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
