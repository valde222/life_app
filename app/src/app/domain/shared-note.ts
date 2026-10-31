import { Draft } from '../core/data/repository';

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

export function sharedNote(share: SharePayload): Draft<'notes'> | null {
  const text = share.text?.trim() ?? '';
  const subject = share.subject?.trim() ?? '';
  const images = share.images?.length ?? 0;
  if (!text && !subject && !images) {
    return null;
  }
  if (subject) {
    return { title: subject, body: text, inbox: true };
  }
  if (!text) {
    return { title: images === 1 ? 'Photo' : `${images} photos`, body: '', inbox: true };
  }
  const [firstLine, ...rest] = text.split('\n');
  if (URL_ONLY.test(text) || firstLine.length <= TITLE_LENGTH) {
    return { title: firstLine, body: rest.join('\n').trim(), inbox: true };
  }
  return { title: `${firstLine.slice(0, TITLE_LENGTH).trimEnd()}…`, body: text, inbox: true };
}
