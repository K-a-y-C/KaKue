import { test, expect } from './fixtures';
import { resolve } from 'node:path';
const box = resolve('tests/fixtures/box-mm.step');
test('operator imports STEP at its physical size and starts at demo home', async ({ page }) => {
  await page.goto('./');
  await expect(page.getByRole('status')).toContainText('Scene ready');
  await page.getByLabel('Import STEP').setInputFiles(box);
  await expect(page.getByRole('status')).toHaveText('Loading model…');
  await expect(page.getByRole('status')).toContainText('Scene ready', { timeout: 20000 });
  await expect(page.getByText('box-mm.step', { exact: true })).toBeVisible();
  await expect(page.locator('dl')).toContainText('100.0 × 300.0 mm');
  await expect(page.locator('dl')).toContainText('900.0, 0.0, 800.0 mm');
});

test('equivalent millimeter and inch STEP retain physical size and known base coordinates', async ({ page }) => {
  test.skip(process.env.PREVIEW === '1', 'Public import module integration runs through Vite; production UI workflow is separate.');
  await page.goto('./');
  for (const name of ['box-mm.step', 'box-inch.STP']) {
    const bytes = Array.from(await (await import('node:fs/promises')).readFile(resolve('tests/fixtures', name)));
    const result = await page.evaluate(async ({ bytes, name }) => {
      const { importStep } = await import(String('/src/import/step-import.ts')) as typeof import('../../src/import/step-import');
      const part = await importStep(new File([new Uint8Array(bytes)], name), { signal: new AbortController().signal });
      const transform = new DOMMatrix(Array.from(part.partToBase));
      const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
      for (const mesh of part.meshes) for (let i = 0; i < mesh.positions.length; i += 3) {
        const p = transform.transformPoint(new DOMPoint(...Array.from(mesh.positions.slice(i, i + 3))));
        [p.x, p.y, p.z].forEach((n, axis) => { min[axis] = Math.min(min[axis], n); max[axis] = Math.max(max[axis], n); });
      }
      return { sourceUnits: part.sourceUnits, min, max };
    }, { bytes, name });
    expect(result.sourceUnits).toBe(name.includes('inch') ? 'inch' : 'millimeter');
    // Independent fixed-transform coordinates of native box corners, meters.
    for (const [actual, expected] of result.min.map((n, i) => [n, [.5203385949134826, -1.9353724360466003, -.067240297][i]])) expect(actual).toBeCloseTo(expected, 6);
    for (const [actual, expected] of result.max.map((n, i) => [n, [.7203385949134826, -1.8353724360466003, .232759703][i]])) expect(actual).toBeCloseTo(expected, 6);
  }
});

test('import ownership retains exact bytes after transfer and bundled source identity', async ({ page }) => {
  test.skip(process.env.PREVIEW === '1', 'Public module integration; production source is hash-checked separately.');
  await page.goto('./');
  const bytes = Array.from(await (await import('node:fs/promises')).readFile(box));
  const expectedHash = (await import('node:crypto')).createHash('sha256').update(new Uint8Array(bytes)).digest('hex');
  const result = await page.evaluate(async bytes => {
    const { importStep, loadBundledSource } = await import(String('/src/import/step-import.ts')) as typeof import('../../src/import/step-import');
    const part = await importStep(new File([new Uint8Array(bytes)], 'box.step'), { signal: new AbortController().signal });
    const bundled = await loadBundledSource({ signal: new AbortController().signal });
    return { bytes: Array.from(new Uint8Array(await part.source.arrayBuffer())), hash: part.sourceHash, bundledHash: bundled.sourceHash, bundledBytes: bundled.source.size };
  }, bytes);
  expect(result.bytes).toEqual(bytes);
  expect(result.hash).toBe(expectedHash);
  expect(result.bundledHash).toBe('a2662bda82f6bb30ffd70266ad4fc6398871c36c5d2803f138ef9abd57ef53ef');
  expect(result.bundledBytes).toBe(14456880);
});

