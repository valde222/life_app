import { localDate } from './local-date';

export function pocketBaseTimestamp(date = new Date()): string {
  return date.toISOString().replace('T', ' ');
}

export function parseTimestamp(value: string): Date {
  return new Date(value.replace(' ', 'T'));
}

export function dayOfTimestamp(value: string): string {
  return localDate(parseTimestamp(value));
}
