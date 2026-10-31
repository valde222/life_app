import { inject, Injectable } from '@angular/core';
import { LocalStore } from '../data/local-store';
import { Server } from '../server/server';
import { SyncService } from '../sync/sync.service';

@Injectable({ providedIn: 'root' })
export class Session {
  private readonly server = inject(Server);
  private readonly store = inject(LocalStore);
  private readonly sync = inject(SyncService);

  readonly signedIn = this.server.signedIn;
  readonly serverUrl = this.server.url;

  email(): string {
    return this.server.account()?.email ?? '';
  }

  async signIn(serverUrl: string, email: string, password: string): Promise<void> {
    this.server.setUrl(serverUrl);
    await this.server.signIn(email, password);
    await this.store.adopt(`${this.server.url()}#${this.server.account()?.id}`);
  }

  async signOut(): Promise<void> {
    await this.sync.stop();
    this.server.signOut();
    await this.store.delete();
  }
}
