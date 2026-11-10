import { TestBed } from '@angular/core/testing';
import { Photos } from '../data/photos';
import { NoteFiles } from '../data/note-files';
import { LocalStore } from '../data/local-store';
import { EMPTY_RECORDS, Note } from '../../domain/models';
import { MAX_FILE_BYTES } from '../../domain/file-names';
import { Server } from '../server/server';
import { Sync } from './sync';
import { drainFileUploads, FileRemoval, FileUpload, FileWriter } from './file-uploads';

class RecordingWriter implements FileWriter {
  uploaded: string[] = [];
  removed: string[] = [];

  async addFile({ note, field, name }: FileUpload): Promise<Note> {
    this.uploaded.push(`${field}:${name}`);
    return { ...EMPTY_RECORDS.notes, id: note };
  }

  async removeFile({ note, field, filename }: FileRemoval): Promise<Note> {
    this.removed.push(`${field}:${filename}`);
    return { ...EMPTY_RECORDS.notes, id: note };
  }
}

describe('file uploads', () => {
  let store: LocalStore;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: Server, useValue: { fileToken: async () => '' } },
        { provide: Sync, useValue: { push: async () => undefined } },
      ],
    });
    store = TestBed.inject(LocalStore);
    await store.open();
    await Promise.all(store.tables.map((table) => table.clear()));
  });

  it('uploads photos in the order they were added (B3)', async () => {
    const names = Array.from({ length: 8 }, (_, index) => `photo-${index}.jpg`);
    await TestBed.inject(Photos).add(
      'n1',
      names.map((name) => new File(['x'], name)),
    );

    const writer = new RecordingWriter();
    await drainFileUploads(store, writer);

    expect(writer.uploaded).toEqual(names.map((name) => `photos:${name}`));
  });

  it('sends photos and files to their own fields (R31)', async () => {
    await TestBed.inject(Photos).add('n1', [new File(['x'], 'shelf.jpg')]);
    await TestBed.inject(NoteFiles).add('n1', [new File(['x'], 'manual.pdf')]);

    const writer = new RecordingWriter();
    await drainFileUploads(store, writer);

    expect(writer.uploaded).toEqual(['photos:shelf.jpg', 'files:manual.pdf']);
  });

  it('treats uploads and removals queued before files existed as photos', async () => {
    await store.pendingPhotos.add({ id: 'a', note: 'n1', file: new Blob(['x']), name: 'old.jpg' });
    await store.photoRemovals.add({ id: 'b', note: 'n1', filename: 'gone.jpg' });

    const writer = new RecordingWriter();
    await drainFileUploads(store, writer);

    expect(writer.uploaded).toEqual(['photos:old.jpg']);
    expect(writer.removed).toEqual(['photos:gone.jpg']);
  });

  it('leaves files over 50 MB out of the queue and names them (R31)', async () => {
    const big = new File(['x'], 'film.mp4');
    Object.defineProperty(big, 'size', { value: MAX_FILE_BYTES + 1 });

    const refused = await TestBed.inject(NoteFiles).add('n1', [big, new File(['x'], 'ok.txt')]);

    expect(refused.map((file) => file.name)).toEqual(['film.mp4']);
    expect((await store.pendingPhotos.toArray()).map((upload) => upload.name)).toEqual(['ok.txt']);
  });
});
