import { newId, orderedId } from '../../domain/ids';
import { Note, NoteFileField } from '../../domain/models';
import { LocalStore } from './local-store';

export interface QueueTarget {
  note: string;
  field: NoteFileField;
  fallbackName: string;
}

let queued = 0;

export async function queueUploads(store: LocalStore, target: QueueTarget, files: Iterable<File>) {
  for (const file of files) {
    await store.pendingPhotos.add({
      id: orderedId(Date.now(), queued++),
      note: target.note,
      field: target.field,
      file,
      name: file.name || target.fallbackName,
    });
  }
}

export async function queueRemoval(
  store: LocalStore,
  note: Note,
  removed: { field: NoteFileField; filename: string },
) {
  const remaining = (note[removed.field] ?? []).filter((name) => name !== removed.filename);
  await store
    .records('notes')
    .update(note.id, removed.field === 'photos' ? { photos: remaining } : { files: remaining });
  await store.photoRemovals.add({ id: newId(), note: note.id, ...removed });
}
