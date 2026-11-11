import { expect, test } from '@playwright/test';
import { freshAccount, signIn, typeInCapture } from './support';

test('T3: a capture with no list lands in the Inbox under Today and the badge goes up (R2, R15, R16)', async ({
  page,
}) => {
  const { api } = await freshAccount();
  await api.todo('fix the bike light', { inbox: true });
  await signIn(page);
  await expect(page.getByLabel('1 in the inbox')).toBeVisible();

  await page.getByRole('button', { name: 'Capture' }).click();
  await typeInCapture(page, 'buy butter');
  await page.getByRole('button', { name: 'Save' }).click();

  await expect(page.getByLabel('2 in the inbox')).toBeVisible();
  await page.getByRole('link', { name: /Inbox/ }).click();
  const todaySection = page.getByRole('heading', { name: 'Today' });
  await expect(todaySection).toBeVisible();
  await expect(page.locator('h2:has-text("Today") + .stack')).toContainText('buy butter');
});

test('T4: turning on Event drops the checkbox and steps and says New event (R4, R12)', async ({
  page,
}) => {
  await freshAccount();
  await signIn(page);

  await page.getByRole('button', { name: 'Capture' }).click();
  await typeInCapture(page, 'Dinner with Ana today');
  await page.getByRole('button', { name: 'Add details' }).click();
  await expect(page.getByRole('heading', { name: 'New todo' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Steps' })).toBeVisible();

  await page.getByRole('switch', { name: 'Event' }).click();

  await expect(page.getByRole('heading', { name: 'New event' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Steps' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Save' }).click();

  await expect(page.getByRole('link', { name: 'Dinner with Ana' })).toBeVisible();
  await expect(page.getByText('Event', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Mark Dinner with Ana done' })).toHaveCount(0);
});
