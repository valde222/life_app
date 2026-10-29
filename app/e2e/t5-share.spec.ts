import { expect, test } from '@playwright/test';
import { freshAccount, signIn } from './support';

test('T5: a link shared from another app becomes a quick note in the Inbox (R3)', async ({
  page,
}) => {
  await freshAccount();
  await signIn(page);

  await page.evaluate(() =>
    window.dispatchEvent(
      new CustomEvent('life:share', { detail: { text: 'https://example.com/shelf-guide' } }),
    ),
  );

  await expect(page.getByRole('status')).toContainText('In the Inbox');
  await page.goto('/inbox');
  await expect(page.getByRole('button', { name: 'https://example.com/shelf-guide' })).toBeVisible();
});
