import { expect, test } from '@playwright/test';
import { freshAccount, signIn, todayAt } from './support';

test('T14: events from an enabled calendar show with an Event label and cannot be edited (R13, R14)', async ({
  page,
}) => {
  const { api } = await freshAccount();
  await api.create('settings', {
    calendars: [{ id: 'personal', name: 'Personal', enabled: true }],
  });
  const start = todayAt('15:00');
  const end = todayAt('16:00');
  await api.create('calendar_events', {
    calendar: 'personal',
    external_id: 'dentist@1',
    title: 'Dentist',
    start: start.toISOString().replace('T', ' '),
    end: end.toISOString().replace('T', ' '),
    all_day: false,
  });
  await page.clock.setFixedTime(todayAt('09:00'));
  await signIn(page);

  const card = page.getByRole('link', { name: /Dentist/ });
  await expect(card).toContainText('15:00');
  await expect(card).toContainText('Event');
  await expect(page.getByRole('button', { name: 'Mark Dentist done' })).toHaveCount(0);

  await card.click();
  await expect(page.getByRole('heading', { name: 'Dentist' })).toBeVisible();
  await expect(page.getByText('Personal')).toBeVisible();
  await expect(page.getByText('15:00–16:00')).toBeVisible();
  await expect(page.getByRole('textbox')).toHaveCount(0);
  await expect(page.getByRole('switch')).toHaveCount(0);

  await page.goto('/settings/calendars');
  await expect(page.getByText('Personal')).toBeVisible();
  await expect(page.getByText('On', { exact: true })).toBeVisible();
});
