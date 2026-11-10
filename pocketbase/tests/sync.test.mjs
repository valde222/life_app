import assert from 'node:assert/strict';
import { before, test } from 'node:test';

const baseUrl = process.env.PB_URL ?? 'http://localhost:8090';
let token;

async function call(method, path, body) {
  for (;;) {
    const response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: { 'content-type': 'application/json', ...(token ? { authorization: token } : {}) },
      body: body && JSON.stringify(body),
    });
    if (response.status !== 429) {
      return { status: response.status, body: await response.json() };
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
}

const newId = () => Math.random().toString(36).slice(2, 9).padEnd(15, '0');

before(async () => {
  const auth = await call('POST', '/api/collections/users/auth-with-password', {
    identity: process.env.PB_USER_EMAIL,
    password: process.env.PB_USER_PASSWORD,
  });
  assert.equal(auth.status, 200, 'the configured account signs in');
  token = auth.body.token;
});

test('every update is saved, even with an older changed_at: the last to arrive wins', async () => {
  const id = newId();
  await call('POST', '/api/collections/todos/records', { id, title: 'changed later on its device', changed_at: 200 });
  const update = await call('PATCH', `/api/collections/todos/records/${id}`, { title: 'arrived last', changed_at: 100 });
  assert.equal(update.body.title, 'arrived last');
  const stored = await call('GET', `/api/collections/todos/records/${id}`);
  assert.equal(stored.body.title, 'arrived last');
});

test('nobody can sign up', async () => {
  const savedToken = token;
  token = undefined;
  const signUp = await call('POST', '/api/collections/users/records', {
    email: 'someone@example.com',
    password: 'password1234',
    passwordConfirm: 'password1234',
  });
  token = savedToken;
  assert.equal(signUp.status, 403);
});

test('records are hidden from anyone not signed in', async () => {
  const savedToken = token;
  token = undefined;
  const list = await call('GET', '/api/collections/todos/records');
  token = savedToken;
  assert.equal(list.body.totalItems, 0);
});
