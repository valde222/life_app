export function readPreference(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writePreference(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Storage can be refused (private browsing, full quota); the preference then lasts until reload.
  }
}

export function readJsonPreference<T>(key: string, fallback: T): T {
  try {
    const stored = readPreference(key);
    return stored === null ? fallback : (JSON.parse(stored) as T);
  } catch {
    return fallback;
  }
}

export function writeJsonPreference(key: string, value: unknown): void {
  writePreference(key, JSON.stringify(value));
}