test('replacement rejects stale callbacks and reload returns to import before a fresh session', async ({ page }) => {
  await page.goto('./');
  await expect(page.getByRole('status')).toContainText('Scene ready');
  // Worker is an external seam: deliver an already queued old result after cancellation.
  await page.evaluate(() => {
    const RealWorker = Worker;
    let count = 0;
    window.Worker = class extends RealWorker {
      constructor(url: string | URL, options?: WorkerOptions) {
        super(url, options);
        if (++count === 1) {
          const send = this.postMessage.bind(this);
          this.postMessage = ((...args: Parameters<Worker['postMessage']>) => {
            const stale = this.onmessage;
            setTimeout(() => stale?.call(this, new MessageEvent('message', { data: { error: { code: 'worker-failure', message: 'stale failure' } } })), 1500);
            setTimeout(() => stale?.call(this, new MessageEvent('message', { data: { sourceHash: 'stale', sourceUnits: 'meter', meshes: [{ name: 'stale', positions: new Float32Array([0,0,0,500,0,0,0,500,500]), indices: new Uint32Array([0,1,2]), faces: [] }] } })), 1600);
            send(...args);
          }) as Worker['postMessage'];
        }
      }
    };
  });
  await page.getByLabel('Import STEP').setInputFiles(box);
  await page.getByLabel('Import STEP').setInputFiles(resolve('tests/fixtures/box-inch.STP'));
  await expect(page.getByRole('status')).toContainText('Scene ready', { timeout: 20000 });
  await expect(page.getByText('box-inch.STP', { exact: true })).toBeVisible();
  await page.waitForTimeout(1700);
  await expect(page.getByRole('alert')).toHaveCount(0);
  await expect(page.locator('dl')).toContainText('100.0 × 300.0 mm');
  await expect(page.locator('dl')).toContainText('900.0, 0.0, 800.0 mm');
  await page.reload();
  await expect(page.getByRole('heading',{name:'Create a scan workspace'})).toBeVisible();
  await page.getByLabel('Import STEP').setInputFiles('3d files/car-front-door-1/DOOR-of-CAR.step');
  await expect(page.getByRole('status')).toContainText('Scene ready');
  await expect(page.getByText('DOOR-of-CAR.step', { exact: true })).toBeVisible();
  await expect(page.locator('dl')).toContainText('1212.5 × 1116.1 mm');
});

test('unsupported CATPart preserves the current part and permits another import', async ({ page }) => {
  await page.goto('./');
  await expect(page.getByRole('status')).toContainText('Scene ready');
  await page.getByLabel('Import STEP').setInputFiles({ name: 'door.CATPart', mimeType: 'application/octet-stream', buffer: Buffer.from('unsupported') });
  await expect(page.getByRole('alert')).toContainText('CATPart is not supported');
  await expect(page.getByText('DOOR-of-CAR.step', { exact: true })).toBeVisible();
  await expect(page.locator('dl')).toContainText('1212.5 × 1116.1 mm');
  await page.getByLabel('Import STEP').setInputFiles(box);
  await expect(page.getByRole('status')).toContainText('Scene ready');
  await expect(page.getByRole('alert')).toHaveCount(0);
});

test('50 MiB limit rejects before reading or worker allocation and accepts the exact limit', async ({ page }) => {
  test.skip(process.env.PREVIEW === '1', 'Public import interface test.');
  await page.goto('./');
  const outcomes = await page.evaluate(async () => {
    const { importStep } = await import(String('/src/import/step-import.ts')) as typeof import('../../src/import/step-import');
    const outcomes = [];
    for (const size of [50 * 1024 * 1024 + 1, 50 * 1024 * 1024]) {
      const file = new File([], 'large.step');
      Object.defineProperty(file, 'size', { value: size });
      file.arrayBuffer = async () => { throw new Error('read reached'); };
      try { await importStep(file, { signal: new AbortController().signal }); } catch (error) { outcomes.push((error as Error).message); }
    }
    return outcomes;
  });
  expect(outcomes).toEqual(['STEP exceeds the 50 MiB limit. Choose a smaller file.', 'read reached']);
});

test('empty STEP is rejected without losing the usable scene', async ({ page }) => {
  await page.goto('./');
  await expect(page.getByRole('status')).toContainText('Scene ready');
  await page.getByLabel('Import STEP').setInputFiles({ name: 'empty.step', mimeType: 'application/step', buffer: Buffer.alloc(0) });
  await expect(page.getByRole('alert')).toContainText('STEP is empty');
  await expect(page.locator('dl')).toContainText('1212.5 × 1116.1 mm');
});

