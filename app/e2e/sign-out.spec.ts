import { expect, test } from '@playwright/test';
import { freshAccount, signIn, unique } from './support';

test('signing out with changes still waiting asks again before throwing them away', async ({
  page,
}) => {
  await freshAccount();
  await signIn(page);

  await page.route('**/api/**', (route) => route.abort('internetdisconnected'));
  await page.getByRole('button', { name: 'Capture' }).click();
  await page.keyboard.type(unique('Not sent yet'));
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText('Offline, 1 waiting')).toBeVisible();

  await page.getByRole('link', { name: 'Settings' }).first().click();
  await page.getByRole('button', { name: 'Sign out' }).click();
  await expect(page).toHaveURL(/\/settings$/);
  await page.getByRole('button', { name: 'Sign out and lose 1 change' }).click();
  await expect(page).toHaveURL(/\/sign-in$/);
});

test('signing out with nothing waiting happens at once', async ({ page }) => {
  await freshAccount();
  await signIn(page);

  await page.goto('/settings');
  await page.getByRole('button', { name: 'Sign out' }).click();
  await expect(page).toHaveURL(/\/sign-in$/);
});
