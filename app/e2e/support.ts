import { expect, Page } from '@playwright/test';
import { E2E_SERVER, E2E_USER } from '../playwright.config';

export async function signIn(page: Page) {
  await page.goto('/sign-in');
  await page.getByLabel('Email').fill(E2E_USER.email);
  await page.getByLabel('Password').fill(E2E_USER.password);
  await page.getByLabel('Server').fill(E2E_SERVER);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByRole('heading', { name: 'Today.' })).toBeVisible();
}

export function unique(title: string) {
  return `${title} ${Date.now().toString(36)}`;
}
