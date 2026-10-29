import { expect, test } from '@playwright/test';
import { freshAccount, signIn, unique } from './support';

test('T9: a todo made offline on the phone shows up on the desktop after reconnecting', async ({
  browser,
}) => {
  await freshAccount();
  const phone = await browser.newContext();
  const desktop = await browser.newContext();
  const phonePage = await phone.newPage();
  const desktopPage = await desktop.newPage();
  await signIn(phonePage);
  await signIn(desktopPage);
  const title = unique('Made in flight mode');

  await phone.setOffline(true);
  await phonePage.getByRole('button', { name: 'Capture' }).click();
  await phonePage.keyboard.type(`${title} today`);
  await phonePage.getByRole('button', { name: 'Save' }).click();

  await expect(phonePage.getByText(title)).toBeVisible();
  await expect(phonePage.getByText('Offline, 1 waiting')).toBeVisible();
  await expect(desktopPage.getByText(title)).toHaveCount(0);

  await phone.setOffline(false);

  await expect(desktopPage.getByText(title)).toBeVisible();
  await expect(phonePage.getByText(/Offline/)).toHaveCount(0);
  await desktopPage.reload();
  await expect(desktopPage.getByText(title)).toBeVisible();
});
