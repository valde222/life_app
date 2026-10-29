import { Injectable, signal } from '@angular/core';

export type DetailKind = 'todo' | 'note' | 'event';

export interface Detail {
  kind: DetailKind;
  id: string;
}

const DETAIL_PATH = /^\/(todo|note|event)\/([a-z0-9]+)$/;

export function detailFromPath(path: string): Detail | null {
  const match = DETAIL_PATH.exec(path);
  return match && match[2] !== 'new' ? { kind: match[1] as DetailKind, id: match[2] } : null;
}

@Injectable({ providedIn: 'root' })
export class DetailPane {
  readonly current = signal<Detail | null>(null);

  open(detail: Detail) {
    this.current.set(detail);
  }

  close() {
    this.current.set(null);
  }
}
