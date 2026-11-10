import { expect, test } from '@playwright/test';
import { freshAccount, signIn } from './support';

test('T17: files added to a note keep their names, open, reach the other device and can be removed (R31)', async ({
  browser,
}) => {
  const { api } = await freshAccount();
  const note = await api.note('Flat');
  const filesOnServer = async () =>
    ((await api.list('notes', `id = "${note.id}"`))[0]['files'] as string[]).length;

  const phone = await (await browser.newContext()).newPage();
  await signIn(phone);
  await phone.goto(`/note/${note.id}`);
  const chooser = phone.waitForEvent('filechooser');
  await phone.getByRole('button', { name: '+ File' }).click();
  await (
    await chooser
  ).setFiles([
    {
      name: 'Lejekontrakt Æblegrød.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('%PDF-1.4'),
    },
    { name: 'notes.txt', mimeType: 'text/plain', buffer: Buffer.from('Ring til udlejer') },
  ]);

  await expect(phone.getByRole('button', { name: 'Open Lejekontrakt Æblegrød.pdf' })).toBeVisible();
  await expect.poll(filesOnServer).toBe(2);
  await expect(phone.getByRole('button', { name: 'Open notes.txt' })).toBeEnabled();

  await phone.evaluate(() => {
    const opened: string[] = [];
    Object.assign(window, { opened });
    window.open = (url?: string | URL) => {
      opened.push(String(url));
      return null;
    };
  });
  await phone.getByRole('button', { name: 'Open notes.txt' }).click();
  const opened = () => phone.evaluate(() => (window as unknown as { opened: string[] }).opened);
  await expect.poll(async () => (await opened()).length).toBe(1);
  const [url] = await opened();
  expect(await (await phone.request.get(url)).text()).toBe('Ring til udlejer');

  const desktop = await (await browser.newContext()).newPage();
  await signIn(desktop);
  await desktop.goto(`/note/${note.id}`);
  await expect(
    desktop.getByRole('button', { name: 'Open Lejekontrakt Æblegrød.pdf' }),
  ).toBeVisible();
  await expect(desktop.getByRole('button', { name: 'Open notes.txt' })).toBeVisible();

  await phone.getByRole('button', { name: 'Remove notes.txt' }).click();
  await expect(phone.getByRole('button', { name: 'Open notes.txt' })).toBeVisible();
  await phone.getByRole('button', { name: 'Remove', exact: true }).click();
  await expect(phone.getByRole('button', { name: 'Open notes.txt' })).toHaveCount(0);
  await expect.poll(filesOnServer).toBe(1);
  await expect(desktop.getByRole('button', { name: 'Open notes.txt' })).toHaveCount(0);
});
