import { expect, test } from '@playwright/test';
import { freshAccount, signIn } from './support';

test('B1: the note text can be reached and opened for editing from the keyboard', async ({
  page,
}) => {
  const { api } = await freshAccount();
  const note = await api.note('Keyboard note', { body: 'Written with **keys**' });
  await signIn(page);
  await page.goto(`/note/${note.id}`);

  const text = page.locator('article').getByText('Written with');
  await expect(text).toBeVisible();
  await page.locator('article[aria-label="Note text"]').focus();
  await expect(page.locator('article[aria-label="Note text"]')).toBeFocused();
  await page.keyboard.press('Enter');

  await expect(page.locator('textarea[aria-label="Note text"]')).toBeFocused();
});
