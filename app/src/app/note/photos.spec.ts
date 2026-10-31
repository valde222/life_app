import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { LocalStore } from '../data/local-store';
import { EMPTY_RECORDS, Note } from '../data/models';
import { Server } from '../server/server';
import { SyncService } from '../sync/sync.service';
import { Photos, THUMB } from './photos';

class FakeServer {
  async fileToken() {
    return 'token';
  }
  photoUrl(note: Note, filename: string, token: string, thumb?: string) {
    return `${note.id}/${filename}?${token}${thumb ? `&${thumb}` : ''}`;
  }
}

describe('Photos', () => {
  let store: LocalStore;
  let photos: Photos;
  let pushes: number;

  beforeEach(async () => {
    pushes = 0;
    URL.createObjectURL = () => 'blob:pending';
    TestBed.configureTestingModule({
      providers: [
        { provide: Server, useClass: FakeServer },
        { provide: SyncService, useValue: { push: () => pushes++ } },
      ],
    });
    store = TestBed.inject(LocalStore);
    await store.open();
    await Promise.all(store.tables.map((table) => table.clear()));
    photos = TestBed.inject(Photos);
  });

  const note: Note = { ...EMPTY_RECORDS.notes, id: 'n1', photos: ['a.jpg'] };

  it('queues added files for upload and pushes', async () => {
    await photos.add('n1', [new File(['x'], 'cat.jpg'), new File(['y'], '')]);

    const pending = await store.pendingPhotos.toArray();
    expect(pending.map((photo) => [photo.note, photo.name]).sort()).toEqual([
      ['n1', 'cat.jpg'],
      ['n1', 'photo.jpg'],
    ]);
    expect(pushes).toBe(1);
  });

  it('shows uploaded photos with token URLs, then photos waiting to upload', async () => {
    await photos.add('n1', [new File(['x'], 'cat.jpg')]);
    const shown = TestBed.runInInjectionContext(() => photos.shown(signal(note)));

    await vi.waitFor(() => expect(shown()).toHaveLength(2));
    expect(shown()[0]).toEqual({
      key: 'a.jpg',
      filename: 'a.jpg',
      thumb: `n1/a.jpg?token&${THUMB}`,
      full: 'n1/a.jpg?token',
    });
    expect(shown()[1]).toMatchObject({ thumb: 'blob:pending', full: 'blob:pending' });
    expect(shown()[1].pendingId).toBeTruthy();
  });

  it('removing a waiting photo just drops it from the queue', async () => {
    await photos.add('n1', [new File(['x'], 'cat.jpg')]);
    const [pending] = await store.pendingPhotos.toArray();

    await photos.remove(note, { key: pending.id, pendingId: pending.id, thumb: '', full: '' });

    expect(await store.pendingPhotos.count()).toBe(0);
    expect(await store.photoRemovals.count()).toBe(0);
  });

  it('removing an uploaded photo hides it at once and queues the removal', async () => {
    await store.records('notes').put(note);

    await photos.remove(note, { key: 'a.jpg', filename: 'a.jpg', thumb: '', full: '' });

    expect((await store.records('notes').get('n1'))?.photos).toEqual([]);
    expect(await store.photoRemovals.toArray()).toMatchObject([{ note: 'n1', filename: 'a.jpg' }]);
    expect(pushes).toBe(1);
  });

  it('shows nothing for a missing note', () => {
    const shown = TestBed.runInInjectionContext(() => photos.shown(signal(undefined)));
    expect(shown()).toEqual([]);
  });
});
