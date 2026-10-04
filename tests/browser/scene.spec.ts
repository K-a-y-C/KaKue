import { writeFile } from 'node:fs/promises';
import { test, expect } from '@playwright/test';
test('presenter opens the actual fixed robot and door scene', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  const meshes = new Set<string>();
  page.on('response', response => { if (response.url().endsWith('.glb') && response.ok()) meshes.add(new URL(response.url()).pathname); });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Robot Door Scan Demo' })).toBeVisible();
  await expect(page.getByRole('status')).toHaveText('Scene ready — inspect the fixed door and robot.');
  await expect(page.getByRole('img', { name: '3D robot and door scene' })).toBeVisible();
  expect(meshes.size).toBe(8);
  await writeFile(testInfo.outputPath('scene-load.json'), JSON.stringify(await page.evaluate(() => ({ readyAfterNavigationMs: performance.now(), assetRequests: performance.getEntriesByType('resource').filter(entry => entry.name.endsWith('.glb')).map(entry => ({ url: entry.name, bytes: (entry as PerformanceResourceTiming).encodedBodySize })) })), null, 2));
  await expect(page.getByText('DOOR-of-CAR.step', { exact: true })).toBeVisible();
  await expect(page.locator('dl')).toContainText('1212.5 × 1116.1 mm');
  await expect(page.locator('dl')).toContainText('900.0, 0.0, 800.0 mm');
  for (const size of [{ width: 1440, height: 900 }, { width: 1280, height: 800 }]) {
    await page.setViewportSize(size);
    await page.screenshot({ path: testInfo.outputPath(`scene-${size.width}.png`) });
  }
  expect(errors).toEqual([]);
});

test('missing supplied door cache has a readable asset outcome', async ({ page }) => {
  await page.route('**/demo-v1/door/door.glb', route => route.fulfill({ status: 404, body: 'Missing door' }));
  await page.goto('/');
  await expect(page.getByRole('alert')).toContainText('Required asset unavailable: door/door.glb');
  await expect(page.getByRole('status')).toHaveText('Scene unavailable.');
});

test('WebGL2 unavailable reports the browser requirement', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, ...args: Parameters<typeof original>) {
      if (String(args[0]) === 'webgl2') return null;
      return original.apply(this, args);
    } as typeof original;
  });
  await page.goto('/');
  await expect(page.getByRole('alert')).toContainText('WebGL2 is required');
  await expect(page.getByRole('status')).toHaveText('Scene unavailable.');
  expect(errors).toEqual([]);
});


test('orbit, pan and zoom inspect the camera without changing scene measurements', async ({ page }, testInfo) => {
  test.setTimeout(60000);
  await page.goto('/');
  await expect(page.getByRole('status')).toContainText('Scene ready');
  const scene = page.getByRole('img', { name: '3D robot and door scene' });
  const fixed = await page.locator('dl').innerText();
  let before = await scene.screenshot();
  const bounds = (await scene.boundingBox())!;
  const center = { x: bounds.x + bounds.width*.5, y: bounds.y + bounds.height*.5 };
  for (const gesture of ['orbit', 'pan', 'zoom']) {
    await page.mouse.move(center.x, center.y);
    if (gesture === 'zoom') await page.mouse.wheel(0, -300);
    else {
      await page.mouse.down({ button: gesture === 'pan' ? 'right' : 'left' });
      await page.mouse.move(center.x + 90, center.y + 45, { steps: 12 });
      await page.mouse.up({ button: gesture === 'pan' ? 'right' : 'left' });
    }
    await expect.poll(async () => !(await scene.screenshot()).equals(before), { message: gesture + ' changes the camera image', timeout: 10000 }).toBeTruthy();
    await scene.screenshot({ path: testInfo.outputPath(gesture + '.png') });
    expect(await page.locator('dl').innerText()).toBe(fixed);
    before = await scene.screenshot();
  }
});
