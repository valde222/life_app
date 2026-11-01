import { expect, test } from '@playwright/test';
import { freshAccount, signIn } from './support';

const SUNDAY_NIGHT = new Date('2026-11-01T23:59:00');

test('Agenda moves on to the new day at midnight while it is open', async ({ page }) => {
  const { api } = await freshAccount();
  await api.todo('Sunday thing', { date: '2026-11-01' });
  await api.todo('Monday thing', { date: '2026-11-02' });
  await page.clock.install({ time: SUNDAY_NIGHT });
  await signIn(page);

  await page.getByRole('link', { name: 'Agenda' }).first().click();
  await expect(page.getByText('Today, Sun 1 Nov')).toBeVisible();

  await page.clock.runFor(120_000);
  await expect(page.getByText('Today, Mon 2 Nov')).toBeVisible();
});

test('This week moves on to the new week at Monday midnight while it is open (R29)', async ({
  page,
}) => {
  const { api } = await freshAccount();
  await api.todo('Water the basil', { date: '2026-11-01' });
  await page.clock.install({ time: SUNDAY_NIGHT });
  await signIn(page);

  await page.getByRole('link', { name: /done/ }).first().click();
  await expect(page.getByText('Oct 26 – Nov 1')).toBeVisible();

  await page.clock.runFor(120_000);
  await expect(page.getByText('Nov 2 – 8')).toBeVisible();
});