test('malformed STEP leaves an unready session and recovers on a valid import', async ({ page }) => {
  await page.goto('./');
  await expect(page.getByRole('status')).toContainText('Scene ready');
  await page.getByLabel('Import STEP').setInputFiles({ name: 'broken.step', mimeType: 'application/step', buffer: Buffer.from('ISO-10303-21; invalid STEP') });
  await expect(page.getByRole('alert')).toContainText('Malformed STEP');
  await expect(page.getByRole('status')).toHaveText('Scene unavailable.');
  await expect(page.locator('dl')).toHaveCount(0);
  await page.getByLabel('Import STEP').setInputFiles(box);
  await expect(page.getByRole('status')).toContainText('Scene ready');
  await expect(page.getByRole('alert')).toHaveCount(0);
});

test('valid STEP without surfaces reports no usable mesh and allows recovery', async ({ page }) => {
  await page.goto('./');
  await expect(page.getByRole('status')).toContainText('Scene ready');
  await page.getByLabel('Import STEP').setInputFiles(resolve('tests/fixtures/point-only.step'));
  await expect(page.getByRole('alert')).toContainText('No usable mesh');
  await expect(page.getByRole('status')).toHaveText('Scene unavailable.');
  await page.getByLabel('Import STEP').setInputFiles(box);
  await expect(page.getByRole('status')).toContainText('Scene ready');
});

test('missing WASM reports parser initialization failure and a new import recovers', async ({ page }) => {
  await page.goto('./');
  await expect(page.getByRole('status')).toContainText('Scene ready');
  await page.route('**/parser/**/occt-import-js.wasm', route => route.fulfill({ status: 404, body: 'Missing WASM' }));
  await page.getByLabel('Import STEP').setInputFiles(box);
  await expect(page.getByRole('alert')).toContainText('Parser/WASM initialization failed');
  await expect(page.getByRole('status')).toHaveText('Scene unavailable.');
  await page.unroute('**/parser/**/occt-import-js.wasm');
  await page.getByLabel('Import STEP').setInputFiles(box);
  await expect(page.getByRole('status')).toContainText('Scene ready');
});

test('worker crash is truthful and another import uses a fresh worker', async ({ page }) => {
  await page.goto('./');
  await expect(page.getByRole('status')).toContainText('Scene ready');
  await page.evaluate(() => {
    const RealWorker = Worker;
    window.Worker = class extends RealWorker {
      constructor(url: string | URL, options?: WorkerOptions) {
        super(url, options); window.Worker = RealWorker;
        this.postMessage = () => { setTimeout(() => this.dispatchEvent(new ErrorEvent('error', { message: 'injected crash' })), 0); };
      }
    };
  });
  await page.getByLabel('Import STEP').setInputFiles(box);
  await expect(page.getByRole('alert')).toContainText('Worker failure');
  await expect(page.getByRole('status')).toHaveText('Scene unavailable.');
  await page.getByLabel('Import STEP').setInputFiles(box);
  // Cold WASM startup after a terminated worker can exceed the ordinary UI deadline.
  await expect(page.getByRole('status')).toContainText('Scene ready', {timeout:15000});
});

test('recognized allocation exhaustion is reported distinctly and recovers', async ({ page }) => {
  await page.goto('./');
  await expect(page.getByRole('status')).toContainText('Scene ready');
  await page.route('**/parser/**/occt-import-js.js', route => route.fulfill({ contentType: 'text/javascript', body: "self.occtimportjs = async () => ({ ReadStepFile() { throw new RangeError('Array buffer allocation failed'); } });" }));
  await page.getByLabel('Import STEP').setInputFiles(box);
  await expect(page.getByRole('alert')).toContainText('Memory exhausted');
  await page.unroute('**/parser/**/occt-import-js.js');
  await page.getByLabel('Import STEP').setInputFiles(box);
  await expect(page.getByRole('status')).toContainText('Scene ready');
});

test('parser geometry with invalid indices cannot become a ready part', async ({ page }) => {
  await page.goto('./');
  await expect(page.getByRole('status')).toContainText('Scene ready');
  await page.route('**/parser/**/occt-import-js.js', route => route.fulfill({ contentType: 'text/javascript', body: "self.occtimportjs = async () => ({ ReadStepFile() { return { success:true, meshes:[{name:'bad', attributes:{position:{array:[0,0,0,1,0,0,0,1,0]}},index:{array:[0,1,99]},brep_faces:[]}] }; } });" }));
  await page.getByLabel('Import STEP').setInputFiles(box);
  await expect(page.getByRole('alert')).toContainText('Invalid STEP geometry');
  await expect(page.getByRole('status')).toHaveText('Scene unavailable.');
  await page.unroute('**/parser/**/occt-import-js.js');
  await page.getByLabel('Import STEP').setInputFiles(box);
  await expect(page.getByRole('status')).toContainText('Scene ready');
});

