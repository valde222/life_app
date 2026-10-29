import { Completion, EMPTY_RECORDS, Todo } from '../data/models';
import { isScheduledOn, repeatStatus, weekdayList } from './repeat-status';

const created = '2026-10-01 08:00:00.000Z';
const rough = (days: number): Todo => ({
  ...EMPTY_RECORDS.todos,
  id: 'rough0000000001',
  title: 'Clean bathroom',
  repeat_mode: 'rough',
  repeat_every_days: days,
  created,
});
const schedule = (weekdays: number[], weeks = 1): Todo => ({
  ...EMPTY_RECORDS.todos,
  id: 'sched0000000001',
  title: 'Water plants',
  repeat_mode: 'schedule',
  repeat_weekdays: weekdays,
  repeat_every_weeks: weeks,
  created,
});
const done = (todo: Todo, ...days: string[]): Completion[] =>
  days.map((done_on, index) => ({
    ...EMPTY_RECORDS.completions,
    id: `c${index}`,
    todo: todo.id,
    done_on,
  }));

describe('repeatStatus, roughly (R19)', () => {
  it('counts days since the last completion and turns red past the target', () => {
    const bathroom = rough(7);
    const status = repeatStatus(bathroom, done(bathroom, '2026-10-12', '2026-10-04'), '2026-10-21');
    expect(status.daysSince).toBe(9);
    expect(status.tag).toBe('9 days');
    expect(status.overdue).toBe(true);
    expect(status.sub).toBe('about weekly');
  });

  it('is not red on the target day itself', () => {
    const bathroom = rough(7);
    expect(repeatStatus(bathroom, done(bathroom, '2026-10-14'), '2026-10-21').overdue).toBe(false);
  });

  it('never turns red when it just counts days', () => {
    const counted = rough(0);
    expect(repeatStatus(counted, done(counted, '2026-01-01'), '2026-10-21').overdue).toBe(false);
  });

  it('resets to today once ticked', () => {
    const bathroom = rough(7);
    const status = repeatStatus(bathroom, done(bathroom, '2026-10-12', '2026-10-21'), '2026-10-21');
    expect(status.daysSince).toBe(0);
    expect(status.overdue).toBe(false);
  });
});

describe('repeatStatus, on a schedule (R20)', () => {
  const plants = schedule([1, 4]);

  it('shows the next due day', () => {
    const tuesday = '2026-10-20';
    const status = repeatStatus(plants, done(plants, '2026-10-19'), tuesday);
    expect(status.tag).toBe('Thu');
    expect(status.overdue).toBe(false);
    expect(status.sub).toBe('every Mon and Thu');
  });

  it('turns red the day after a due day that was not done', () => {
    const friday = '2026-10-23';
    expect(repeatStatus(plants, done(plants, '2026-10-19'), friday).overdue).toBe(true);
    expect(repeatStatus(plants, done(plants, '2026-10-19', '2026-10-22'), friday).overdue).toBe(
      false,
    );
  });

  it('is due today but not red on the day itself', () => {
    const thursday = '2026-10-22';
    const status = repeatStatus(plants, done(plants, '2026-10-19'), thursday);
    expect(status.tag).toBe('Today');
    expect(status.overdue).toBe(false);
  });

  it('skips weeks when it repeats every 2 weeks', () => {
    const fortnightly = schedule([1], 2);
    expect(isScheduledOn(fortnightly, '2026-09-29')).toBe(false);
    expect(isScheduledOn(fortnightly, '2026-10-12')).toBe(true);
    expect(isScheduledOn(fortnightly, '2026-10-19')).toBe(false);
  });

  it('names weekdays Monday first', () => {
    expect(weekdayList([4, 1])).toBe('Mon and Thu');
    expect(weekdayList([0, 2, 6])).toBe('Tue, Sat and Sun');
  });
});
