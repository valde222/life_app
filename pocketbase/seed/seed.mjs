const baseUrl = process.env.PB_URL ?? 'http://localhost:8090';
const email = process.env.PB_USER_EMAIL;
const password = process.env.PB_USER_PASSWORD;

const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
const newId = () => Array.from({ length: 15 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');

const day = (offset) => {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};
const instant = (offset, time = '12:00') => new Date(`${day(offset)}T${time}:00`).toISOString().replace('T', ' ');

let token;

async function request(method, path, body) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: { 'content-type': 'application/json', ...(token ? { authorization: token } : {}) },
    body: body && JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`${method} ${path}: ${response.status} ${await response.text()}`);
  }
  return response.json();
}

const create = (collection, fields) =>
  request('POST', `/api/collections/${collection}/records`, { id: newId(), changed_at: Date.now(), ...fields });

async function waitForServer() {
  for (let attempt = 0; attempt < 60; attempt++) {
    try {
      await fetch(`${baseUrl}/api/health`);
      return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
  throw new Error(`PocketBase not reachable at ${baseUrl}`);
}

async function seed() {
  const groups = {};
  for (const [order, name] of ['Life', 'Work', 'Hobbies'].entries()) {
    groups[name] = await create('groups', { name, order });
  }

  const lists = {};
  const listSpecs = [
    ['Life', 'Life', 'blue'],
    ['Apartment', 'Life', 'purple'],
    ['Shopping', 'Life', 'teal'],
    ['Music', 'Life', 'green'],
    ['Someday', 'Life', 'grey'],
    ['Client A', 'Work', 'orange'],
    ['Client B', 'Work', 'pink'],
    ['Bouldering', 'Hobbies', 'teal'],
  ];
  for (const [order, [name, group, colour]] of listSpecs.entries()) {
    lists[name] = await create('lists', { name, group: groups[group].id, colour, order });
  }

  const todo = (title, list, fields = {}) =>
    create('todos', { title, list: list ? lists[list].id : '', repeat_mode: 'none', ...fields });

  await todo('Lunch with sister', null, { date: day(0), time: '12:00', time_end: '13:00', is_event: true });
  await todo('Call the landlord', 'Apartment', { date: day(0), time: '17:00' });
  const taxes = await todo('Pay taxes', 'Life', { date: day(0) });
  await todo('Review login PR', 'Client A', { date: day(0) });
  const livingRoom = await todo('Set up the living room', 'Apartment', { date: day(0) });
  await todo('Practice chords, 15 min', 'Music', { date: day(0) });
  await todo('Coffee beans', 'Shopping', { date: day(0), done_at: instant(0, '09:30') });
  await todo('Book the dentist', 'Life', { date: day(-1) });
  await todo('Return the drill', 'Apartment', { date: day(-1) });

  for (const [order, [text, done]] of [['Measure the wall', true], ['Order the shelf', false], ['Hang the lamp', false]].entries()) {
    await create('steps', { todo: livingRoom.id, text, done, order });
  }

  for (const title of ['Set up Client A staging', 'Fix flaky e2e test', 'Write handover notes', 'Ask about rollback plan']) {
    await todo(title, 'Client A', title === 'Set up Client A staging' ? { date: day(2) } : {});
  }
  for (const title of ['Send invoice', 'Update the style guide', 'Plan the kickoff']) {
    await todo(title, 'Client B');
  }
  for (const title of ['Learn to juggle', 'Visit Lisbon', 'Read Middlemarch']) {
    await todo(title, 'Someday');
  }

  const repeating = [
    ['Call grandma', 'Life', { repeat_mode: 'rough', repeat_every_days: 14 }, [16, 30, 43, 58]],
    ['Clean bathroom', 'Apartment', { repeat_mode: 'rough', repeat_every_days: 7 }, [9, 17, 24, 32]],
    ['Vacuum', 'Apartment', { repeat_mode: 'rough', repeat_every_days: 7 }, [5, 12, 20, 27]],
    ['Change sheets', 'Apartment', { repeat_mode: 'rough', repeat_every_days: 14 }, [6, 20, 35]],
    ['Water plants', 'Apartment', { repeat_mode: 'schedule', repeat_every_weeks: 1, repeat_weekdays: [1, 4] }, [2, 5, 8, 11]],
  ];
  for (const [title, list, fields, daysAgo] of repeating) {
    const item = await todo(title, list, fields);
    for (const ago of daysAgo) {
      await create('completions', { todo: item.id, done_on: day(-ago) });
    }
  }

  await todo('buy butter', null, { inbox: true });
  await todo('read up on postgres indexes', null, { inbox: true });
  await todo('fix the bike light', null, { inbox: true });
  for (const title of ['Wall is 312 cm', 'Idea: a tray app for the PC hotkey', 'Bike lock code 4471']) {
    await create('notes', { title, body: '', inbox: true });
  }

  const note = (title, list, body, todos = []) => create('notes', { title, list: lists[list].id, body, todos });
  await note('How the login flow works', 'Client A', 'Token is refreshed in middleware, not in the client.');
  await note('Why the staging deploy failed', 'Client A', 'Migrations ran after traffic switched.');
  await note('Client A onboarding', 'Client A', 'Accounts, repos, who to ask for what.');
  await note('Living room plan', 'Apartment', 'Shelf on the long wall, lamp by the window.', [livingRoom.id]);
  await note('Chord shapes', 'Music', 'G, C, D, Em. Practise the change from C to G.');
  await note('Tax papers', 'Life', 'Annual statement is in the blue folder.', [taxes.id]);

  await create('settings', { calendars: [] });
}

await waitForServer();
const auth = await request('POST', '/api/collections/users/auth-with-password', { identity: email, password });
token = auth.token;
const existing = await request('GET', '/api/collections/groups/records?perPage=1');
if (existing.totalItems > 0) {
  console.log('Seed data already present; nothing to do.');
} else {
  await seed();
  console.log('Seed data written.');
}
