export interface SyncedRecord {
  id: string;
  changed_at: number;
  deleted_at: string;
  created?: string;
  updated?: string;
}

export interface Group extends SyncedRecord {
  name: string;
  order: number;
}

export type ListColour = 'blue' | 'purple' | 'teal' | 'green' | 'orange' | 'pink' | 'grey';

export interface List extends SyncedRecord {
  name: string;
  group: string;
  colour: ListColour;
  order: number;
  archived_at: string;
}

export type RepeatMode = 'none' | 'rough' | 'schedule';

export interface Todo extends SyncedRecord {
  title: string;
  list: string;
  inbox: boolean;
  date: string;
  time: string;
  time_end: string;
  is_event: boolean;
  repeat_mode: RepeatMode;
  repeat_every_days: number;
  repeat_every_weeks: number;
  repeat_weekdays: number[] | null;
  reminder: string;
  done_at: string;
  archived_at: string;
}

export interface Step extends SyncedRecord {
  todo: string;
  text: string;
  done: boolean;
  order: number;
}

export interface Completion extends SyncedRecord {
  todo: string;
  done_on: string;
}

export interface Note extends SyncedRecord {
  title: string;
  body: string;
  list: string;
  inbox: boolean;
  photos: string[];
  todos: string[];
  archived_at: string;
}

export interface CalendarEvent extends SyncedRecord {
  calendar: string;
  external_id: string;
  title: string;
  start: string;
  end: string;
  all_day: boolean;
  synced_at: string;
}

export interface Settings extends SyncedRecord {
  calendars: string[] | null;
}

export interface Collections {
  groups: Group;
  lists: List;
  todos: Todo;
  steps: Step;
  completions: Completion;
  notes: Note;
  calendar_events: CalendarEvent;
  settings: Settings;
}

export type CollectionName = keyof Collections;

export const COLLECTIONS_IN_DEPENDENCY_ORDER: readonly CollectionName[] = [
  'groups',
  'lists',
  'todos',
  'steps',
  'completions',
  'notes',
  'calendar_events',
  'settings',
];

const synced = { id: '', changed_at: 0, deleted_at: '' };

export const EMPTY_RECORDS: { [C in CollectionName]: Collections[C] } = {
  groups: { ...synced, name: '', order: 0 },
  lists: { ...synced, name: '', group: '', colour: 'grey', order: 0, archived_at: '' },
  todos: {
    ...synced,
    title: '',
    list: '',
    inbox: false,
    date: '',
    time: '',
    time_end: '',
    is_event: false,
    repeat_mode: 'none',
    repeat_every_days: 0,
    repeat_every_weeks: 0,
    repeat_weekdays: null,
    reminder: '',
    done_at: '',
    archived_at: '',
  },
  steps: { ...synced, todo: '', text: '', done: false, order: 0 },
  completions: { ...synced, todo: '', done_on: '' },
  notes: {
    ...synced,
    title: '',
    body: '',
    list: '',
    inbox: false,
    photos: [],
    todos: [],
    archived_at: '',
  },
  calendar_events: {
    ...synced,
    calendar: '',
    external_id: '',
    title: '',
    start: '',
    end: '',
    all_day: false,
    synced_at: '',
  },
  settings: { ...synced, calendars: [] },
};
