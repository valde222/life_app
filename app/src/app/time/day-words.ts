import { addDays, nextWeekday } from './local-date';

const WEEKDAY_WORDS: Record<string, number> = {
  sun: 0,
  sunday: 0,
  mon: 1,
  monday: 1,
  tue: 2,
  tues: 2,
  tuesday: 2,
  wed: 3,
  wednesday: 3,
  thu: 4,
  thur: 4,
  thurs: 4,
  thursday: 4,
  fri: 5,
  friday: 5,
  sat: 6,
  saturday: 6,
};

export interface ParsedTitle {
  title: string;
  date: string;
}

export function parseDayWord(text: string, today: string): ParsedTitle | null {
  const match = /^(.*?\S)\s+(next week|this weekend|[a-z]+)\s*$/i.exec(text);
  if (!match) {
    return null;
  }
  const date = dateForWord(match[2].toLowerCase(), today);
  return date ? { title: match[1], date } : null;
}

function dateForWord(word: string, today: string): string | null {
  switch (word) {
    case 'today':
      return today;
    case 'tomorrow':
    case 'tmrw':
      return addDays(today, 1);
    case 'next week':
      return nextWeekday(today, 1);
    case 'this weekend':
      return nextWeekday(today, 6, false);
  }
  return word in WEEKDAY_WORDS ? nextWeekday(today, WEEKDAY_WORDS[word]) : null;
}
