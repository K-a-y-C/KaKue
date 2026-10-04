import { test, expect } from '@playwright/test';
import { resolve } from 'node:path';
const box = resolve('tests/fixtures/box-mm.step');
test('operator imports STEP at its physical size and starts at demo home', async ({ page }) => {
  await page.goto('/');
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
  await page.goto('/');
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
  await page.goto('/');
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
