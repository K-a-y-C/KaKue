import {test,expect} from '@playwright/test';

test('selected door points run in order with progress and post-dwell visits',async({page})=>{
  test.setTimeout(90000);
  await page.goto('./');await expect(page.getByRole('status')).toContainText('Scene ready');
  await page.mouse.click(704,498);await page.mouse.click(712,520);
  await expect(page.getByRole('row')).toHaveCount(3);
  await expect(page.getByRole('button',{name:'Run',exact:true})).toBeEnabled();
  await page.getByRole('button',{name:'Run',exact:true}).click();
  await expect(page.getByLabel('Route progress')).toContainText('Current point: 1');
  await expect(page.getByLabel('Route progress')).toContainText('Visited: 0 of 2');
  await expect(page.getByRole('row').nth(1)).toContainText('Moving');
  await expect(page.getByRole('row').nth(2)).toContainText('Ready');
  const canvas=page.getByRole('img',{name:'3D robot and door scene'});
  await expect(canvas).toHaveAttribute('data-laser','true',{timeout:45000});
  await expect(page.getByRole('row').nth(1)).toContainText('Moving');
  await expect(page.getByLabel('Route progress')).toContainText('Current point: 2',{timeout:45000});
  await expect(page.getByRole('row').nth(1)).toContainText('Visited');
  await expect(page.getByLabel('Route progress')).toContainText('Visited: 1 of 2');
  await expect(page.getByRole('status')).toContainText('Simulation complete',{timeout:45000});
  await expect(page.getByLabel('Route progress')).toContainText('Visited: 2 of 2');
  await expect(canvas).toHaveAttribute('data-laser','false');
  const final=await canvas.getAttribute('data-joint-angles');await page.waitForTimeout(1100);
  await expect(canvas).toHaveAttribute('data-joint-angles',final!);
});
