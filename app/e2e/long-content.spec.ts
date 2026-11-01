import { expect, test } from '@playwright/test';
import { freshAccount, localDate, signIn } from './support';

const LONG = `https://example.com/${'a-very-long-path-segment-'.repeat(12)}`;
const SPECIAL = 'Café 🧹 <b>bold</b> & "quotes" \'single\' — 日本語 ✅';

for (const [size, viewport] of [
  ['phone', { width: 412, height: 915 }],
  ['desktop', { width: 1280, height: 800 }],
] as const) {
  test(`long, unbroken and special-character text never makes a screen scroll sideways (${size})`, async ({
    page,
  }) => {
    test.setTimeout(240_000);
    await page.setViewportSize(viewport);
    const { api, life } = await freshAccount();
    const list = await api.list_(LONG, life.id);
    const todo = await api.todo(LONG, { list: list.id, date: localDate(), time: '09:00' });
    await api.todo(SPECIAL, { list: list.id, date: localDate() });
    await api.todo(`${LONG} inbox`, { inbox: true });
    const note = await api.note(LONG, { list: list.id, body: `${LONG}\n\n${SPECIAL}` });
    for (let index = 0; index < 200; index++) {
      await api.todo(`Bulk ${index}`, { list: list.id });
    }
    await signIn(page);

    for (const route of [
      '/',
      '/inbox',
      '/lists',
      `/lists/${list.id}`,
      `/todo/${todo.id}`,
      `/note/${note.id}`,
      '/agenda',
      '/week',
      '/search?q=a',
    ]) {
      await page.goto(route);
      await page.waitForTimeout(400);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, route).toBeLessThanOrEqual(0);
    }
    await page.goto('/search?q=caf');
    await expect(page.getByText(SPECIAL)).toBeVisible();
  });
}
