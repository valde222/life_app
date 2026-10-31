import { inject, Injectable } from '@angular/core';
import { ClientResponseError } from 'pocketbase';
import { LocalStore } from '../data/local-store';
import { Server } from '../server/server';
import { SyncService } from '../sync/sync.service';

export type SignInFailure = 'unreachable' | 'throttled' | 'refused';

export class SignInError extends Error {
  constructor(readonly failure: SignInFailure) {
    super(failure);
  }
}

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
    try {
      await this.server.signIn(email, password);
    } catch (error) {
      throw new SignInError(signInFailure(error));
    }
    await this.store.adopt(`${this.server.url()}#${this.server.account()?.id}`);
  }

  async signOut(): Promise<void> {
    await this.sync.stop();
    this.server.signOut();
    await this.store.delete();
  }
}

function signInFailure(error: unknown): SignInFailure {
  const status = error instanceof ClientResponseError ? error.status : undefined;
  if (status === 0) {
    return 'unreachable';
  }
  return status === 429 ? 'throttled' : 'refused';
}
