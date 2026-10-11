import {test,expect} from './fixtures';

test('imported actual CAD opens the grouped Scan ribbon without a title Simulation badge',async({page})=>{
 await page.goto('./');await expect(page.getByRole('status')).toContainText('Scene ready');
 await expect(page.locator('main > header .title-bar > span.environment')).toHaveCount(0);
 await expect(page.getByRole('tab',{name:'Scan',exact:true})).toHaveAttribute('aria-selected','true');
 const ribbon=page.getByRole('region',{name:'Scan commands'});
 for(const group of ['CAD','Selection','Scanner','Sequence','Output'])await expect(ribbon.getByRole('group',{name:group,exact:true})).toBeVisible();
 for(const command of ['Import CAD','Select surface point','Set stand-off','Run','Stop','Export'])await expect(ribbon.getByRole('button',{name:command,exact:true})).toBeVisible();
 await expect(page.getByLabel('Application status')).toContainText('Simulation');
});

test('workflow previews are keyboard accessible, dismiss menus and leave the actual session untouched',async({page})=>{
 await page.goto('./');await expect(page.getByRole('status')).toContainText('Scene ready');
 const canvas=page.getByRole('img',{name:'3D robot and door scene'}),joints=await canvas.getAttribute('data-joint-angles');
 await page.getByRole('tab',{name:'Geometry',exact:true}).click();
 await expect(page.getByRole('region',{name:'Geometry commands'})).toBeVisible();
 const measure=page.getByRole('button',{name:'Measure',exact:true});await expect(measure).toBeEnabled();await expect(measure).toHaveAttribute('title','Measure · Preview command');
 await measure.focus();await page.keyboard.press('Enter');await expect(page.getByLabel('Application status')).toContainText('Measure — preview command');
 await expect(page.getByLabel('Application status')).not.toContainText('Measure — preview command',{timeout:5000});
 const file=page.getByRole('button',{name:'File',exact:true});await file.click();await page.getByRole('button',{name:'Save project',exact:true}).click();await expect(page.getByLabel('Application status')).toContainText('Save project — preview command');
 await file.click();await page.keyboard.press('Escape');await expect(file).toBeFocused();await expect(file).toHaveAttribute('aria-expanded','false');
 await page.getByRole('tab',{name:'Scan',exact:true}).click();await page.getByRole('button',{name:'Clear selection',exact:true}).click();
 await expect(canvas).toHaveAttribute('data-joint-angles',joints!);await expect(page.getByRole('row')).toHaveCount(1);await expect(page.getByLabel('Stand-off (mm)')).toHaveValue('100');await expect(page.getByRole('button',{name:'Run',exact:true})).toBeDisabled();
});

test('stand-off editor applies a validated distance and cancels or escapes draft changes',async({page})=>{
 await page.goto('./');await expect(page.getByRole('status')).toContainText('Scene ready');
 const command=page.getByRole('button',{name:'Set stand-off',exact:true});await command.click();const dialog=page.getByRole('dialog',{name:'Set stand-off'});
 await expect(dialog).toBeVisible();await dialog.getByRole('spinbutton',{name:'Stand-off'}).fill('500');await dialog.getByRole('button',{name:'Apply'}).click();await expect(page.getByLabel('Stand-off (mm)')).toHaveValue('500');await expect(command).toBeFocused();
 await command.click();await dialog.getByRole('spinbutton').fill('50');await dialog.getByRole('button',{name:'Cancel'}).click();await expect(page.getByLabel('Stand-off (mm)')).toHaveValue('500');
 await command.click();await dialog.getByRole('spinbutton').fill('501');await expect(dialog.getByRole('button',{name:'Apply'})).toBeDisabled();await page.keyboard.press('Escape');await expect(dialog).toHaveCount(0);await expect(command).toBeFocused();
 await command.click();await dialog.getByRole('spinbutton').fill('50');await dialog.getByRole('button',{name:'Apply'}).click();await expect(page.getByLabel('Stand-off (mm)')).toHaveValue('50');
});

test('docked project and data panes preserve surface hits and fit both desktop sizes',async({page})=>{
 const {clickScene}=await import('./scene-clicks');
 await page.goto('./');await expect(page.getByRole('status')).toContainText('Scene ready');
 const tree=page.getByRole('region',{name:'Scene tree'});await expect(tree).toContainText('Imported part — DOOR-of-CAR.step');
 await tree.getByRole('button',{name:'Expand Robot assembly'}).click();await expect(tree.getByRole('button',{name:'Link 6',exact:true})).toBeVisible();
 await tree.getByRole('textbox',{name:'Filter project outline'}).fill('Scanner');await expect(tree.getByRole('button',{name:'Scanner',exact:true})).toBeVisible();await expect(tree.getByRole('button',{name:'Link 6',exact:true})).toHaveCount(0);await tree.getByRole('textbox').fill('');
 await clickScene(page,704,498);await expect(tree).toContainText('Surface points (1)');
 await page.getByRole('tab',{name:'Scan data',exact:true}).click();await expect(page.getByRole('row')).toHaveCount(2);const row=await page.getByRole('row').last().innerText();
 await page.getByRole('tab',{name:'Properties',exact:true}).click();await page.getByRole('button',{name:'Model properties',exact:true}).click();await expect(page.getByLabel('Scene measurements')).toBeVisible();
 await page.getByRole('tab',{name:'Scan data',exact:true}).click();expect(await page.getByRole('row').last().innerText()).toBe(row);
 for(const size of [{width:1440,height:900},{width:1280,height:800}]){
  await page.setViewportSize(size);const canvas=page.getByRole('img',{name:'3D robot and door scene'});
  await expect.poll(async()=>{const b=(await canvas.boundingBox())!;return {x:b.x,y:b.y,width:b.width,height:b.height};}).toEqual({x:221,y:188,width:size.width-492,height:size.height-212});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth&&document.documentElement.scrollHeight<=innerHeight)).toBe(true);
  for(const name of ['Import CAD','Select surface point','Set stand-off','Run','Stop','Export']){const b=(await page.getByRole('button',{name,exact:true}).boundingBox())!;expect(b.x+b.width).toBeLessThanOrEqual(size.width);const label=page.getByRole('button',{name,exact:true}).getByText(name,{exact:true});expect(await label.evaluate(e=>e.scrollHeight/parseFloat(getComputedStyle(e).lineHeight))).toBeLessThanOrEqual(2.1);}
  await page.screenshot({path:`docs/verification/ribbon-imported-${size.width}${process.env.PREVIEW==='1'?'-production':''}.png`});
 }
});

