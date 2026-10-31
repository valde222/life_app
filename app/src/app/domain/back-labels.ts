const BACK_NAMES: Record<string, string> = {
  '/': 'Today',
  '/inbox': 'Inbox',
  '/lists': 'Lists',
  '/agenda': 'Agenda',
  '/search': 'Search',
};

export function backLabel(path: string, listName: (id: string) => string | undefined): string {
  if (path.startsWith('/lists/')) {
    return listName(path.split('/')[2] ?? '') ?? 'Back';
  }
  return BACK_NAMES[path] ?? 'Back';
}
