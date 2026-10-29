import { Injectable, signal } from '@angular/core';
import { GROUP_SUGGESTIONS } from './suggestions';

export interface Choice {
  name: string;
  picked: boolean;
}

@Injectable({ providedIn: 'root' })
export class SetupState {
  readonly groups = signal<Choice[]>(GROUP_SUGGESTIONS.map((choice) => ({ ...choice })));
  readonly lists = signal<Record<string, Choice[]>>({});
}
