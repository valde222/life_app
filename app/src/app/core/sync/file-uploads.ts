import { fieldOf, LocalStore } from '../data/local-store';
import { Note, NoteFileField } from '../../domain/models';
import { applyRemote } from './merge';
import { skipIfRejected } from './outbox';

export interface FileUpload {
  note: string;
  field: NoteFileField;
  file: Blob;
  name: string;
}

export interface FileRemoval {
  note: string;
  field: NoteFileField;
  filename: string;
}

export interface FileWriter {
  addFile(upload: FileUpload): Promise<Note>;
  removeFile(removal: FileRemoval): Promise<Note>;
}

export async function drainFileUploads(store: LocalStore, remote: FileWriter): Promise<void> {
  for (const removal of await store.photoRemovals.toArray()) {
    await send(() => remote.removeFile({ ...removal, field: fieldOf(removal) }), store);
    await store.photoRemovals.delete(removal.id);
  }
  for (const upload of await store.pendingPhotos.orderBy('id').toArray()) {
    if (!(await store.outbox.where('key').equals(`notes/${upload.note}`).count())) {
      await send(() => remote.addFile({ ...upload, field: fieldOf(upload) }), store);
      await store.pendingPhotos.delete(upload.id);
    }
  }
}

async function send(write: () => Promise<Note>, store: LocalStore) {
  try {
    await applyRemote(store, 'notes', [await write()]);
  } catch (error) {
    skipIfRejected(error, 'a file change');
  }
}
