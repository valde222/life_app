import { expect, test } from '@playwright/test';
import { freshAccount, localDate, signIn } from './support';

function daysAgo(days: number, from = new Date()) {
  return localDate(from, -days);
}

test('T12: a weekly chore last done 9 days ago is red on Today; ticking resets it and takes it off (R10, R19)', async ({
  page,
}) => {
  const { api } = await freshAccount();
  const bathroom = await api.todo('Clean bathroom', { repeat_mode: 'rough', repeat_every_days: 7 });
  await api.create('completions', { todo: bathroom.id, done_on: daysAgo(9) });
  await api.create('completions', { todo: bathroom.id, done_on: daysAgo(17) });
  await signIn(page);

  const row = page.locator('app-repeat-row', { hasText: 'Clean bathroom' });
  await expect(page.getByRole('link', { name: /Repeating/ })).toBeVisible();
  await expect(row).toContainText('9 days');
  await expect(row.locator('.tag.over')).toBeVisible();

  await page.getByRole('button', { name: 'Mark Clean bathroom done today' }).click();

  await expect(row).toHaveCount(0);
  await page.goto('/repeating');
  await expect(page.locator('app-repeat-row', { hasText: 'Clean bathroom' })).toContainText(
    'Today',
  );
});

test('T13: a Mon and Thu chore shows Thu on a Tuesday and is red on Friday if not done (R20)', async ({
  page,
}) => {
  const { api } = await freshAccount();
  const plants = await api.todo('Water plants', {
    repeat_mode: 'schedule',
    repeat_every_weeks: 1,
    repeat_weekdays: [1, 4],
  });
  const now = new Date();
  const thisMonday = localDate(now, -((now.getDay() + 6) % 7));
  await api.create('completions', { todo: plants.id, done_on: thisMonday });
  const [year, month, day] = thisMonday.split('-').map(Number);
  const tuesday = new Date(year, month - 1, day + 1, 10, 0);
  const friday = new Date(year, month - 1, day + 4, 10, 0);

  await page.clock.setFixedTime(tuesday);
  await signIn(page);
  await page.goto('/repeating');
  const row = page.locator('app-repeat-row', { hasText: 'Water plants' });
  await expect(row).toContainText('Thu');
  await expect(row.locator('.tag.over')).toHaveCount(0);

  await page.clock.setFixedTime(friday);
  await page.reload();
  await expect(row.locator('.tag.over')).toBeVisible();
});
