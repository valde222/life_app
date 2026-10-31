import { Provider } from '@angular/core';
import { LocalFirstRepository } from './data/local-first-repository';
import { Repository } from './data/repository';
import { PocketBaseSync } from './sync/pocketbase-sync';
import { Sync } from './sync/sync';

export function provideCore(): Provider[] {
  return [
    { provide: Repository, useExisting: LocalFirstRepository },
    { provide: Sync, useExisting: PocketBaseSync },
  ];
}