test('preview tabs stay usable during a run while Stop remains visible and real settings stay locked',async({page})=>{
 const {clickScene}=await import('./scene-clicks');await page.goto('./');await expect(page.getByRole('status')).toContainText('Scene ready');await clickScene(page,704,498);await clickScene(page,712,520);
 await page.getByRole('button',{name:'Run',exact:true}).click();await expect(page.getByRole('row').nth(1)).toContainText('Moving');
 for(const size of [{width:1440,height:900},{width:1280,height:800}]){await page.setViewportSize(size);await page.screenshot({path:`docs/verification/ribbon-running-${size.width}${process.env.PREVIEW==='1'?'-production':''}.png`});}
 await page.getByRole('tab',{name:'Geometry',exact:true}).click();await expect(page.getByRole('button',{name:'Stop',exact:true})).toBeVisible();await expect(page.getByRole('button',{name:'Stop',exact:true})).toBeEnabled();
 await page.getByRole('button',{name:'Measure',exact:true}).click();await expect(page.getByLabel('Application status')).toContainText('Measure — preview command');
 await page.getByRole('button',{name:'File',exact:true}).click();await expect(page.getByRole('button',{name:'Import CAD',exact:true})).toBeDisabled();await page.keyboard.press('Escape');
 await page.getByRole('button',{name:'Stop',exact:true}).click();await expect(page.getByRole('status')).toContainText('Simulation stopped');
 await page.getByRole('tab',{name:'Scan',exact:true}).click();await expect(page.getByRole('button',{name:'Set stand-off',exact:true})).toBeDisabled();await expect(page.getByRole('row')).toHaveCount(3);
});

test('every listed additional tool is a preview and preserves selected data, joints, camera and downloads',async({page})=>{
 test.setTimeout(90000);
 const {clickScene}=await import('./scene-clicks');await page.goto('./');await expect(page.getByRole('status')).toContainText('Scene ready');await clickScene(page,704,498);
 const canvas=page.getByRole('img',{name:'3D robot and door scene'}),joints=await canvas.getAttribute('data-joint-angles'),row=await page.getByRole('row').last().innerText(),image=await canvas.screenshot();
 let downloads=0;page.on('download',()=>downloads++);
 const commands:Record<string,string[]>={Geometry:['Box','Cylinder','Plane','Move','Rotate','Scale','Measure','Section','Interference'],Robot:['Select robot','Tool mount','Joint limits','Jog','Home','Teach pose'],View:['Orbit','Pan','Zoom','Fit','Front','Top','Right','Isometric','Shaded','Wireframe','Grid','Axes'],Results:['Point cloud','Coordinates','Scan report','Compare scans','Statistics'],Tools:['Script editor','Run script','Record macro','Preferences','Layout','Plugins'],Scan:['Select face','Select region','Clear selection','Scanner orientation','Laser preview','Route options','Validate route','Point cloud','Coordinates','Report']};
 for(const [tab,labels] of Object.entries(commands)){
  await page.getByRole('tab',{name:tab,exact:true}).click();const ribbon=page.getByRole('region',{name:`${tab} commands`});
  for(const label of labels){const command=ribbon.getByRole('button',{name:label,exact:true});await expect(command).toHaveAttribute('title',`${label} · Preview command`);await command.click();await expect(page.getByLabel('Application status')).toContainText(`${label} — preview command`);}
 }
 for(const [menu,labels] of Object.entries({File:['New project','Open project','Save project','Save as','Recent projects'],Help:['Help contents','Keyboard shortcuts','About']}))for(const label of labels){await page.getByRole('button',{name:menu,exact:true}).click();await page.getByRole('button',{name:label,exact:true}).click();await expect(page.getByLabel('Application status')).toContainText(`${label} — preview command`);}
 for(const label of ['New','Open','Save','Undo','Redo','New view'])await page.getByRole('button',{name:label,exact:true}).click();
 for(const label of ['Perspective','Fit','Orbit','Pan','Grid','Axes'])await page.getByRole('button',{name:`${label} view tool`,exact:true}).click();
 await page.getByRole('button',{name:'Scanner visibility',exact:true}).click();
 await expect(canvas).toHaveAttribute('data-joint-angles',joints!);await expect(canvas).toHaveAttribute('data-laser','false');expect(await page.getByRole('row').last().innerText()).toBe(row);await expect(page.getByLabel('Stand-off (mm)')).toHaveValue('100');expect(downloads).toBe(0);expect((await canvas.screenshot()).equals(image)).toBe(true);
});
