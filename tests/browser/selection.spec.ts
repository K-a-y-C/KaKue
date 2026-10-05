import { test, expect } from '@playwright/test';
test('stationary actual door skin click appends a numbered coordinate row', async ({ page }, info) => {
  await page.goto('./');
  await expect(page.getByRole('status')).toContainText('Scene ready');
  await page.mouse.click(704, 498);
  await expect(page.getByRole('table', { name: 'Selected surface points' }).getByRole('row')).toHaveCount(2);
  await expect(page.getByRole('row').last()).toContainText('Selected');
  await page.screenshot({ path: info.outputPath('selected-door.png') });
});

test('orbit drag past five CSS pixels cannot append a point', async ({ page }) => {
  await page.goto('./'); await expect(page.getByRole('status')).toContainText('Scene ready');
  await page.mouse.move(704, 498); await page.mouse.down();
  await page.mouse.move(710, 498); await page.mouse.up();
  await expect(page.getByRole('row')).toHaveCount(1);
});

test('multitouch gesture cannot append a surface selection', async ({ page }) => {
  await page.goto('./'); await expect(page.getByRole('status')).toContainText('Scene ready');
  const session=await page.context().newCDPSession(page);
  await session.send('Input.dispatchTouchEvent',{ type:'touchStart',touchPoints:[{x:704,y:498,id:51}] });
  await session.send('Input.dispatchTouchEvent',{ type:'touchStart',touchPoints:[{x:704,y:498,id:51},{x:708,y:498,id:52}] });
  await session.send('Input.dispatchTouchEvent',{ type:'touchEnd',touchPoints:[{x:708,y:498,id:52}] });
  await session.send('Input.dispatchTouchEvent',{ type:'touchEnd',touchPoints:[] });
  await expect(page.getByRole('row')).toHaveCount(1);
});

test('right-click is camera interaction and cannot select', async ({ page }) => {
  await page.goto('./'); await expect(page.getByRole('status')).toContainText('Scene ready');
  await page.mouse.click(704,498,{button:'right'});
  await expect(page.getByRole('row')).toHaveCount(1);
});

test('cancelled touch recovers for a subsequent single click', async ({ page }) => {
  await page.goto('./'); await expect(page.getByRole('status')).toContainText('Scene ready');
  const session=await page.context().newCDPSession(page);
  await session.send('Input.dispatchTouchEvent',{ type:'touchStart',touchPoints:[{x:704,y:498,id:51}] });
  await session.send('Input.dispatchTouchEvent',{ type:'touchCancel',touchPoints:[] });
  await page.mouse.click(704,498);
  await expect(page.getByRole('row')).toHaveCount(2);
});

test('unverified bundled STEP prevents selection even when the cache is visible', async ({ page }) => {
  let sourceRequested!: () => void;
  const requested=new Promise<void>(resolve => { sourceRequested=resolve; });
  let release!: () => void;
  const held=new Promise<void>(resolve => { release=resolve; });
  await page.route('**/demo-v1/door/DOOR-of-CAR.step',async route => { sourceRequested(); await held; await route.fulfill({status:404,body:'Missing source'}); });
  await page.goto('./'); await requested;
  await page.mouse.click(704,498);
  await expect(page.getByRole('row')).toHaveCount(1);
  release(); await expect(page.getByRole('alert')).toContainText('Required asset unavailable');
  await page.mouse.click(704,498); await expect(page.getByRole('row')).toHaveCount(1);
});

test('duplicates retain numbered order and stable stored surface coordinates while camera changes', async ({ page }, info) => {
  await page.goto('./'); await expect(page.getByRole('status')).toContainText('Scene ready');
  await page.mouse.click(704,498); await page.mouse.click(704,498);
  const rows=page.getByRole('table').getByRole('row'); await expect(rows).toHaveCount(3);
  const first=await rows.nth(1).innerText();
  expect((await rows.nth(2).innerText()).slice(1)).toBe(first.slice(1));
  for (const row of [rows.nth(1),rows.nth(2)]) {
    const normal=(await row.getAttribute('data-base-normal'))!.split(',').map(Number);
    expect(Math.hypot(...normal)).toBeCloseTo(1,10); expect(normal[0]).toBeLessThan(0);
    for (const value of (await row.locator('td').allTextContents()).slice(0,3)) expect(value).toMatch(/^-?\d+\.\d$/);
  }
  await page.mouse.move(560,450); await page.mouse.down(); await page.mouse.move(620,470,{steps:10}); await page.mouse.up(); await page.mouse.wheel(0,-100);
  expect(await rows.nth(1).innerText()).toBe(first); await expect(rows).toHaveCount(3);
  await page.getByRole('heading',{ name:'Selected points (2)' }).scrollIntoViewIfNeeded();
  await page.screenshot({path:info.outputPath('selected-1440.png')});
  await page.setViewportSize({width:1280,height:800}); await page.screenshot({path:info.outputPath('selected-1280.png')});
  await rows.last().scrollIntoViewIfNeeded(); await page.screenshot({path:info.outputPath('selected-scrolled-1280.png')});
});

