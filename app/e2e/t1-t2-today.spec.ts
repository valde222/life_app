import { expect, test } from '@playwright/test';
import { freshAccount, localDate, signIn, todayAt } from './support';

test('T1: the next timed thing is the dark card; later todos keep their checkbox (R5, R6, R12)', async ({
  page,
}) => {
  const { api, life } = await freshAccount();
  const apartment = await api.list_('Apartment', life.id);
  await api.todo('Lunch with sister', { date: localDate(), time: '12:00', is_event: true });
  await api.todo('Call the landlord', { date: localDate(), time: '17:00', list: apartment.id });
  await page.clock.setFixedTime(todayAt('10:40'));

  await signIn(page);

  const next = page.getByRole('link', { name: /Lunch with sister/ });
  await expect(next).toContainText('12:00');
  await expect(next).toContainText('in 1h 20m');
  await expect(next).toContainText('Event');
  await expect(page.getByRole('button', { name: 'Mark Lunch with sister done' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Mark Call the landlord done' })).toBeVisible();
  const scheduled = page.getByRole('heading', { name: 'Scheduled' });
  await expect(scheduled).toBeVisible();
});

test('T2: ticking shows a toast with Add note and Undo (R7, R25)', async ({ page }) => {
  const { api, life } = await freshAccount();
  const lifeList = await api.list_('Life', life.id, 'blue');
  await api.todo('Pay taxes', { date: localDate(), list: lifeList.id });
  await signIn(page);

  await page.getByRole('button', { name: 'Mark Pay taxes done' }).click();
  await expect(page.getByRole('status')).toContainText('Pay taxes done');
  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(page.getByRole('button', { name: 'Mark Pay taxes done' })).toBeVisible();

  await page.getByRole('button', { name: 'Mark Pay taxes done' }).click();
  await page.getByRole('button', { name: 'Add note' }).click();
  await expect(page.getByLabel('Note text')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Linked' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Pay taxes' })).toBeVisible();
});
