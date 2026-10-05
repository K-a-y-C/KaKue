import { test, expect } from '@playwright/test';
test('stationary actual door skin click appends a numbered coordinate row', async ({ page }, info) => {
  await page.goto('./');
  await expect(page.getByRole('status')).toContainText('Scene ready');
  await page.mouse.click(704, 498);
  await expect(page.getByRole('table', { name: 'Selected surface points' }).getByRole('row')).toHaveCount(2);
  await expect(page.getByRole('row').last()).toContainText('selected');
  await page.screenshot({ path: info.outputPath('selected-door.png') });
});
