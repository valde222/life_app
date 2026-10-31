import { parseLocalDate } from './local-date';

export function startOf(date: string, time: string): Date {
  const [hours, minutes] = time.split(':').map(Number);
  const start = parseLocalDate(date);
  start.setHours(hours, minutes, 0, 0);
  return start;
}

export function untilText(now: Date, date: string, time: string): string {
  const minutes = Math.max(0, Math.ceil((startOf(date, time).getTime() - now.getTime()) / 60_000));
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) {
    return `in ${rest}m`;
  }
  return rest === 0 ? `in ${hours}h` : `in ${hours}h ${rest}m`;
}