test('outside release, empty window, floor, robot and scanner clicks are ignored', async ({ page }) => {
  await page.goto('./'); await expect(page.getByRole('status')).toContainText('Scene ready');
  for (const [x,y] of [[691,452],[400,425],[583,497],[320,800],[50,170]]) { await page.mouse.click(x,y); await expect(page.getByRole('row')).toHaveCount(1); }
  await page.mouse.move(704,498); await page.mouse.down(); await page.mouse.move(1200,498); await page.mouse.up();
  await expect(page.getByRole('row')).toHaveCount(1);
  await page.reload(); await expect(page.getByRole('status')).toContainText('Scene ready');
  await page.mouse.move(704,498); await page.mouse.down(); await page.mouse.move(714,498); await page.mouse.move(704,498); await page.mouse.up();
  await expect(page.getByRole('row')).toHaveCount(1);
});

test('second touch outside the canvas disqualifies the canvas gesture', async ({ page }) => {
  await page.goto('./'); await expect(page.getByRole('status')).toContainText('Scene ready');
  const session=await page.context().newCDPSession(page);
  await session.send('Input.dispatchTouchEvent',{ type:'touchStart',touchPoints:[{x:704,y:498,id:51}] });
  await session.send('Input.dispatchTouchEvent',{ type:'touchStart',touchPoints:[{x:704,y:498,id:51},{x:1250,y:498,id:52}] });
  await session.send('Input.dispatchTouchEvent',{ type:'touchEnd',touchPoints:[{x:1250,y:498,id:52}] });
  await session.send('Input.dispatchTouchEvent',{ type:'touchEnd',touchPoints:[] });
  await expect(page.getByRole('row')).toHaveCount(1);
});

test('independent rigid fixture retains local/base coordinates and interpolated approach normal on both sides', async ({ page }) => {
  test.skip(process.env.PREVIEW==='1','Public module fixture runs via Vite; production uses actual supplied door UI.');
  await page.goto('./'); await expect(page.getByRole('status')).toContainText('Scene ready');
  const points=await page.evaluate(async () => {
    const THREE=await import(performance.getEntriesByType('resource').find(entry => /\/three\.js\?/.test(entry.name))!.name) as typeof import('three');
    const { surfaceSelection }=await import(String('/src/scene/surface-selection.ts')) as typeof import('../../src/scene/surface-selection');
    const canvas=document.createElement('canvas'); canvas.style.cssText='position:fixed;left:0;top:0;width:100px;height:100px'; document.body.append(canvas);
    const scene=new THREE.Scene(), part=new THREE.Group(); scene.add(part);
    part.position.set(1,2,3); part.rotation.z=Math.PI/2;
    const geometry=new THREE.BufferGeometry(); geometry.setAttribute('position',new THREE.Float32BufferAttribute([0,0,0,2,0,0,0,2,0],3)); geometry.setIndex([0,1,2]); geometry.setAttribute('normal',new THREE.Float32BufferAttribute([0,0,2,2,0,2,0,2,2],3));
    const mesh=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({side:THREE.DoubleSide})); mesh.position.set(.1,.2,.3); part.add(mesh);
    const camera=new THREE.PerspectiveCamera(40,1,.01,10); const records: import('../../src/scene/surface-selection').SelectedPoint[]=[];
    const picking=surfaceSelection(canvas,camera,scene,()=>part,point=>records.push(point));
    for (const z of [5.3,1.3]) {
      camera.position.set(.3,2.6,z); camera.up.set(0,1,0); camera.lookAt(.3,2.6,3.3); camera.updateMatrixWorld(true);
      for (const type of ['pointerdown','pointerup']) canvas.dispatchEvent(new PointerEvent(type,{bubbles:true,pointerId:1,button:0,clientX:50,clientY:50}));
    }
    geometry.deleteAttribute('normal'); camera.position.set(.3,2.6,5.3); camera.lookAt(.3,2.6,3.3); camera.updateMatrixWorld(true);
    for (const type of ['pointerdown','pointerup']) canvas.dispatchEvent(new PointerEvent(type,{bubbles:true,pointerId:1,button:0,clientX:50,clientY:50}));
    picking.dispose(); geometry.dispose(); mesh.material.dispose(); canvas.remove(); return records;
  });
  expect(points).toHaveLength(3);
  expect(points[2].baseNormal).toEqual([0,0,1]);
  for (const [index,point] of points.slice(0,2).entries()) {
    for (const [axis,expected] of [.6,.7,.3].entries()) expect(Math.abs(point.partPosition[axis]-expected)*1000).toBeLessThanOrEqual(5);
    for (const [axis,expected] of [.3,2.6,3.3].entries()) expect(Math.abs(point.basePosition[axis]-expected)*1000).toBeLessThanOrEqual(5);
    const sign=index===0?1:-1;
    for (const [axis,expected] of [-.5/Math.sqrt(4.5),.5/Math.sqrt(4.5),2/Math.sqrt(4.5)].entries()) expect(point.baseNormal[axis]).toBeCloseTo(expected*sign,10);
    for (const [axis,expected] of [.5/Math.sqrt(4.5),.5/Math.sqrt(4.5),2/Math.sqrt(4.5)].entries()) expect(point.partNormal[axis]).toBeCloseTo(expected*sign,10);
    expect(point.triangleIndex).toBe(0); expect(point.meshIndex).toBe(0); expect(point.order).toBe(index+1);
  }
});