test('degenerate-only parser output has no usable triangles', async ({ page }) => {
  await page.goto('./');
  await expect(page.getByRole('status')).toContainText('Scene ready');
  await page.route('**/parser/**/occt-import-js.js', route => route.fulfill({ contentType: 'text/javascript', body: "self.occtimportjs = async () => ({ ReadStepFile() { return {success:true,meshes:[{name:'flat',attributes:{position:{array:[0,0,0,1,0,0,2,0,0]}},index:{array:[0,1,2]},brep_faces:[]}]}; } });" }));
  await page.getByLabel('Import STEP').setInputFiles(box);
  await expect(page.getByRole('alert')).toContainText('No usable mesh');
  await expect(page.getByRole('status')).toHaveText('Scene unavailable.');
});

test('actual supplied door imports while camera remains responsive', async ({ page }, testInfo) => {
  test.setTimeout(120000);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('./');
  await expect(page.getByRole('status')).toContainText('Scene ready');
  const scene = page.getByRole('img', { name: '3D robot and door scene' });
  const started = Date.now();
  await page.getByLabel('Import STEP').setInputFiles(resolve('3d files/car-front-door-1/DOOR-of-CAR.step'));
  await expect(page.getByRole('status')).toHaveText('Loading model…');
  const before = await scene.screenshot();
  const bounds = (await scene.boundingBox())!;
  await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
  await page.mouse.down();
  await page.mouse.move(bounds.x + bounds.width / 2 + 80, bounds.y + bounds.height / 2 + 40, { steps: 8 });
  await page.mouse.up();
  await expect.poll(async () => !(await scene.screenshot()).equals(before), { timeout: 10000 }).toBeTruthy();
  await expect(page.getByRole('status')).toHaveText('Loading model…');
  await expect(page.getByRole('status')).toContainText('Scene ready', { timeout: 90000 });
  await expect(page.locator('dl')).toContainText('1212.5 × 1116.1 mm');
  await expect(page.locator('dl')).toContainText('900.0, 0.0, 800.0 mm');
  await (await import('node:fs/promises')).writeFile(testInfo.outputPath('door-import.json'), JSON.stringify({ elapsedMs: Date.now() - started, errors }, null, 2));
  await scene.screenshot({ path: testInfo.outputPath('imported-door.png') });
  expect(errors).toEqual([]);
});

test('production import serves worker, parser, WASM and exact STEP from same origin', async ({ page }) => {
  test.skip(process.env.PREVIEW !== '1', 'Static production acceptance.');
  const workers: string[] = [];
  const assets: { url: string; type: string }[] = [];
  page.on('worker', worker => workers.push(worker.url()));
  page.on('response', response => {
    if (response.url().includes('/parser/')) assets.push({ url: response.url(), type: response.headers()['content-type'] || '' });
  });
  await page.goto('./');
  await expect(page.getByRole('status')).toContainText('Scene ready');
  await page.getByLabel('Import STEP').setInputFiles(resolve('tests/fixtures/box-inch.STP'));
  await expect(page.getByRole('status')).toContainText('Scene ready');
  await expect(page.getByText('box-inch.STP', { exact: true })).toBeVisible();
  await expect(page.locator('dl')).toContainText('100.0 × 300.0 mm');
  expect(workers.length).toBe(1);
  const origin = new URL(page.url()).origin;
  expect(new URL(workers[0]).origin).toBe(origin);
  expect(assets.some(asset => asset.url.endsWith('.wasm') && asset.type.includes('application/wasm'))).toBeTruthy();
  expect(assets.some(asset => asset.url.endsWith('occt-import-js.js'))).toBeTruthy();
  expect(assets.every(asset => new URL(asset.url).origin === origin)).toBeTruthy();
  const response = await page.request.get(new URL('demo-v1/door/DOOR-of-CAR.step', page.url()).href);
  expect(response.ok()).toBeTruthy();
  expect((await import('node:crypto')).createHash('sha256').update(await response.body()).digest('hex')).toBe('a2662bda82f6bb30ffd70266ad4fc6398871c36c5d2803f138ef9abd57ef53ef');
});

