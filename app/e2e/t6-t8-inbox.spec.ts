import { expect, test } from '@playwright/test';
import { freshAccount, localDate, signIn, swipe } from './support';

test('T6: keeping a quick note in a list takes it out of the Inbox (R17)', async ({ page }) => {
  const { api, life } = await freshAccount();
  const apartment = await api.list_('Apartment', life.id);
  const wall = await api.note('Wall is 312 cm', { inbox: true });
  await signIn(page);

  await page.goto('/inbox');
  await page.getByRole('button', { name: 'Wall is 312 cm' }).click();
  await page.getByRole('button', { name: 'Keep', exact: true }).click();
  await page.getByRole('button', { name: /Add to a list/ }).click();
  await page.getByRole('tab', { name: 'Life' }).click();
  await page.getByRole('button', { name: 'Apartment' }).click();
  await page.getByRole('button', { name: 'Save' }).click();

  await expect(page.getByRole('status')).toContainText('Kept as a note');
  await expect(page.getByText('Wall is 312 cm')).toHaveCount(0);
  await expect
    .poll(async () => (await api.list('notes', `id = "${wall.id}"`))[0])
    .toMatchObject({ list: apartment.id, inbox: false });
});

test('T7: swiping an inbox todo right puts it on Today (R18, R9)', async ({ page }) => {
  const { api } = await freshAccount();
  await api.todo('buy butter', { inbox: true });
  await signIn(page);

  await page.goto('/inbox');
  await swipe(page, 'buy butter', 'right');

  await expect(page.getByRole('status')).toContainText('On Today');
  await expect(page.getByText('buy butter')).toHaveCount(0);
  await page.getByRole('link', { name: 'Today', exact: true }).click();
  await expect(page.getByRole('link', { name: 'buy butter' })).toBeVisible();
});

test('T8: left over todos are counted and Pick opens on them (R8, R9)', async ({ page }) => {
  const { api } = await freshAccount();
  await api.todo('Book the dentist', { date: localDate(new Date(), -1) });
  await api.todo('Return the drill', { date: localDate(new Date(), -1) });
  await api.todo('Water the cactus', { date: localDate() });
  await signIn(page);

  await expect(page.getByText('Book the dentist')).toHaveCount(0);
  const pick = page.getByRole('button', { name: /Pick for today/ });
  await expect(pick).toContainText('2 left over');
  await pick.click();

  await expect(page.getByRole('button', { name: 'Left over' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.getByRole('button', { name: 'Pick Book the dentist for today' }).click();
  await page.getByRole('button', { name: 'Done' }).click();

  await expect(page.getByRole('link', { name: 'Book the dentist' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Pick for today/ })).toContainText('1 left over');
});

test('a quick note without a title shows as Untitled in the Inbox, like everywhere else', async ({
  page,
}) => {
  const { api } = await freshAccount();
  await api.note('', { inbox: true, body: 'Something to look at later' });
  await signIn(page);

  await page.goto('/inbox');
  await expect(page.getByRole('button', { name: 'Untitled' })).toBeVisible();
  await page.getByRole('button', { name: 'Untitled' }).click();
  await expect(page.locator('.expanded-title')).toHaveText('Untitled');
});
