import { expect, test } from '@playwright/test';
import { freshAccount, signIn } from './support';

test('chores show in Search, can be done today there, and open their repeat settings', async ({
  page,
}) => {
  const { api } = await freshAccount();
  const chore = await api.todo('Clean bathroom', { repeat_mode: 'rough', repeat_every_days: 7 });
  await signIn(page);

  await page.goto('/search?q=bathroom');
  const row = page.locator('app-repeat-row', { hasText: 'Clean bathroom' });
  await expect(row).toBeVisible();
  await row.getByRole('button', { name: 'Mark Clean bathroom done today' }).click();
  await expect(page.getByRole('status')).toContainText('Clean bathroom done today');
  await expect
    .poll(async () => (await api.list('completions', `todo = "${chore.id}"`)).length)
    .toBe(1);

  await row
    .getByRole('button', { name: /Clean bathroom/ })
    .last()
    .click();
  await expect(page).toHaveURL(new RegExp(`/repeat/${chore.id}`));
});

test('the Repeating screen is reachable from Lists and, on desktop, the sidebar', async ({
  browser,
}) => {
  const { api } = await freshAccount();
  await api.todo('Water plants', { repeat_mode: 'rough', repeat_every_days: 3 });

  const phone = await (await browser.newContext({ reducedMotion: 'reduce' })).newPage();
  await signIn(phone);
  await phone.getByRole('link', { name: 'Lists' }).first().click();
  await expect(phone.getByRole('link', { name: /Repeating\s*1 chore/ })).toBeVisible();
  await phone.getByRole('link', { name: /Repeating/ }).click();
  await expect(phone.getByRole('heading', { name: 'Repeating.' })).toBeVisible();

  const desktop = await (
    await browser.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' })
  ).newPage();
  await signIn(desktop);
  await desktop.getByRole('link', { name: 'Repeating', exact: true }).click();
  await expect(desktop.getByRole('heading', { name: 'Repeating.' })).toBeVisible();
});
