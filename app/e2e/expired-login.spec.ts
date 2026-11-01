import { expect, test } from '@playwright/test';
import { freshAccount, signIn } from './support';

test('when the server stops accepting the login mid-session, the app goes to sign-in', async ({
  page,
  context,
}) => {
  await freshAccount();
  await signIn(page);

  await page.route('**/api/collections/**', (route) =>
    route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: '{"status":401,"message":"The request requires valid record authorization token.","data":{}}',
    }),
  );
  await context.setOffline(true);
  await context.setOffline(false);

  await expect(page).toHaveURL(/\/sign-in$/);
  await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
});
