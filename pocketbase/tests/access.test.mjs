import assert from 'node:assert/strict';
import { createHmac, randomBytes } from 'node:crypto';
import { after, before, describe, test } from 'node:test';

const baseUrl = process.env.PB_URL ?? 'http://localhost:8090';
const owner = { email: process.env.PB_USER_EMAIL, password: process.env.PB_USER_PASSWORD };
const admin = { email: process.env.PB_ADMIN_EMAIL, password: process.env.PB_ADMIN_PASSWORD };

const COLLECTIONS = {
  groups: () => ({ name: 'Secret group' }),
  lists: () => ({ name: 'Secret list' }),
  todos: () => ({ title: 'Secret todo' }),
  steps: () => ({ text: 'Secret step' }),
  completions: () => ({ done_on: '2026-01-01' }),
  notes: () => ({ title: 'Secret note', body: 'Secret body' }),
  calendar_events: () => ({ title: 'Secret event', external_id: randomBytes(6).toString('hex') }),
  settings: () => ({ calendars: { secret: true } }),
};

const newId = () => randomBytes(8).toString('hex').slice(0, 15);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function call(method, path, { token, body, headers = {} } = {}) {
  for (let attempt = 0; ; attempt++) {
    const isForm = body instanceof FormData;
    const response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: {
        ...(body && !isForm ? { 'content-type': 'application/json' } : {}),
        ...(token ? { authorization: token } : {}),
        ...headers,
      },
      body: body && (isForm ? body : JSON.stringify(body)),
    });
    if (response.status === 429 && attempt < 20 && !headers['x-forwarded-for']) {
      await sleep(1000);
      continue;
    }
    const text = await response.text();
    let json = null;
    try {
      json = JSON.parse(text);
    } catch {}
    return { status: response.status, body: json, text };
  }
}

async function signIn(collection, { email, password }) {
  const auth = await call('POST', `/api/collections/${collection}/auth-with-password`, {
    body: { identity: email, password },
  });
  assert.equal(auth.status, 200, `${email} signs in`);
  return auth.body;
}

const base64url = (value) => Buffer.from(value).toString('base64url');
const claims = (token) => JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString());

