import 'fake-indexeddb/auto';
import { TestBed } from '@angular/core/testing';

beforeEach(async () => {
  // Loaded only now: the test bundle hoists static imports above fake-indexeddb, and Dexie looks for IndexedDB as it loads.
  const { provideCore } = await import('./app/core/provide-core');
  TestBed.configureTestingModule({ providers: provideCore() });
});
