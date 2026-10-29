import { expect, test } from '@playwright/test';
import { signIn, unique } from './support';

test('T9: a todo made offline on the phone shows up on the desktop after reconnecting', async ({
  browser,
}) => {
  const phone = await browser.newContext();
  const desktop = await browser.newContext();
  const phonePage = await phone.newPage();
  const desktopPage = await desktop.newPage();
  await signIn(phonePage);
  await signIn(desktopPage);
  const title = unique('Made in flight mode');

  await phone.setOffline(true);
  await phonePage.getByLabel('New todo').fill(title);
  await phonePage.getByLabel('New todo').press('Enter');

  await expect(phonePage.getByText(title)).toBeVisible();
  await expect(phonePage.getByRole('status')).toHaveText('Offline, 1 waiting');
  await expect(desktopPage.getByText(title)).toHaveCount(0);

  await phone.setOffline(false);

  await expect(desktopPage.getByText(title)).toBeVisible();
  await expect(phonePage.getByRole('status')).toHaveCount(0);
  await desktopPage.reload();
  await expect(desktopPage.getByText(title)).toBeVisible();
});
