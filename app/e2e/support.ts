import { expect, Page } from '@playwright/test';
import { E2E_ADMIN, E2E_SERVER, E2E_USER } from '../playwright.config';

const COLLECTIONS_CHILDREN_FIRST = [
  'steps',
  'completions',
  'notes',
  'todos',
  'lists',
  'groups',
  'calendar_events',
  'settings',
];
const ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';

export const newId = () =>
  Array.from({ length: 15 }, () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]).join('');

export function localDate(date = new Date(), offset = 0) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + offset);
  return `${copy.getFullYear()}-${String(copy.getMonth() + 1).padStart(2, '0')}-${String(copy.getDate()).padStart(2, '0')}`;
}

export function todayAt(time: string) {
  return new Date(`${localDate()}T${time}:00`);
}

export type ApiRecord = { id: string } & Record<string, unknown>;

export class Api {
  private constructor(private readonly token: string) {}

  static async signIn() {
    const response = await fetch(`${E2E_SERVER}/api/collections/users/auth-with-password`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ identity: E2E_USER.email, password: E2E_USER.password }),
    });
    const { token } = (await response.json()) as { token: string };
    return new Api(token);
  }

  async create(collection: string, fields: Record<string, unknown>) {
    const response = await this.call('POST', `/api/collections/${collection}/records`, {
      id: newId(),
      changed_at: Date.now(),
      ...fields,
    });
    if (!response.ok) {
      throw new Error(`create ${collection}: ${await response.text()}`);
    }
    return (await response.json()) as ApiRecord;
  }

  async list(collection: string, filter = '') {
    const query = new URLSearchParams({ perPage: '500', filter });
    const response = await this.call('GET', `/api/collections/${collection}/records?${query}`);
    return ((await response.json()) as { items: ApiRecord[] }).items;
  }

  async clear() {
    for (const collection of COLLECTIONS_CHILDREN_FIRST) {
      for (const record of await this.list(collection)) {
        await this.call('DELETE', `/api/collections/${collection}/records/${record.id}`);
      }
    }
  }

  async group(name: string) {
    return this.create('groups', { name, order: 0 });
  }

  async list_(name: string, group: string, colour = 'purple') {
    return this.create('lists', { name, group, colour, order: 0 });
  }

  async todo(title: string, fields: Record<string, unknown> = {}) {
    return this.create('todos', { title, repeat_mode: 'none', ...fields });
  }

  async note(title: string, fields: Record<string, unknown> = {}) {
    return this.create('notes', { title, body: '', ...fields });
  }

  private call(method: string, path: string, body?: unknown) {
    return fetch(`${E2E_SERVER}${path}`, {
      method,
      headers: { 'content-type': 'application/json', authorization: this.token },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  }
}

export async function longLivedTokens() {
  const auth = await fetch(`${E2E_SERVER}/api/collections/_superusers/auth-with-password`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ identity: E2E_ADMIN.email, password: E2E_ADMIN.password }),
  });
  const { token } = (await auth.json()) as { token: string };
  const response = await fetch(`${E2E_SERVER}/api/collections/users`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json', authorization: token },
    body: JSON.stringify({ authToken: { duration: 30 * 86_400 } }),
  });
  expect(response.ok).toBe(true);
}

export async function freshAccount() {
  const api = await Api.signIn();
  await api.clear();
  const life = await api.group('Life');
  return { api, life };
}

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

export async function swipe(page: Page, text: string, direction: 'right' | 'left') {
  const box = (await page.getByText(text, { exact: true }).boundingBox())!;
  const y = box.y + box.height / 2;
  const start = direction === 'right' ? box.x + 10 : box.x + box.width - 10;
  const distance = direction === 'right' ? 140 : -140;
  await page.mouse.move(start, y);
  await page.mouse.down();
  for (let step = 1; step <= 10; step++) {
    await page.mouse.move(start + (distance * step) / 10, y);
  }
  await page.mouse.up();
}
