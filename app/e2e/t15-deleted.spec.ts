import { expect, test } from '@playwright/test';
import { freshAccount, signIn } from './support';

const daysAgo = (days: number) =>
  new Date(Date.now() - days * 86_400_000).toISOString().replace('T', ' ');

test('T15: a note deleted 3 days ago shows 27 days left; Restore brings it back; Empty now removes everything (R27)', async ({
  page,
}) => {
  const { api, life } = await freshAccount();
  const home = await api.list_('Home', life.id);
  await api.note('Sofa ideas', { list: home.id, deleted_at: daysAgo(3) });
  const insurance = await api.todo('Call the insurance', { deleted_at: daysAgo(8) });
  await signIn(page);

  await page.goto('/archive');
  await page.getByRole('link', { name: /Recently deleted/ }).click();
  await expect(page.getByRole('heading', { name: 'Deleted.' })).toBeVisible();
  await expect(page.getByText('Note, 27 days left')).toBeVisible();
  await expect(page.getByText('Todo, 22 days left')).toBeVisible();

  await page
    .locator('.row', { hasText: 'Sofa ideas' })
    .getByRole('button', { name: 'Restore' })
    .click();
  await expect(page.getByText('Sofa ideas')).toHaveCount(0);
  await page.goto(`/lists/${home.id}`);
  await page.getByRole('tab', { name: /Notes/ }).click();
  await expect(page.getByRole('link', { name: /Sofa ideas/ })).toBeVisible();

  await page.goto('/archive/deleted');
  await page.getByRole('button', { name: 'Empty now' }).click();
  await page.getByRole('button', { name: /for good/ }).click();
  await expect(page.getByText('Nothing deleted.')).toBeVisible();
  await expect.poll(async () => (await api.list('todos', `id = "${insurance.id}"`)).length).toBe(0);
});
