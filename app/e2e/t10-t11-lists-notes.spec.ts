import { expect, test } from '@playwright/test';
import { freshAccount, signIn } from './support';

test('T10: + New list inside an open group creates it there without asking (R22, R23)', async ({
  page,
}) => {
  const { api, life } = await freshAccount();
  await api.list_('Apartment', life.id);
  const work = await api.create('groups', { name: 'Work', order: 1 });
  await api.create('lists', { name: 'Client A', group: work.id, colour: 'orange', order: 1 });
  await signIn(page);

  await page.getByRole('link', { name: 'Lists' }).click();
  await expect(page.getByRole('button', { name: /Life/ })).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByRole('button', { name: /Work/ })).toContainText('1 list');

  await page.getByRole('button', { name: '+ New list' }).click();
  await expect(page.getByRole('heading', { name: 'New list in Life.' })).toBeVisible();
  await page.getByLabel('Name').fill('Garden');
  await page.getByRole('button', { name: 'Create list' }).click();

  await expect(page.getByRole('heading', { name: 'Garden.' })).toBeVisible();
  await expect(page.getByText('Life', { exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Lists' }).first().click();
  const lifeBox = page.locator('section').filter({ hasText: 'Apartment' });
  await expect(lifeBox).toContainText('Garden');
  await expect
    .poll(async () => (await api.list('lists', 'name = "Garden"'))[0]?.['group'])
    .toBe(life.id);
});

test('T11: two photos added to a note show as thumbnails, open full size and reach the other device (R24)', async ({
  browser,
}) => {
  const { api } = await freshAccount();
  const work = await api.group('Work');
  const clientA = await api.create('lists', {
    name: 'Client A',
    group: work.id,
    colour: 'orange',
    order: 0,
  });
  const note = await api.note('How the login flow works', {
    list: clientA.id,
    body: 'Token is refreshed in middleware.',
  });

  const phone = await (await browser.newContext()).newPage();
  await signIn(phone);
  await phone.goto(`/note/${note.id}`);
  await phone.getByRole('button', { name: '+ Photo' }).click();
  await phone
    .getByLabel('Choose photos')
    .setInputFiles(['e2e/fixtures/whiteboard.png', 'e2e/fixtures/wall.png']);

  await expect(phone.getByRole('button', { name: /Open photo/ })).toHaveCount(2);
  await phone.getByRole('button', { name: 'Open photo 1' }).click();
  await expect(phone.getByRole('img', { name: 'Photo 1 of 2' })).toBeVisible();
  await phone.getByRole('button', { name: 'Close' }).click();
  await expect
    .poll(
      async () => ((await api.list('notes', `id = "${note.id}"`))[0]['photos'] as string[]).length,
    )
    .toBe(2);

  const desktop = await (await browser.newContext()).newPage();
  await signIn(desktop);
  await desktop.goto(`/note/${note.id}`);
  await expect(desktop.getByRole('button', { name: /Open photo/ })).toHaveCount(2);
  const thumb = desktop.getByRole('button', { name: 'Open photo 2' }).locator('img');
  await expect
    .poll(() => thumb.evaluate((img: HTMLImageElement) => img.naturalWidth))
    .toBeGreaterThan(0);
});
