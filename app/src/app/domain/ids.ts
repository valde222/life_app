const ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';
const ID_LENGTH = 15;

export function newId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(ID_LENGTH));
  return Array.from(bytes, (byte) => ALPHABET[byte % ALPHABET.length]).join('');
}

export function orderedId(time: number, sequence: number): string {
  const sortable = time.toString(36).padStart(10, '0') + sequence.toString(36).padStart(6, '0');
  return sortable + newId();
}