function jwt(header, payload, secret) {
  const unsigned = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(payload))}`;
  const signature = secret === null ? '' : createHmac('sha256', secret).update(unsigned).digest('base64url');
  return `${unsigned}.${signature}`;
}

let ownerToken;
let ownerId;
let adminToken;
let otherToken;
let otherId;
let expiredToken;
let superusersId;
const victims = {};
let photoNote;
let photoName;

before(async () => {
  assert.ok(owner.email && admin.email, 'PB_USER_* and PB_ADMIN_* are set');
  ({ token: ownerToken, record: { id: ownerId } } = await signIn('users', owner));
  ({ token: adminToken } = await signIn('_superusers', admin));
  superusersId = (await call('GET', '/api/collections/_superusers', { token: adminToken })).body.id;

  for (const [collection, make] of Object.entries(COLLECTIONS)) {
    const id = newId();
    const created = await call('POST', `/api/collections/${collection}/records`, {
      token: ownerToken,
      body: { id, ...make(), changed_at: Date.now() },
    });
    assert.equal(created.status, 200, `the owner creates a ${collection} record: ${created.text}`);
    victims[collection] = id;
  }

  const form = new FormData();
  form.append('id', newId());
  form.append('title', 'Photo note');
  form.append('photos', new Blob([tinyPng()], { type: 'image/png' }), 'secret.png');
  const withPhoto = await call('POST', '/api/collections/notes/records', { token: ownerToken, body: form });
  assert.equal(withPhoto.status, 200, `the owner uploads a photo: ${withPhoto.text}`);
  photoNote = withPhoto.body;
  photoName = photoNote.photos[0];

  const other = { email: `other-${newId()}@example.com`, password: randomBytes(12).toString('hex') };
  const made = await call('POST', '/api/collections/users/records', {
    token: adminToken,
    body: { ...other, passwordConfirm: other.password, verified: true },
  });
  assert.equal(made.status, 200, `a superuser can add a second account: ${made.text}`);
  otherId = made.body.id;
  ({ token: otherToken } = await signIn('users', other));

  const users = (await call('GET', '/api/collections/users', { token: adminToken })).body;
  const duration = users.authToken.duration;
  const shortened = await call('PATCH', '/api/collections/users', {
    token: adminToken,
    body: { authToken: { duration: 10 } },
  });
  assert.equal(shortened.status, 200, shortened.text);
  try {
    ({ token: expiredToken } = await signIn('users', owner));
  } finally {
    await call('PATCH', '/api/collections/users', { token: adminToken, body: { authToken: { duration } } });
  }
  await sleep(11_000);
  assert.ok(claims(expiredToken).exp * 1000 < Date.now(), 'the expired token really has expired');
});

after(async () => {
  if (otherId) {
    await call('DELETE', `/api/collections/users/records/${otherId}`, { token: adminToken });
  }
});

function attackers() {
  const { id, collectionId } = claims(ownerToken);
  const exp = Math.floor(Date.now() / 1000) + 3600;
  const payload = { id, collectionId, type: 'auth', refreshable: true, exp };
  const [header, , signature] = ownerToken.split('.');
  return {
    'signed out': undefined,
    'an expired token': expiredToken,
    'an unsigned token': jwt({ alg: 'none', typ: 'JWT' }, payload, null),
    'a token signed with a guessed secret': jwt({ alg: 'HS256', typ: 'JWT' }, payload, 'secret'),
    'a real token with a changed payload': `${header}.${base64url(JSON.stringify({ ...payload, exp: exp + 1 }))}.${signature}`,
    'a forged superuser token': jwt(
      { alg: 'HS256', typ: 'JWT' },
      { ...payload, collectionId: superusersId },
      'secret',
    ),
    'another account': otherToken,
  };
}

async function ownerSees(collection, id) {
  return call('GET', `/api/collections/${collection}/records/${id}`, { token: ownerToken });
}

describe('every collection refuses anyone but the owner', () => {
  for (const collection of Object.keys(COLLECTIONS)) {
    test(collection, async () => {
      for (const [who, token] of Object.entries(attackers())) {
        const victim = victims[collection];
        const label = `${collection}, ${who}`;

        const list = await call('GET', `/api/collections/${collection}/records?perPage=500`, { token });
        assert.ok(list.status !== 200 || list.body.totalItems === 0, `${label}: list is empty (${list.text})`);

        const view = await call('GET', `/api/collections/${collection}/records/${victim}`, { token });
        assert.notEqual(view.status, 200, `${label}: view is refused`);

        const update = await call('PATCH', `/api/collections/${collection}/records/${victim}`, {
          token,
          body: { changed_at: 0, deleted_at: '2026-01-01 00:00:00.000Z' },
        });
        assert.ok(update.status >= 400, `${label}: update is refused (${update.status} ${update.text})`);
        assert.ok(!update.text.includes(victim), `${label}: the refusal doesn't echo the record`);

        const remove = await call('DELETE', `/api/collections/${collection}/records/${victim}`, { token });
        assert.ok(remove.status >= 400, `${label}: delete is refused (${remove.status})`);

        const stored = await ownerSees(collection, victim);
        assert.equal(stored.status, 200, `${label}: the record still exists`);
        assert.equal(stored.body.deleted_at, '', `${label}: the record is unchanged`);

        if (token !== otherToken) {
          const id = newId();
          const create = await call('POST', `/api/collections/${collection}/records`, {
            token,
            body: { id, ...COLLECTIONS[collection]() },
          });
          assert.ok(create.status >= 400, `${label}: create is refused (${create.status})`);
          assert.equal((await ownerSees(collection, id)).status, 404, `${label}: nothing was created`);
        }
      }
    });
  }

  test("another account can't create records in the owner's name", async () => {
    for (const collection of Object.keys(COLLECTIONS)) {
      const id = newId();
      await call('POST', `/api/collections/${collection}/records`, {
        token: otherToken,
        body: { id, ...COLLECTIONS[collection](), owner: ownerId },
      });
      assert.equal((await ownerSees(collection, id)).status, 404, `${collection}: nothing appears for the owner`);
    }
  });

  test("the owner can't hand a record to another account", async () => {
    const id = victims.todos;
    await call('PATCH', `/api/collections/todos/records/${id}`, {
      token: ownerToken,
      body: { owner: otherId, changed_at: Date.now() },
    });
    assert.equal((await ownerSees('todos', id)).status, 200);
  });
});

