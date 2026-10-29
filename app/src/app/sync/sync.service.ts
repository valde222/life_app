import { inject, Injectable, signal } from '@angular/core';
import { LocalStore } from '../data/local-store';
import { COLLECTIONS_IN_DEPENDENCY_ORDER, CollectionName, Collections } from '../data/models';
import { Repository } from '../data/repository';
import { Server, toSendError } from '../server/server';
import { applyRemote } from './merge';
import { drainOutbox, SendError } from './outbox';

const PAGE_SIZE = 500;
const RETRY_MS = 30_000;

@Injectable({ providedIn: 'root' })
export class SyncService {
  private readonly store = inject(LocalStore);
  private readonly server = inject(Server);

  readonly online = signal(navigator.onLine);
  readonly waiting = inject(Repository).watchOutboxSize();

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
    this.sync();
  }

  async stop() {
    this.started = false;
    clearTimeout(this.retryTimer);
    await this.unsubscribe();
  }

  sync(): Promise<void> {
    return this.run(async () => {
      await this.pull();
      await this.subscribe();
      await drainOutbox(this.store, this.server, (collection, saved) =>
        applyRemote(this.store, collection, [saved]),
      );
    });
  }

  push(): Promise<void> {
    if (!this.online()) {
      return Promise.resolve();
    }
    return this.run(() =>
      drainOutbox(this.store, this.server, (collection, saved) =>
        applyRemote(this.store, collection, [saved]),
      ),
    );
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
    console.error('Sync failed', error);
  }

  private goOffline() {
    this.online.set(false);
    this.unsubscribe();
  }

  private async pull() {
    for (const collection of COLLECTIONS_IN_DEPENDENCY_ORDER) {
      const cursorKey = `cursor:${collection}`;
      const cursor = (await this.store.meta.get(cursorKey))?.value ?? '';
      let latest = cursor;
      for (let page = 1; ; page++) {
        const result = await this.server.pb
          .collection(collection)
          .getList<Collections[CollectionName]>(page, PAGE_SIZE, {
            filter: cursor ? this.server.pb.filter('updated >= {:cursor}', { cursor }) : '',
            sort: 'updated',
            skipTotal: true,
            requestKey: null,
          });
        await applyRemote(this.store, collection, result.items);
        latest = result.items.at(-1)?.updated ?? latest;
        if (result.items.length < PAGE_SIZE) {
          break;
        }
      }
      if (latest !== cursor) {
        await this.store.meta.put({ key: cursorKey, value: latest });
      }
    }
  }

  private async subscribe() {
    if (this.unsubscribers.length) {
      return;
    }
    for (const collection of COLLECTIONS_IN_DEPENDENCY_ORDER) {
      const unsubscribe = await this.server.pb
        .collection(collection)
        .subscribe<Collections[CollectionName]>('*', ({ action, record }) => {
          if (action === 'delete') {
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
