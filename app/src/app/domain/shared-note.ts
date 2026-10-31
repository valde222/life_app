import { Draft } from './models';

export interface SharedImage {
  mimeType: string;
  base64: string;
}

export interface SharePayload {
  text?: string | null;
  subject?: string | null;
  images?: SharedImage[];
}

const URL_ONLY = /^https?:\/\/\S+$/i;
const TITLE_LENGTH = 80;

function trimmed(value: string | null | undefined): string {
  return value?.trim() ?? '';
}

function photosTitle(count: number): string {
  return count === 1 ? 'Photo' : `${count} photos`;
}

function textNote(text: string): Draft<'notes'> {
  const [firstLine = '', ...rest] = text.split('\n');
  if (URL_ONLY.test(text) || firstLine.length <= TITLE_LENGTH) {
    return { title: firstLine, body: rest.join('\n').trim(), inbox: true };
  }
  return { title: `${firstLine.slice(0, TITLE_LENGTH).trimEnd()}…`, body: text, inbox: true };
}

export function sharedNote(share: SharePayload): Draft<'notes'> | null {
  const text = trimmed(share.text);
  const subject = trimmed(share.subject);
  const images = share.images?.length ?? 0;
  if (subject) {
    return { title: subject, body: text, inbox: true };
  }
  if (text) {
    return textNote(text);
  }
  return images ? { title: photosTitle(images), body: '', inbox: true } : null;
}
