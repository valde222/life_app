import { LocalStore } from '../data/local-store';
import { Note } from '../../domain/models';
import { applyRemote } from './merge';
import { skipIfRejected } from './outbox';

export interface PhotoWriter {
  addPhoto(note: string, file: Blob, name: string): Promise<Note>;
  removePhoto(note: string, filename: string): Promise<Note>;
}

export async function drainPhotos(store: LocalStore, remote: PhotoWriter): Promise<void> {
  for (const removal of await store.photoRemovals.toArray()) {
    await send(() => remote.removePhoto(removal.note, removal.filename), store);
    await store.photoRemovals.delete(removal.id);
  }
  for (const photo of await store.pendingPhotos.orderBy('id').toArray()) {
    if (!(await store.outbox.where('key').equals(`notes/${photo.note}`).count())) {
      await send(() => remote.addPhoto(photo.note, photo.file, photo.name), store);
      await store.pendingPhotos.delete(photo.id);
    }
  }
}

async function send(write: () => Promise<Note>, store: LocalStore) {
  try {
    await applyRemote(store, 'notes', [await write()]);
  } catch (error) {
    skipIfRejected(error, 'a photo change');
  }
}
