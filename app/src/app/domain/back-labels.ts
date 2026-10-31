const TODO_BACK_NAMES: Record<string, string> = {
  '/': 'Today',
  '/inbox': 'Inbox',
  '/lists': 'Lists',
  '/agenda': 'Agenda',
};

const NOTE_BACK_NAMES: Record<string, string> = {
  '/': 'Today',
  '/inbox': 'Inbox',
  '/search': 'Search',
};

export function todoBackLabel(path: string): string {
  return TODO_BACK_NAMES[path] ?? 'Back';
}

export function noteBackLabel(path: string, listName: (id: string) => string | undefined): string {
  if (path.startsWith('/lists/')) {
    return listName(path.split('/')[2] ?? '') ?? 'Back';
  }
  return NOTE_BACK_NAMES[path] ?? 'Back';
}
