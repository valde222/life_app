import { expect, Locator, Page, test } from '@playwright/test';
import { freshAccount, signIn } from './support';

test.use({ viewport: { width: 1280, height: 1100 }, isMobile: false, hasTouch: false });

async function staysInsideItsSheet(page: Page, list: Locator) {
  const panel = (await page.locator('.cdk-dialog-container').boundingBox())!;
  const items = (await list.boundingBox())!;
  expect(items.y + items.height).toBeLessThanOrEqual(panel.y + panel.height + 1);
  expect(await list.evaluate((el) => el.scrollHeight > el.clientHeight)).toBe(true);
}

test('on desktop, Pick for today and the link picker scroll inside their sheet', async ({
  page,
}) => {
  const { api, life } = await freshAccount();
  const someday = await api.list_('Someday', life.id);
  for (let index = 1; index <= 20; index++) {
    await api.todo(`Someday task ${index}`, { list: someday.id });
  }
  const note = await api.note('Linked note', { list: someday.id });
  await signIn(page);

  await page.getByRole('button', { name: /Pick for today/ }).click();
  await test.step('pick', () => staysInsideItsSheet(page, page.locator('app-pick-sheet .items')));
  await page.getByRole('button', { name: 'Done' }).click();

  await page.goto(`/note/${note.id}`);
  await page.getByRole('button', { name: '+ Link…' }).first().click();
  await test.step('link', () => staysInsideItsSheet(page, page.locator('app-link-picker .items')));
});
