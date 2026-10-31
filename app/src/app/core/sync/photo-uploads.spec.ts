import { TestBed } from '@angular/core/testing';
import { Photos } from '../data/photos';
import { LocalStore } from '../data/local-store';
import { EMPTY_RECORDS, Note } from '../../domain/models';
import { Server } from '../server/server';
import { Sync } from './sync';
import { drainPhotos, PhotoWriter } from './photo-uploads';

class RecordingWriter implements PhotoWriter {
  uploaded: string[] = [];

  async addPhoto(note: string, _file: Blob, name: string): Promise<Note> {
    this.uploaded.push(name);
    return { ...EMPTY_RECORDS.notes, id: note };
  }

  async removePhoto(note: string): Promise<Note> {
    return { ...EMPTY_RECORDS.notes, id: note };
  }
}

describe('photo uploads', () => {
  it('uploads photos in the order they were added (B3)', async () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: Server, useValue: { fileToken: async () => '' } },
        { provide: Sync, useValue: { push: async () => undefined } },
      ],
    });
    const store = TestBed.inject(LocalStore);
    await store.open();
    await Promise.all(store.tables.map((table) => table.clear()));
    const names = Array.from({ length: 8 }, (_, index) => `photo-${index}.jpg`);
    await TestBed.inject(Photos).add(
      'n1',
      names.map((name) => new File(['x'], name)),
    );

    const writer = new RecordingWriter();
    await drainPhotos(store, writer);

    expect(writer.uploaded).toEqual(names);
  });
});
