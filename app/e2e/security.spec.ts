import { expect, test } from '@playwright/test';
import { freshAccount, signIn } from './support';

test('the content security policy blocks injected scripts and nothing the app does', async ({
  page,
}) => {
  const violations: string[] = [];
  await page.exposeFunction('reportViolation', (text: string) => violations.push(text));
  await page.addInitScript(() =>
    document.addEventListener('securitypolicyviolation', (event) =>
      (window as unknown as { reportViolation(text: string): void }).reportViolation(
        `${event.violatedDirective} ${event.blockedURI}`,
      ),
    ),
  );
  const { api, life } = await freshAccount();
  await api.list_('Home', life.id);

  await signIn(page);
  for (const screen of ['Agenda', 'Inbox', 'Lists', 'Today']) {
    await page.getByRole('link', { name: screen }).click();
  }

  const ran = await page.evaluate(() => {
    const script = document.createElement('script');
    script.textContent = 'window.injected = true';
    document.head.append(script);
    return (window as unknown as { injected?: boolean }).injected ?? false;
  });
  expect(ran).toBe(false);
  await expect.poll(() => violations.some((text) => text.startsWith('script-src'))).toBe(true);
  expect(violations.filter((text) => !text.startsWith('script-src'))).toEqual([]);
});
