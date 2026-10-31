import { EMPTY_RECORDS, Todo } from './models';
import { choresSummary, lastDoneLabel, repeatTargetText, usualGapText } from './repeat-labels';
import { RepeatStatus } from './repeat-status';

const status = (fields: Partial<RepeatStatus>): RepeatStatus => ({
  lastDone: null,
  daysSince: 0,
  target: 7,
  overdue: false,
  nextDue: null,
  tag: '',
  sub: '',
  ...fields,
});

describe('repeat labels', () => {
  it('says when it was last done', () => {
    expect(lastDoneLabel(status({}))).toBe('Never');
    expect(lastDoneLabel(status({ lastDone: '2026-10-31', daysSince: 0 }))).toBe('Today');
    expect(lastDoneLabel(status({ lastDone: '2026-10-30', daysSince: 1 }))).toBe('Yesterday');
    expect(lastDoneLabel(status({ lastDone: '2026-10-27', daysSince: 4 }))).toBe('4 days ago');
  });

  it('says what the target is and when it is due', () => {
    const weekly: Todo = { ...EMPTY_RECORDS.todos, repeat_mode: 'rough', repeat_every_days: 7 };
    expect(repeatTargetText(weekly, status({}))).toBe('About a week');
    expect(repeatTargetText(weekly, status({ lastDone: '2026-10-28' }))).toBe(
      'About a week, due Nov 4',
    );
    expect(repeatTargetText({ ...weekly, repeat_every_days: 5 }, status({}))).toBe('About 5 days');
    const schedule: Todo = { ...weekly, repeat_mode: 'schedule' };
    expect(repeatTargetText(schedule, status({ nextDue: '2026-11-02' }))).toBe('Next Mon 2 Nov');
    expect(repeatTargetText(schedule, status({}))).toBe('');
  });

  it('averages the gaps once there are three completions', () => {
    expect(usualGapText(['2026-10-31', '2026-10-24'])).toBe('');
    expect(usualGapText(['2026-10-31', '2026-10-24', '2026-10-15'])).toBe('Usually every 8 days');
  });

  it('sums up the chores for the Lists screen', () => {
    expect(choresSummary(0, 0)).toBe('No chores yet');
    expect(choresSummary(1, 0)).toBe('1 chore');
    expect(choresSummary(3, 1)).toBe('3 chores, 1 overdue');
  });
});
