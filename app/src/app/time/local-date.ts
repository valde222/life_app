const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function localDate(date = new Date()): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export function parseLocalDate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function addDays(value: string, days: number): string {
  const date = parseLocalDate(value);
  date.setDate(date.getDate() + days);
  return localDate(date);
}

export function weekday(value: string): number {
  return parseLocalDate(value).getDay();
}

export function daysBetween(from: string, to: string): number {
  return Math.round((parseLocalDate(to).getTime() - parseLocalDate(from).getTime()) / 86_400_000);
}

export function longDate(value: string): string {
  const date = parseLocalDate(value);
  return `${WEEKDAYS[date.getDay()]} ${date.getDate()} ${MONTHS[date.getMonth()]}`;
}

export function shortDate(value: string): string {
  const date = parseLocalDate(value);
  return `${MONTHS[date.getMonth()]} ${date.getDate()}`;
}

export function weekdayName(value: string): string {
  return WEEKDAYS[weekday(value)];
}

export function monthName(month: number, style: 'short' | 'long' = 'short'): string {
  return style === 'short'
    ? MONTHS[month]
    : new Date(2000, month, 1).toLocaleString('en-GB', { month: 'long' });
}

export function relativeDay(value: string, today: string): string {
  const offset = daysBetween(today, value);
  if (offset === 0) {
    return 'Today';
  }
  if (offset === 1) {
    return 'Tomorrow';
  }
  if (offset === -1) {
    return 'Yesterday';
  }
  return longDate(value);
}

export function nextWeekday(today: string, target: number, skipToday = true): string {
  const ahead = (target - weekday(today) + 7) % 7 || (skipToday ? 7 : 0);
  return addDays(today, ahead);
}
