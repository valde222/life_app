import { inject, Signal } from '@angular/core';
import { Photos } from '../../core/data/photos';
import { Note } from '../../domain/models';
import { Sheets } from '../../shared/ui/sheet';
import { ImagePicker } from './image-picker';
import { ImageView, ImageViewData } from './image-view';

export class NotePhotos {
  private readonly photos = inject(Photos);
  private readonly sheets = inject(Sheets);

  readonly shown;

  constructor(
    private readonly note: Signal<Note | undefined>,
    private readonly noteId: Signal<string>,
  ) {
    this.shown = this.photos.shown(note);
  }

  async add() {
    const files = await this.sheets.open<File[]>(ImagePicker).closed;
    if (files?.length) {
      await this.photos.add(this.noteId(), files);
    }
  }

  async open(index: number) {
    const result = await this.sheets.openFull<string, ImageViewData>(ImageView, {
      photos: this.shown(),
      index,
    }).closed;
    const note = this.note();
    const photo = result?.startsWith('delete:') ? this.shown()[Number(result.slice(7))] : undefined;
    if (note && photo) {
      await this.photos.remove(note, photo);
    }
  }

  async discardPending(draft: Note) {
    for (const photo of this.shown().filter((each) => each.pendingId)) {
      await this.photos.remove(draft, photo);
    }
  }
}
