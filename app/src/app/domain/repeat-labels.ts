import { Todo } from './models';
import { RepeatStatus, ROUGH_CHOICES } from './repeat-status';
import { addDays, daysBetween, longDate, shortDate } from './time/local-date';

export function lastDoneLabel(status: RepeatStatus): string {
  if (!status.lastDone) {
    return 'Never';
  }
  if (status.daysSince === 0) {
    return 'Today';
  }
  return status.daysSince === 1 ? 'Yesterday' : `${status.daysSince} days ago`;
}

export function repeatTargetText(todo: Todo, status: RepeatStatus): string {
  if (todo.repeat_mode === 'schedule') {
    return status.nextDue ? `Next ${longDate(status.nextDue)}` : '';
  }
  const unit =
    ROUGH_CHOICES.find((choice) => choice.days === todo.repeat_every_days)?.unit ??
    `${todo.repeat_every_days} days`;
  const due = status.lastDone ? addDays(status.lastDone, todo.repeat_every_days) : '';
  return due ? `About ${unit}, due ${shortDate(due)}` : `About ${unit}`;
}

export function usualGapText(daysDone: readonly string[]): string {
  if (daysDone.length < 3) {
    return '';
  }
  const gaps = daysDone
    .slice(1)
    .map((earlier, index) => daysBetween(earlier, daysDone[index] ?? earlier));
  return `Usually every ${Math.round(gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length)} days`;
}

export function choresSummary(chores: number, overdue: number): string {
  if (!chores) {
    return 'No chores yet';
  }
  const count = `${chores} chore${chores === 1 ? '' : 's'}`;
  return overdue ? `${count}, ${overdue} overdue` : count;
}
