import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Clock } from '../time/clock';
import { Actions } from './actions';
import { LocalStore } from './local-store';
import { Note, Todo } from '../domain/models';

const NOW = new Date('2026-10-31T10:00:00');

class FixedClock {
  readonly now = signal(NOW);
  today() {
    return '2026-10-31';
  }
}

describe('Actions', () => {
  let store: LocalStore;
  let actions: Actions;

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [{ provide: Clock, useClass: FixedClock }] });
    store = TestBed.inject(LocalStore);
    await store.open();
    await Promise.all(store.tables.map((table) => table.clear()));
    actions = TestBed.inject(Actions);
  });

  const todo = (id: string) => store.records('todos').get(id) as Promise<Todo>;
  const note = (id: string) => store.records('notes').get(id) as Promise<Note>;

  it('a new todo or note without a list goes to the Inbox', async () => {
    expect((await actions.createTodo({ title: 'a' })).inbox).toBe(true);
    expect((await actions.createTodo({ title: 'b', list: 'l1' })).inbox).toBe(false);
    expect((await actions.createNote({ body: 'c' })).inbox).toBe(true);
    expect((await actions.createNote({ body: 'd', inbox: false })).inbox).toBe(false);
  });

  it('tick stamps done_at, untick clears it, and undo puts it back', async () => {
    const created = await actions.createTodo({ title: 'a' });
    const undo = await actions.tick(created);
    expect((await todo(created.id)).done_at).toBe(NOW.toISOString().replace('T', ' '));

    await undo();
    expect((await todo(created.id)).done_at).toBe('');

    await actions.tick(created);
    await actions.untick(await todo(created.id));
    expect((await todo(created.id)).done_at).toBe('');
  });

  it('put on Today dates it today and takes it out of the Inbox', async () => {
    const created = await actions.createTodo({ title: 'a' });
    const undo = await actions.putOnToday(created);
    expect(await todo(created.id)).toMatchObject({ date: '2026-10-31', inbox: false });

    await undo();
    expect(await todo(created.id)).toMatchObject({ date: '', inbox: true });
  });

  it('setting a date keeps an Inbox todo in the Inbox only while undated', async () => {
    const created = await actions.createTodo({ title: 'a' });
    await actions.setDate(created, '2026-11-02');
    expect(await todo(created.id)).toMatchObject({ date: '2026-11-02', inbox: false });
    await actions.setDate(created, '');
    expect((await todo(created.id)).inbox).toBe(true);
  });

  it('moving to a list leaves the Inbox; moving to no list returns to it', async () => {
    const created = await actions.createTodo({ title: 'a' });
    await actions.moveTodo(created, 'l1');
    expect(await todo(created.id)).toMatchObject({ list: 'l1', inbox: false });
    await actions.moveTodo(await todo(created.id), '');
    expect(await todo(created.id)).toMatchObject({ list: '', inbox: true });

    const kept = await actions.createNote({ body: 'x' });
    await actions.moveNote(kept, 'l2');
    expect(await note(kept.id)).toMatchObject({ list: 'l2', inbox: false });
  });

  it('keeping a note takes it out of the Inbox with any edits', async () => {
    const created = await actions.createNote({ body: 'x' });
    const undo = await actions.keepNote(created, { title: 'Kept' });
    expect(await note(created.id)).toMatchObject({ title: 'Kept', inbox: false });

    await undo();
    expect(await note(created.id)).toMatchObject({ title: '', inbox: true });
  });

  it('archive and delete stamp the time, and undo clears it', async () => {
    const created = await actions.createNote({ body: 'x' });
    const undoArchive = await actions.archiveNote(created);
    expect((await note(created.id)).archived_at).not.toBe('');
    await undoArchive();
    expect((await note(created.id)).archived_at).toBe('');

    const task = await actions.createTodo({ title: 'a' });
    await actions.archiveTodo(task);
    expect((await todo(task.id)).archived_at).not.toBe('');

    const undoDelete = await actions.delete('todos', task);
    expect((await todo(task.id)).deleted_at).not.toBe('');
    await undoDelete();
    expect((await todo(task.id)).deleted_at).toBe('');
  });

  it('making a todo from a note uses its title, or its first line, and deletes the note', async () => {
    const titled = await actions.createNote({
      title: 'Call Ana',
      body: 'about the flat',
      list: 'l1',
    });
    const undo = await actions.makeTodo(titled);
    const made = (await store.records('todos').toArray())[0];
    expect(made).toMatchObject({ title: 'Call Ana', list: 'l1', inbox: false });
    expect((await note(titled.id)).deleted_at).not.toBe('');

    await undo();
    expect((await todo(made.id)).deleted_at).not.toBe('');
    expect((await note(titled.id)).deleted_at).toBe('');

    await store.records('todos').clear();
    await actions.makeTodo(await actions.createNote({ body: 'first line\nsecond' }));
    expect((await store.records('todos').toArray())[0].title).toBe('first line');

    await store.records('todos').clear();
    await actions.makeTodo(await actions.createNote({ body: '' }));
    expect((await store.records('todos').toArray())[0]).toMatchObject({
      title: 'Untitled',
      inbox: true,
    });
  });

  it('completing a repeating todo records today, and undo deletes that completion', async () => {
    const chore = await actions.createTodo({ title: 'Clean', repeat_mode: 'rough' });
    const undo = await actions.complete(chore);
    const [completion] = await store.records('completions').toArray();
    expect(completion).toMatchObject({ todo: chore.id, done_on: '2026-10-31', deleted_at: '' });

    await undo();
    expect((await store.records('completions').get(completion.id))?.deleted_at).not.toBe('');

    await actions.complete(chore, '2026-10-29');
    expect((await store.records('completions').toArray()).map((each) => each.done_on)).toContain(
      '2026-10-29',
    );
  });
});
