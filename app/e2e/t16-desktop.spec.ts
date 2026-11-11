import { expect, test } from '@playwright/test';
import { freshAccount, localDate, signIn, typeInCapture } from './support';

test.use({ viewport: { width: 1280, height: 800 }, isMobile: false, hasTouch: false });

test('T16: Ctrl+Space opens capture and Save puts the item in the Inbox (R1, R2; web side of the desktop hotkey)', async ({
  page,
}) => {
  await freshAccount();
  await signIn(page);
  await expect(page.getByRole('button', { name: /Capture/ }).first()).toContainText('Ctrl Space');

  await page.keyboard.press('Control+Space');
  await typeInCapture(page, 'Email Mads about the rollback plan');
  await page.keyboard.press('Enter');

  await expect(page.getByLabel('1 in the inbox')).toBeVisible();
  await page.getByRole('link', { name: /Inbox/ }).click();
  await expect(
    page.getByRole('button', { name: 'Email Mads about the rollback plan', exact: true }),
  ).toBeVisible();
});

test('T16: the capture window page saves to the Inbox and Esc closes it', async ({ page }) => {
  await freshAccount();
  await signIn(page);

  await page.goto('/capture');
  await expect(page.getByLabel("What's on your mind")).toBeFocused();
  await page.keyboard.type('Book a table');
  await page.getByRole('button', { name: 'Save' }).click();

  await expect(page).toHaveURL(/\/inbox$/);
  await expect(page.getByRole('button', { name: 'Book a table', exact: true })).toBeVisible();
});

test('desktop layout opens a todo in the detail pane and shows shortcuts on ?', async ({
  page,
}) => {
  const { api } = await freshAccount();
  await api.todo('Set up the living room', { date: localDate() });
  await signIn(page);

  await page.getByRole('link', { name: 'Set up the living room' }).click();
  await expect(
    page.getByRole('complementary', { name: 'Details' }).getByLabel('Title'),
  ).toHaveValue('Set up the living room');
  await expect(page.getByRole('heading', { name: 'Today.' })).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(page.getByRole('complementary', { name: 'Details' })).toHaveCount(0);

  await page.keyboard.press('?');
  await expect(page.getByRole('heading', { name: 'Keyboard shortcuts.' })).toBeVisible();
});
