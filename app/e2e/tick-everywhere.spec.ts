import { expect, Page, test } from '@playwright/test';
import { Api, freshAccount, localDate, signIn } from './support';

async function doneAt(api: Api, id: string) {
  return (await api.list('todos', `id = "${id}"`))[0]?.['done_at'];
}

async function tick(page: Page, title: string) {
  await page.getByRole('button', { name: `Mark ${title} done`, exact: true }).click();
  await expect(page.getByRole('status')).toContainText(`${title} done`);
}

test('R7: todos can be ticked in the Inbox, Agenda and Search, and unticked in Search and This week', async ({
  page,
}) => {
  const { api } = await freshAccount();
  const inbox = await api.todo('Book flights', { inbox: true });
  const dated = await api.todo('Pay rent', { date: localDate() });
  const found = await api.todo('Renew passport', { date: localDate(new Date(), 3) });
  await signIn(page);

  await page.goto('/inbox');
  await tick(page, 'Book flights');
  await expect(page.getByText('Book flights', { exact: true })).toHaveCount(0);
  await expect.poll(() => doneAt(api, inbox.id)).not.toBe('');

  await page.goto('/agenda');
  await tick(page, 'Pay rent');
  await expect.poll(() => doneAt(api, dated.id)).not.toBe('');

  await page.goto('/search?q=passport');
  await tick(page, 'Renew passport');
  await expect.poll(() => doneAt(api, found.id)).not.toBe('');
  await page.getByRole('button', { name: 'Mark Renew passport not done' }).click();
  await expect.poll(() => doneAt(api, found.id)).toBe('');

  await page.goto('/week');
  await page.getByRole('button', { name: 'Mark Pay rent not done' }).click();
  await expect(page.getByRole('status')).toContainText('Pay rent is not done');
  await expect.poll(() => doneAt(api, dated.id)).toBe('');
});

test('R7: ticking on a list page offers Add note, like Today, and the done fold unticks', async ({
  page,
}) => {
  const { api, life } = await freshAccount();
  const home = await api.list_('Home', life.id);
  const shelf = await api.todo('Fix the shelf', { list: home.id });
  await signIn(page);

  await page.goto(`/lists/${home.id}`);
  await tick(page, 'Fix the shelf');
  await expect(page.getByRole('button', { name: 'Add note' })).toBeVisible();
  await page.getByRole('button', { name: /1 done/ }).click();
  await page.getByRole('button', { name: 'Mark Fix the shelf not done' }).click();
  await expect.poll(() => doneAt(api, shelf.id)).toBe('');
});

test('R12: events never get a tick box, in the Inbox or in Search', async ({ page }) => {
  const { api } = await freshAccount();
  await api.todo('Dentist', { inbox: true, is_event: true, date: localDate(), time: '14:00' });
  await signIn(page);

  await page.goto('/inbox');
  await expect(page.getByText('Dentist', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Mark Dentist done' })).toHaveCount(0);

  await page.goto('/search?q=dentist');
  await expect(page.getByText('Dentist', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Mark Dentist done' })).toHaveCount(0);
});