describe('accounts', () => {
  test('nobody can sign up, signed out or signed in', async () => {
    for (const token of [undefined, otherToken]) {
      const password = randomBytes(12).toString('hex');
      const signUp = await call('POST', '/api/collections/users/records', {
        token,
        body: { email: `new-${newId()}@example.com`, password, passwordConfirm: password },
      });
      assert.ok(signUp.status >= 400, `sign-up is refused (${signUp.status})`);
    }
  });

  test("no account can see, change or delete another account", async () => {
    for (const [who, token] of Object.entries(attackers())) {
      const list = await call('GET', '/api/collections/users/records', { token });
      assert.ok(
        list.status !== 200 || list.body.items.every((user) => user.id !== ownerId),
        `${who}: the owner is not listed`,
      );
      assert.notEqual((await call('GET', `/api/collections/users/records/${ownerId}`, { token })).status, 200, who);
      const update = await call('PATCH', `/api/collections/users/records/${ownerId}`, {
        token,
        body: { email: 'taken@example.com' },
      });
      assert.ok(update.status >= 400, `${who}: update is refused`);
      assert.ok((await call('DELETE', `/api/collections/users/records/${ownerId}`, { token })).status >= 400, who);
    }
  });

  test('an account cannot delete itself with a stolen token', async () => {
    const remove = await call('DELETE', `/api/collections/users/records/${otherId}`, { token: otherToken });
    assert.ok(remove.status >= 400, `self-delete is refused (${remove.status})`);
  });

  test('sign-in is rate limited per client address', async () => {
    const client = `203.0.113.${1 + Math.floor(Math.random() * 250)}`;
    const statuses = [];
    for (let attempt = 0; attempt < 12; attempt++) {
      const response = await call('POST', '/api/collections/users/auth-with-password', {
        body: { identity: owner.email, password: 'wrong-password' },
        headers: { 'x-forwarded-for': client },
      });
      statuses.push(response.status);
    }
    assert.ok(statuses.includes(429), `repeated wrong passwords are throttled: ${statuses.join(',')}`);
  });
});

describe('photos', () => {
  const fileUrl = (token) =>
    `/api/files/notes/${photoNote.id}/${photoName}${token ? `?token=${token}` : ''}`;

  test('the owner can fetch a photo with a file token', async () => {
    const { token } = (await call('POST', '/api/files/token', { token: ownerToken })).body;
    assert.equal((await call('GET', fileUrl(token))).status, 200);
  });

  test('a photo cannot be fetched without a file token or with another account’s', async () => {
    assert.notEqual((await call('GET', fileUrl())).status, 200, 'no token');
    assert.notEqual((await call('GET', fileUrl(), { token: ownerToken })).status, 200, 'auth token is not a file token');
    const { token } = (await call('POST', '/api/files/token', { token: otherToken })).body;
    assert.notEqual((await call('GET', fileUrl(token))).status, 200, 'another account');
    for (const [who, forged] of Object.entries(attackers())) {
      if (forged && forged !== otherToken) {
        assert.notEqual((await call('GET', fileUrl(forged))).status, 200, who);
      }
    }
  });

  test('only images are accepted as photos', async () => {
    for (const [name, type, content] of [
      ['evil.html', 'text/html', '<script>alert(1)</script>'],
      ['evil.svg', 'image/svg+xml', '<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"/>'],
      ['evil.png', 'image/png', '<html><script>alert(1)</script></html>'],
    ]) {
      const form = new FormData();
      form.append('photos+', new Blob([content], { type }), name);
      const upload = await call('PATCH', `/api/collections/notes/records/${photoNote.id}`, {
        token: ownerToken,
        body: form,
      });
      assert.ok(upload.status >= 400, `${name} is refused (${upload.status})`);
    }
  });
});

