import { Browser, expect, Page, test } from '@playwright/test';
import { Api, freshAccount, localDate, signIn, todayAt } from './support';

test.skip(!process.env['VISUAL'], 'Visual comparison runs on demand: see app/README.md');

const NOW = todayAt('10:00');
const MOBILE = { width: 412, height: 915 };
const DESKTOP = { width: 1280, height: 800 };

const day = (offset: number) => localDate(NOW, offset);
const instant = (date: Date) => date.toISOString().replace('T', ' ');
const at = (offset: number, time: string) => instant(new Date(`${day(offset)}T${time}:00`));

interface Fixture {
  apartment: string;
  clientA: string;
  invoice: string;
  bathroom: string;
  loginNote: string;
  lunch: string;
}

async function seed(api: Api, life: { id: string }): Promise<Fixture> {
  const work = await api.create('groups', { name: 'Work', order: 1 });
  const apartment = await api.create('lists', {
    name: 'Apartment',
    group: life.id,
    colour: 'purple',
    order: 0,
  });
  await api.create('lists', { name: 'Shopping', group: life.id, colour: 'teal', order: 1 });
  const clientA = await api.create('lists', {
    name: 'Client A',
    group: work.id,
    colour: 'orange',
    order: 2,
  });
  await api.create('lists', {
    name: 'Old project',
    group: work.id,
    colour: 'grey',
    order: 3,
    archived_at: at(-3, '12:00'),
  });

  await api.todo('Call the landlord', { date: day(0), time: '09:00', list: apartment.id });
  await api.todo('Dentist', { date: day(0), time: '14:00', time_end: '15:00', is_event: true });
  await api.todo('Fix the shelf', { date: day(0), list: apartment.id });
  await api.todo('Water the basil', { date: day(0), done_at: at(0, '08:30') });
  await api.todo('Pay rent', { date: day(-1), list: apartment.id });
  await api.todo('Book flights', { inbox: true });
  await api.todo('Return the drill', { list: apartment.id });
  await api.todo('Old task', { list: apartment.id, archived_at: at(-2, '12:00') });
  await api.todo('Deleted task', { list: apartment.id, deleted_at: at(-4, '12:00') });
  const invoice = await api.todo('Send invoice', {
    list: clientA.id,
    date: day(1),
    time: '10:00',
    reminder: at(1, '09:30'),
  });
  await api.create('steps', { todo: invoice.id, text: 'Hours from timesheet', done: true, order: 0 });
  await api.create('steps', { todo: invoice.id, text: 'Attach the PDF', done: false, order: 1 });

  const bathroom = await api.todo('Clean bathroom', {
    repeat_mode: 'rough',
    repeat_every_days: 7,
  });
  await api.create('completions', { todo: bathroom.id, done_on: day(-9) });
  const plants = await api.todo('Water plants', {
    repeat_mode: 'schedule',
    repeat_every_weeks: 1,
    repeat_weekdays: [1, 4],
  });
  await api.create('completions', { todo: plants.id, done_on: day(-1) });

  const meeting = await api.note('Meeting notes', {
    list: clientA.id,
    body: 'Agreed on the scope.\n\n- Login first\n- Then payments',
  });
  const loginNote = await api.note('How the login flow works', {
    list: clientA.id,
    body: '## Tokens\n\nThe token is refreshed in `middleware`. See [[Meeting notes]].\n\n- Short lived\n- Rotated',
    links: [meeting.id],
    todos: [invoice.id],
  });
  await api.note('', { inbox: true, body: 'https://example.com/an-article-worth-reading' });
  await api.note('Archived idea', { list: apartment.id, archived_at: at(-1, '18:00') });

  const lunch = await api.create('calendar_events', {
    calendar: 'work',
    external_id: 'lunch-1',
    title: 'Lunch with Ana',
    start: at(0, '12:00'),
    end: at(0, '13:00'),
    all_day: false,
    synced_at: at(0, '09:00'),
  });
  await api.create('settings', { calendars: [{ id: 'work', name: 'Work', enabled: true }] });

  return {
    apartment: apartment.id,
    clientA: clientA.id,
    invoice: invoice.id,
    bathroom: bathroom.id,
    loginNote: loginNote.id,
    lunch: lunch.id,
  };
}

function screens(fixture: Fixture): [string, string][] {
  return [
    ['today', '/'],
    ['inbox', '/inbox'],
    ['lists', '/lists'],
    ['list', `/lists/${fixture.apartment}`],
    ['list-settings', `/lists/${fixture.clientA}/settings`],
    ['manage-lists', '/lists/edit'],
    ['note', `/note/${fixture.loginNote}`],
    ['todo', `/todo/${fixture.invoice}`],
    ['repeating', '/repeating'],
    ['repeat-editor', `/repeat/${fixture.bathroom}`],
    ['event', `/event/${fixture.lunch}`],
    ['agenda', '/agenda'],
    ['week', '/week'],
    ['search', '/search?q=in'],
    ['archive', '/archive'],
    ['deleted', '/archive/deleted'],
    ['settings', '/settings'],
    ['calendars', '/settings/calendars'],
  ];
}

async function openAt(browser: Browser, viewport: { width: number; height: number }) {
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: 1,
    isMobile: viewport === MOBILE,
    hasTouch: viewport === MOBILE,
  });
  const page = await context.newPage();
  await page.clock.setFixedTime(NOW);
  return page;
}

async function settle(page: Page) {
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(800);
}

async function capture(page: Page, name: string) {
  await settle(page);
  await expect(page).toHaveScreenshot(`${name}.png`, { fullPage: true, animations: 'disabled' });
}

for (const [size, viewport] of [
  ['mobile', MOBILE],
  ['desktop', DESKTOP],
] as const) {
  test(`every screen looks the same (${size})`, async ({ browser }) => {
    test.setTimeout(240_000);
    const { api, life } = await freshAccount();
    const fixture = await seed(api, life);
    const page = await openAt(browser, viewport);
    await signIn(page);

    for (const [name, path] of screens(fixture)) {
      await page.goto(path);
      await capture(page, `${size}-${name}`);
    }

    await page.goto(`/note/${fixture.loginNote}`);
    await page.getByLabel('Note text').click({ position: { x: 5, y: 5 } });
    await capture(page, `${size}-note-editing`);

    await page.goto('/');
    await page.getByRole('button', { name: 'Capture' }).first().click();
    await capture(page, `${size}-capture`);

    await page.goto('/todo/new');
    await capture(page, `${size}-todo-new`);

    await page.goto('/settings');
    await page.getByRole('button', { name: 'Sign out' }).click();
    await page.waitForURL('**/sign-in');
    await capture(page, `${size}-sign-in`);
    await page.context().close();
  });
}
