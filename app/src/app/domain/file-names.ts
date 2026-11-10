export const MAX_FILE_BYTES = 50 * 1024 * 1024;

const POCKETBASE_SUFFIX = /^(.+)_[a-z0-9]{10}(\.[^.]+)?$/;

export function displayName(stored: string): string {
  const match = POCKETBASE_SUFFIX.exec(stored);
  return match ? `${match[1]}${match[2] ?? ''}` : stored;
}

export function tooBig(size: number): boolean {
  return size > MAX_FILE_BYTES;
}
