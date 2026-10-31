import { TestBed } from '@angular/core/testing';
import { LocalStore } from './local-store';
import { StepActions } from './step-actions';

describe('StepActions', () => {
  let local: LocalStore;
  let steps: StepActions;

  beforeEach(async () => {
    local = TestBed.inject(LocalStore);
    await local.open();
    await Promise.all(local.tables.map((table) => table.clear()));
    steps = TestBed.inject(StepActions);
  });

  it('adds steps in order, ticks and removes them', async () => {
    await steps.addAll('t1', [
      { text: 'first', done: true },
      { text: 'second', done: false },
    ]);
    await steps.add('t1', 'third', 2);
    const saved = (await local.records('steps').toArray()).sort((a, b) => a.order - b.order);
    expect(saved.map((step) => [step.text, step.done, step.order])).toEqual([
      ['first', true, 0],
      ['second', false, 1],
      ['third', false, 2],
    ]);

    await steps.toggle(saved[1]);
    await steps.remove(saved[0].id);
    expect((await local.records('steps').get(saved[1].id))?.done).toBe(true);
    expect((await local.records('steps').get(saved[0].id))?.deleted_at).not.toBe('');
  });
});