test('worker startup failure has a readable category and import can retry', async ({ page }) => {
  await page.goto('./');
  await expect(page.getByRole('status')).toContainText('Scene ready');
  await page.evaluate(() => {
    const RealWorker = Worker;
    window.Worker = class extends RealWorker {
      constructor(url: string | URL, options?: WorkerOptions) {
        window.Worker = RealWorker;
        throw new DOMException('Blocked worker startup', 'SecurityError');
        super(url, options);
      }
    };
  });
  await page.getByLabel('Import STEP').setInputFiles(box);
  await expect(page.getByRole('alert')).toContainText('Worker failure');
  await page.getByLabel('Import STEP').setInputFiles(box);
  await expect(page.getByRole('status')).toContainText('Scene ready');
});

test('public import exposes a stable reason code for oversized input', async ({ page }) => {
  test.skip(process.env.PREVIEW === '1', 'Public module integration.');
  await page.goto('./');
  const code = await page.evaluate(async () => {
    const { importStep } = await import(String('/src/import/step-import.ts')) as typeof import('../../src/import/step-import');
    const file = new File([], 'large.step');
    Object.defineProperty(file, 'size', { value: 50 * 1024 * 1024 + 1 });
    try { await importStep(file, { signal: new AbortController().signal }); } catch (error) { return (error as Error & { code?: string }).code; }
  });
  expect(code).toBe('oversized');
});

test('actual supplied STEP retains exact source bytes and accepted base geometry', async ({ page }) => {
  test.skip(process.env.PREVIEW === '1', 'Public module contract; production actual-door UI is separately verified.');
  test.setTimeout(90000);
  await page.goto('./');
  const result = await page.evaluate(async () => {
    const { importStep } = await import(String('/src/import/step-import.ts')) as typeof import('../../src/import/step-import');
    const original = await (await fetch('/demo-v1/door/DOOR-of-CAR.step')).blob();
    const part = await importStep(new File([original], 'DOOR-of-CAR.step'), { signal: new AbortController().signal });
    const input = new Uint8Array(await original.arrayBuffer()), retained = new Uint8Array(await part.source.arrayBuffer());
    const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
    const transform = new DOMMatrix(Array.from(part.partToBase));
    for (const mesh of part.meshes) for (let i = 0; i < mesh.positions.length; i += 3) {
      const p = transform.transformPoint(new DOMPoint(...Array.from(mesh.positions.slice(i, i + 3))));
      [p.x, p.y, p.z].forEach((n, axis) => { min[axis] = Math.min(min[axis], n); max[axis] = Math.max(max[axis], n); });
    }
    return { equal: input.length === retained.length && input.every((n, i) => n === retained[i]), hash: part.sourceHash, bytes: part.source.size, units: part.sourceUnits, min, max, faceCount: part.meshes.reduce((n, mesh) => n + mesh.faces.length, 0) };
  });
  expect(result.equal).toBeTruthy();
  expect(result.hash).toBe('a2662bda82f6bb30ffd70266ad4fc6398871c36c5d2803f138ef9abd57ef53ef');
  expect(result.bytes).toBe(14456880);
  expect(result.units).toBe('millimeter');
  expect(result.faceCount).toBeGreaterThan(0);
  const expectedMin = [1.4, -.606226981, 0], expectedMax = [1.778640175, .606226981, 1.116116417];
  result.min.forEach((n, i) => expect(Math.abs(n - expectedMin[i])).toBeLessThan(.005));
  result.max.forEach((n, i) => expect(Math.abs(n - expectedMax[i])).toBeLessThan(.005));
});

test('coordinates that overflow render buffers are rejected before scene installation', async ({ page }) => {
  await page.goto('./');
  await expect(page.getByRole('status')).toContainText('Scene ready');
  await page.route('**/parser/**/occt-import-js.js', route => route.fulfill({ contentType: 'text/javascript', body: "self.occtimportjs = async () => ({ ReadStepFile() { return {success:true,meshes:[{name:'overflow',attributes:{position:{array:[1e100,0,0,0,1,0,0,0,1]}},index:{array:[0,1,2]},brep_faces:[]}]}; } });" }));
  await page.getByLabel('Import STEP').setInputFiles(box);
  await expect(page.getByRole('alert')).toContainText('Invalid STEP geometry');
  await expect(page.getByRole('status')).toHaveText('Scene unavailable.');
});
