import { Signal } from '@angular/core';

export abstract class Sync {
  abstract readonly online: Signal<boolean>;
  abstract readonly lastSynced: Signal<Date | null>;
  abstract readonly waiting: Signal<number>;
  abstract readonly firstSync: Promise<void>;
  abstract start(): void;
  abstract stop(): Promise<void>;
  abstract sync(): Promise<void>;
  abstract push(): Promise<void>;
}
