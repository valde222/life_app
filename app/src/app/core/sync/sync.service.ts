import { inject, Injectable, signal } from '@angular/core';
import { LocalStore } from '../data/local-store';
import { COLLECTIONS_IN_DEPENDENCY_ORDER, CollectionName } from '../../domain/models';
import { Repository } from '../data/repository';
import { Server, toSendError } from '../server/server';
import { applyRemote } from './merge';
import { drainOutbox, SendError } from './outbox';
import { drainPhotos } from './photo-uploads';
import { logError } from '../logging/log';

const PAGE_SIZE = 500;
const RETRY_MS = 30_000;

@Injectable({ providedIn: 'root' })
export class SyncService {
  private readonly store = inject(LocalStore);
  private readonly server = inject(Server);

  readonly online = signal(navigator.onLine);
  readonly lastSynced = signal<Date | null>(null);
  readonly waiting = inject(Repository).watchOutboxSize();

  private resolveFirstSync!: () => void;
  readonly firstSync = new Promise<void>((resolve) => (this.resolveFirstSync = resolve));

  private started = false;
  private running: Promise<void> | null = null;
  private rerun = false;
  private retryTimer: ReturnType<typeof setTimeout> | undefined;
  private unsubscribers: (() => Promise<void>)[] = [];

  start() {
    if (this.started) {
      return;
    }
    this.started = true;
    window.addEventListener('online', () => this.sync());
    window.addEventListener('offline', () => this.goOffline());
    this.store.outbox.hook('creating', () => {
      setTimeout(() => this.push());
    });
    this.sync().finally(() => this.resolveFirstSync());
  }

  async stop() {
    this.started = false;
    clearTimeout(this.retryTimer);
    await this.unsubscribe();
  }

  sync(): Promise<void> {
    return this.run(async () => {
      await this.server.refreshIfStale();
      await this.pull();
      await this.pruneDeleted();
      await this.subscribe();
      await this.drain();
    });
  }

  push(): Promise<void> {
    if (!this.online()) {
      return Promise.resolve();
    }
    return this.run(() => this.drain());
  }

  private async drain() {
    await drainOutbox(this.store, this.server, (collection, saved) =>
      applyRemote(this.store, collection, [saved]),
    );
    await drainPhotos(this.store, this.server);
  }

  private run(work: () => Promise<void>): Promise<void> {
    if (this.running) {
      this.rerun = true;
      return this.running;
    }
    this.running = (async () => {
      try {
        do {
          this.rerun = false;
          await work();
          this.online.set(true);
          this.lastSynced.set(new Date());
        } while (this.rerun);
      } catch (error) {
        this.handleFailure(error);
      } finally {
        this.running = null;
      }
    })();
    return this.running;
  }

  private handleFailure(error: unknown) {
    const failure = toSendError(error);
    if (failure instanceof SendError && failure.failure === 'unauthorised') {
      this.server.signOut();
      return;
    }
    if (failure instanceof SendError && failure.failure === 'offline') {
      this.goOffline();
      this.retryTimer = setTimeout(() => this.sync(), RETRY_MS);
      return;
    }
    logError('Sync failed', error);
  }

  private goOffline() {
    this.online.set(false);
    this.unsubscribe();
  }

  private async pull() {
    for (const collection of COLLECTIONS_IN_DEPENDENCY_ORDER) {
      await this.pullCollection(collection);
    }
  }

  private async pullCollection(collection: CollectionName) {
    const cursorKey = `cursor:${collection}`;
    const cursor = (await this.store.meta.get(cursorKey))?.value ?? '';
    let latest = cursor;
    for (let number = 1; ; number++) {
      const items = await this.server.changedSince(collection, cursor, { number, size: PAGE_SIZE });
      await applyRemote(this.store, collection, items);
      latest = items.at(-1)?.updated ?? latest;
      if (items.length < PAGE_SIZE) {
        break;
      }
    }
    if (latest !== cursor) {
      await this.store.meta.put({ key: cursorKey, value: latest });
    }
  }

  private async pruneDeleted() {
    for (const collection of COLLECTIONS_IN_DEPENDENCY_ORDER) {
      const table = this.store.records(collection);
      const localDeleted = await table.filter((record) => !!record.deleted_at).primaryKeys();
      if (!localDeleted.length) {
        continue;
      }
      const kept = new Set(await this.server.deletedIds(collection));
      const pending = new Set(
        (await this.store.outbox.filter((entry) => entry.collection === collection).toArray()).map(
          (entry) => entry.id,
        ),
      );
      await table.bulkDelete(localDeleted.filter((id) => !kept.has(id) && !pending.has(id)));
    }
  }

  private async subscribe() {
    if (this.unsubscribers.length) {
      return;
    }
    for (const collection of COLLECTIONS_IN_DEPENDENCY_ORDER) {
      const unsubscribe = await this.server.subscribe(collection, ({ deleted, record }) => {
        if (deleted) {
          this.store.records(collection).delete(record.id);
        } else {
          applyRemote(this.store, collection, [record]);
        }
      });
      this.unsubscribers.push(unsubscribe);
    }
  }

  private async unsubscribe() {
    const unsubscribers = this.unsubscribers;
    this.unsubscribers = [];
    await Promise.allSettled(unsubscribers.map((unsubscribe) => unsubscribe()));
  }
}