test('invalid format preserves selections but eligible failed and successful imports clear them', async ({ page }) => {
  await page.goto('./'); await expect(page.getByRole('status')).toContainText('Scene ready');
  await page.mouse.click(704,498); await expect(page.getByRole('row')).toHaveCount(2);
  await page.getByLabel('Import STEP').setInputFiles({name:'bad.CATPart',mimeType:'application/octet-stream',buffer:Buffer.from('unsupported')});
  await expect(page.getByRole('alert')).toContainText('CATPart'); await expect(page.getByRole('row')).toHaveCount(2);
  await page.getByLabel('Import STEP').setInputFiles({name:'bad.step',mimeType:'application/octet-stream',buffer:Buffer.from('not STEP')});
  await expect(page.getByRole('row')).toHaveCount(1); await expect(page.getByRole('alert')).toContainText('Malformed');
  await page.getByLabel('Import STEP').setInputFiles('3d files/car-front-door-1/DOOR-of-CAR.step');
  await expect(page.getByRole('status')).toContainText('Scene ready',{timeout:20000});
  await page.mouse.click(704,498); await expect(page.getByRole('row')).toHaveCount(2); await expect(page.getByRole('row').last().getByRole('rowheader')).toHaveText('1');
  await page.getByLabel('Import STEP').setInputFiles('tests/fixtures/box-mm.step'); await expect(page.getByRole('row')).toHaveCount(1);
  await expect(page.getByRole('status')).toContainText('Scene ready',{timeout:20000});
  await expect(page.getByRole('row')).toHaveCount(1);
});

test('foreground non-door object cannot select a door surface behind it', async ({ page }) => {
  test.skip(process.env.PREVIEW==='1','Public picking integration fixture is served by Vite.');
  await page.goto('./'); await expect(page.getByRole('status')).toContainText('Scene ready');
  const count=await page.evaluate(async () => {
    const THREE=await import(performance.getEntriesByType('resource').find(entry => /\/three\.js\?/.test(entry.name))!.name) as typeof import('three');
    const {surfaceSelection}=await import(String('/src/scene/surface-selection.ts')) as typeof import('../../src/scene/surface-selection');
    const canvas=document.createElement('canvas'); canvas.style.cssText='position:fixed;left:0;top:0;width:100px;height:100px'; document.body.append(canvas);
    const scene=new THREE.Scene(),part=new THREE.Group(); scene.add(part);
    const skin=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial()); part.add(skin);
    const robot=new THREE.Mesh(new THREE.BoxGeometry(.5,.5,.5),new THREE.MeshBasicMaterial()); robot.position.z=1; scene.add(robot);
    const camera=new THREE.PerspectiveCamera(40,1,.01,10); camera.position.z=2; camera.lookAt(0,0,0); camera.updateMatrixWorld(true); scene.updateMatrixWorld(true);
    let count=0; const selection=surfaceSelection(canvas,camera,scene,()=>part,()=>count++);
    for (const type of ['pointerdown','pointerup']) canvas.dispatchEvent(new PointerEvent(type,{bubbles:true,pointerId:1,button:0,clientX:50,clientY:50}));
    selection.dispose(); skin.geometry.dispose(); skin.material.dispose(); robot.geometry.dispose(); robot.material.dispose(); canvas.remove(); return count;
  });
  expect(count).toBe(0);
});

test('actual robot in front of the door after orbit remains unselectable', async ({ page }, info) => {
  await page.goto('./'); await expect(page.getByRole('status')).toContainText('Scene ready');
  await page.mouse.move(560,450); await page.mouse.down(); await page.mouse.move(684,398,{steps:15}); await page.mouse.up();
  await page.getByRole('img',{name:'3D robot and door scene'}).screenshot({path:info.outputPath('occluded-door.png')});
  await page.mouse.click(550,550);
  await expect(page.getByRole('row')).toHaveCount(1);
});
