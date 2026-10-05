import { readFile, readdir, writeFile, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve, relative, sep } from 'node:path';
const root = resolve(import.meta.dirname, '..');
const args = process.argv.slice(2);
if (args.length && (args.length !== 2 || args[0] !== '--directory')) throw new Error('Usage: npm run verify:release -- [--directory PATH]');
const directory = resolve(root, args[1] ?? 'dist');
// A failed recheck must never leave a previous success inventory behind.
await rm(resolve(directory, 'release-manifest.json'), { force: true });
const json = async path => JSON.parse(await readFile(resolve(root, path), 'utf8'));
const [door, robot, pkg] = await Promise.all([json('assets/door/manifest.json'), json('assets/robot/robot-definition.json'), json('package.json')]);
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const check = async (path, expected) => {
  const bytes = await readFile(resolve(directory, path)).catch(() => { throw new Error(`Missing required release file: ${path}`); });
  if (expected && sha(bytes) !== expected) throw new Error(`Release identity mismatch: ${path}`);
  if (bytes.length === 0) throw new Error(`Empty required release file: ${path}`);
  return bytes;
};
await check('demo-v1/door/DOOR-of-CAR.step', door.source.sha256);
await check('demo-v1/door/door.glb', door.cache.sha256);
for (const link of robot.links) await check(`demo-v1/robot/${link.mesh}`, link.sha256);
for (const name of ['occt-import-js.js', 'occt-import-js.wasm', 'license.occt-import-js.txt', 'license.occt.txt']) {
  await check(`parser/occt-import-js/0.0.23/${name}`, sha(await readFile(resolve(root, 'node_modules/occt-import-js/dist', name))));
}
for (const name of await readdir(resolve(root, 'assets/runtime-notices'))) {
  await check(`demo-v1/notices/${name}`, sha(await readFile(resolve(root, 'assets/runtime-notices', name))));
}
const index = (await check('index.html')).toString();
const deploymentBase = process.env.BASE_PATH || '/';
if (!/^\/(?:[^?#]*\/)?$/.test(deploymentBase)) throw new Error('BASE_PATH must be an absolute local path ending in /.');
const baseUrl = new URL(deploymentBase, 'https://release.invalid');
const references = [...index.matchAll(/(?:src|href)="([^"]+)"/g)].map(match => match[1]);
for (const reference of references) {
  if (reference === 'data:,') continue; // Empty inline favicon makes no network request.
  if (/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(reference)) throw new Error(`Nonlocal release entry reference: ${reference}`);
  const url = new URL(reference, baseUrl);
  if (url.origin !== baseUrl.origin || !url.pathname.startsWith(baseUrl.pathname) || url.search || url.hash) throw new Error(`Entry outside declared deployment base: ${reference}`);
  const path = decodeURIComponent(url.pathname.slice(baseUrl.pathname.length));
  if (!path || path.startsWith('/') || path.includes('\\') || path.split('/').some(segment => segment === '..' || segment === '.')) throw new Error(`Invalid release entry: ${reference}`);
  await check(path);
}
if (!references.some(reference => reference.endsWith('.js'))) throw new Error('Missing compiled application entry.');
const assets = await readdir(resolve(directory, 'assets'));
for (const worker of ['step.worker-', 'preflight.worker-']) {
  const files = assets.filter(name => name.startsWith(worker) && name.endsWith('.js'));
  if (files.length !== 1) throw new Error(`Missing or ambiguous compiled worker: ${worker}`);
  await check(`assets/${files[0]}`);
}
const files = [];
async function inventory(path) {
  for (const entry of (await readdir(path, { withFileTypes: true })).sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0)) {
    const full = resolve(path, entry.name);
    if (entry.isDirectory()) await inventory(full);
    else if (entry.isFile()) {
      const name = relative(directory, full).split(sep).join('/');
      if (name === 'release-manifest.json') continue;
      const bytes = await readFile(full);
      files.push({ path: name, bytes: bytes.length, sha256: sha(bytes) });
    } else throw new Error(`Unsupported release entry: ${entry.name}`);
  }
}
await inventory(directory);
const report = { schemaVersion: 1, deploymentBase, package: pkg.name, version: pkg.version, sourceDoorSha256: door.source.sha256, sourceRobotSha256: robot.source.sha256, dependencies: pkg.dependencies, files, totalBytes: files.reduce((sum, file) => sum + file.bytes, 0) };
await writeFile(resolve(directory, 'release-manifest.json'), JSON.stringify(report, null, 2) + '\n');
console.log(`Verified static release: ${files.length} files, ${report.totalBytes} bytes. Inventory: ${relative(root, directory)}/release-manifest.json`);