describe('realtime', () => {
  const createTodo = (title) => () =>
    call('POST', '/api/collections/todos/records', {
      token: ownerToken,
      body: { id: newId(), title, changed_at: Date.now() },
    });

  test('the owner receives their own changes', async () => {
    const events = await listen(ownerToken, createTodo('Realtime check'));
    assert.ok(events.includes('Realtime check'), events);
  });

  test('changes are not pushed to anyone but the owner', async () => {
    for (const [who, token] of Object.entries(attackers())) {
      const events = await listen(token, createTodo('Realtime secret'));
      assert.ok(!events.includes('Realtime secret'), `${who}: no event received`);
    }
  });
});

describe('superuser access through the public address', () => {
  const forwarded = { 'x-forwarded-for': '198.51.100.7', 'x-forwarded-proto': 'https' };

  test('the dashboard is not served', async () => {
    const page = await call('GET', '/_/', { headers: forwarded });
    assert.notEqual(page.status, 200);
  });

  test('superusers cannot sign in', async () => {
    const auth = await call('POST', '/api/collections/_superusers/auth-with-password', {
      body: { identity: admin.email, password: admin.password },
      headers: forwarded,
    });
    assert.ok(auth.status >= 400, `refused (${auth.status})`);
  });

  test('a superuser token is refused', async () => {
    const settings = await call('GET', '/api/settings', { token: adminToken, headers: forwarded });
    assert.ok(settings.status >= 400, `refused (${settings.status})`);
    const records = await call('GET', '/api/collections/notes/records', { token: adminToken, headers: forwarded });
    assert.ok(records.status >= 400, `refused (${records.status})`);
  });

  test('the owner still signs in and syncs through the public address', async () => {
    const auth = await call('POST', '/api/collections/users/auth-with-password', {
      body: { identity: owner.email, password: owner.password },
      headers: forwarded,
    });
    assert.equal(auth.status, 200, auth.text);
    const list = await call('GET', '/api/collections/todos/records', { token: auth.body.token, headers: forwarded });
    assert.equal(list.status, 200);
  });

  test('the backup job and the local dashboard still work', async () => {
    assert.equal((await call('GET', '/api/settings', { token: adminToken })).status, 200);
  });
});

describe('errors', () => {
  test("a bad filter doesn't leak SQL or internals", async () => {
    const filter = encodeURIComponent("no_such_field = 1 || title ~ 'x'");
    const response = await call('GET', `/api/collections/todos/records?filter=${filter}`, { token: ownerToken });
    assert.equal(response.status, 400);
    assert.ok(!/sqlite|SELECT|stack|\.go:/i.test(response.text), response.text);
  });
});

async function listen(token, act) {
  const controller = new AbortController();
  const response = await fetch(`${baseUrl}/api/realtime`, { signal: controller.signal });
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let received = '';
  const first = await reader.read();
  received += decoder.decode(first.value);
  const clientId = /"clientId":"([^"]+)"/.exec(received)[1];
  await call('POST', '/api/realtime', { token, body: { clientId, subscriptions: ['todos/*', 'todos'] } });
  const reading = (async () => {
    try {
      for (;;) {
        const { value, done } = await reader.read();
        if (done) {
          break;
        }
        received += decoder.decode(value);
      }
    } catch {}
  })();
  await act();
  await sleep(1500);
  controller.abort();
  await reading;
  return received;
}

function tinyPng() {
  return Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
    'base64',
  );
}
