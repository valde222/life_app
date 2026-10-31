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

test.describe('with motion', () => {
  test.use({ reducedMotion: 'no-preference' });

  test('T2: a ticked todo shows its tick, then leaves the list (R7)', async ({ page }) => {
    const { api } = await freshAccount();
    const todo = await api.todo('Water the basil', { date: localDate() });
    await signIn(page);
    await page.waitForTimeout(500);

    const row = page.locator('app-todo-row', { hasText: 'Water the basil' });
    await row.getByRole('button', { name: 'Mark Water the basil done' }).click();

    await expect(row).toHaveClass(/ticked/);
    await expect(row.getByRole('button')).toHaveAttribute('aria-pressed', 'true');
    await expect(row).toHaveCount(0);
    await expect(page.getByRole('status')).toContainText('Water the basil done');
    await expect
      .poll(async () => (await api.list('todos', `id = "${todo.id}"`))[0]?.['done_at'])
      .not.toBe('');
  });
});

test('T2: with reduced motion a ticked todo is saved at once (R7)', async ({ page }) => {
  const { api } = await freshAccount();
  await api.todo('Water the basil', { date: localDate() });
  await signIn(page);

  await page.getByRole('button', { name: 'Mark Water the basil done' }).click();

  await expect(page.locator('app-todo-row', { hasText: 'Water the basil' })).toHaveCount(0, {
    timeout: 300,
  });
});
