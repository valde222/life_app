import { expect, test } from '@playwright/test';
import { Api } from './support';
import { E2E_SERVER, E2E_USER } from '../playwright.config';

test('an empty account is set up with groups and lists, then shows the capture tip', async ({
  page,
}) => {
  await (await Api.signIn()).clear();
  await page.goto('/sign-in');
  await page.getByLabel('Email').fill(E2E_USER.email);
  await page.getByLabel('Password').fill(E2E_USER.password);
  await page.getByLabel('Server').fill(E2E_SERVER);
  await page.getByRole('button', { name: 'Sign in' }).click();

  await expect(page.getByRole('heading', { name: 'Your groups.' })).toBeVisible();
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByRole('heading', { name: 'Your lists.' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Client A' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.getByRole('button', { name: 'Continue' }).click();

  await expect(page.getByText('Nothing yet.')).toBeVisible();
  await expect(page.getByRole('note')).toContainText('Capture anything with +');
  await page.getByRole('button', { name: 'Got it' }).click();
  await expect(page.getByRole('note')).toHaveCount(0);
});
