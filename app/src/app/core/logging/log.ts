export interface LoggedError {
  at: string;
  context: string;
  message: string;
}

const STORAGE_KEY = 'life:errors';
const KEEP = 100;

export function logError(context: string, error: unknown): void {
  console.error(context, error);
  const entry = { at: new Date().toISOString(), context, message: errorText(error) };
  save([entry, ...loggedErrors()].slice(0, KEEP));
}

export function loggedErrors(): LoggedError[] {
  try {
    const stored: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    return Array.isArray(stored) ? (stored as LoggedError[]) : [];
  } catch {
    return [];
  }
}

export function clearLoggedErrors(): void {
  save([]);
}

export function errorText(error: unknown): string {
  if (!(error instanceof Error)) {
    return String(error);
  }
  const response =
    'response' in error && error.response ? ` ${JSON.stringify(error.response)}` : '';
  const own = `${error.name}: ${error.message}${response}`;
  return error.cause === undefined ? own : `${own} ← ${errorText(error.cause)}`;
}

function save(entries: LoggedError[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    return;
  }
}
