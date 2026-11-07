import { expect, Page, test } from '@playwright/test';
import { freshAccount, localDate, signIn } from './support';

function watch(page: Page): string[] {
  const problems: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error' || message.type() === 'warning') {
      problems.push(`${message.type()}: ${message.text()}`);
    }
  });
  page.on('pageerror', (error) => problems.push(`pageerror: ${error.message}`));
  page.on('requestfailed', (request) => {
    if (!request.url().includes('/api/realtime')) {
      problems.push(`failed: ${request.method()} ${request.url()} ${request.failure()?.errorText}`);
    }
  });
  page.on('response', (response) => {
    if (response.status() >= 400) {
      problems.push(`http ${response.status()}: ${response.url()}`);
    }
  });
  return problems;
}

async function seed() {
  const { api, life } = await freshAccount();
  const home = await api.list_('Home', life.id);
  const todo = await api.todo('Fix the shelf', { list: home.id, date: localDate(), time: '09:00' });
  await api.create('steps', { todo: todo.id, text: 'Buy screws', done: false, order: 0 });
  const note = await api.note('Shelf ideas', {
    list: home.id,
    body: '## Ideas\n\n- oak\n- [[Other]]',
  });
  await api.note('Other', { list: home.id });
  const chore = await api.todo('Clean bathroom', { repeat_mode: 'rough', repeat_every_days: 7 });
  await api.todo('Inbox thing', { inbox: true });
  await api.todo('Archived thing', { archived_at: '2026-10-20 10:00:00.000Z' });
  await api.todo('Deleted thing', { deleted_at: '2026-10-28 10:00:00.000Z' });
  return { home: home.id, todo: todo.id, note: note.id, chore: chore.id };
}

const SIZES = {
  phone: { viewport: { width: 412, height: 915 }, isMobile: true, hasTouch: true },
  desktop: { viewport: { width: 1280, height: 800 }, isMobile: false, hasTouch: false },
};

for (const [size, options] of Object.entries(SIZES)) {
  test.describe(size, () => {
    test.use(options);

    test(`every screen and sheet opens without console errors (${size})`, async ({ page }) => {
      test.setTimeout(120_000);
      const ids = await seed();
      const problems = watch(page);
      await signIn(page);
      const routes = [
        '/',
        '/inbox',
        '/lists',
        `/lists/${ids.home}`,
        `/lists/${ids.home}/settings`,
        '/lists/edit',
        `/todo/${ids.todo}`,
        '/todo/new',
        `/note/${ids.note}`,
        '/repeating',
        `/repeat/${ids.chore}`,
        '/repeat/new',
        '/agenda',
        '/week',
        '/search',
        '/search?q=shelf',
        '/archive',
        '/archive/deleted',
        '/settings',
        '/settings/calendars',
        '/settings/errors',
      ];
      for (const route of routes) {
        await page.goto(route);
        await page.waitForTimeout(300);
      }
      await page.goto('/');
      for (const opener of [/Capture/, /Pick for today/]) {
        await page.getByRole('button', { name: opener }).first().click();
        await page.waitForTimeout(300);
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
      }
      await page.goto(`/todo/${ids.todo}`);
      for (const row of ['List', 'Date', 'Time', 'Reminder']) {
        await page
          .getByRole('button', { name: new RegExp(`^${row}`) })
          .first()
          .click();
        await page.waitForTimeout(300);
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
      }
      expect(problems).toEqual([]);
    });
  });
}
