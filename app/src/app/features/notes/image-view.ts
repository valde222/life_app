import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ShownPhoto } from '../../core/data/photos';
import { logError } from '../../core/logging/log';

export interface ImageViewData {
  photos: ShownPhoto[];
  index: number;
}

@Component({
  selector: 'app-image-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(keydown.arrowLeft)': 'step(-1)', '(keydown.arrowRight)': 'step(1)' },
  template: `
    <header class="bar">
      <button type="button" (click)="ref.close()">Close</button>
      <span class="count tabular">{{ index() + 1 }} of {{ data.photos.length }}</span>
      @if (canShare) {
        <button type="button" (click)="share()">Share</button>
      } @else {
        <span></span>
      }
    </header>
    <div class="stage" (pointerdown)="start($event)" (pointerup)="end($event)">
      <img [src]="photo().full" alt="Photo {{ index() + 1 }} of {{ data.photos.length }}" />
    </div>
    <footer class="foot">
      <button type="button" class="delete" (click)="ref.close('delete:' + index())">Delete</button>
    </footer>
  `,
  styles: `
    :host {
      height: 100dvh;
      display: flex;
      flex-direction: column;
      background: var(--viewer-bg);
      color: var(--on-accent);
    }
    .bar {
      padding: calc(44px + env(safe-area-inset-top)) var(--space-2) 0;
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      align-items: center;
    }
    .bar button {
      height: 44px;
      padding: 0 var(--space-3);
      border: 0;
      background: transparent;
      color: var(--on-accent);
      font-size: var(--text-15);
      font-weight: 600;
    }
    .bar button:last-child {
      justify-self: end;
    }
    .count {
      font-size: var(--text-13);
      color: var(--viewer-text);
    }
    .stage {
      flex: 1;
      min-height: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      touch-action: pan-y;
    }
    img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    }
    .foot {
      padding: var(--space-4) var(--space-4) calc(32px + env(safe-area-inset-bottom));
      display: flex;
      justify-content: flex-end;
    }
    .delete {
      height: 44px;
      border: 0;
      background: transparent;
      color: var(--viewer-danger);
      font-size: var(--text-15);
      font-weight: 600;
    }
  `,
})
export class ImageView {
  protected readonly ref = inject(DialogRef<string>);
  protected readonly data = inject<ImageViewData>(DIALOG_DATA);
  protected readonly index = signal(this.data.index);
  protected readonly photo = computed(() => this.data.photos[this.index()]);
  protected readonly canShare = typeof navigator.share === 'function';
  private startX = 0;

  protected step(by: number) {
    const count = this.data.photos.length;
    this.index.set((this.index() + by + count) % count);
  }

  protected start(event: PointerEvent) {
    this.startX = event.clientX;
  }

  protected end(event: PointerEvent) {
    const dx = event.clientX - this.startX;
    if (Math.abs(dx) > 50) {
      this.step(dx < 0 ? 1 : -1);
    }
  }

  protected async share() {
    try {
      const blob = await (await fetch(this.photo().full)).blob();
      await navigator.share({ files: [new File([blob], 'photo.jpg', { type: blob.type })] });
    } catch (error) {
      if (!(error instanceof DOMException && error.name === 'AbortError')) {
        logError('Sharing a photo failed', error);
      }
    }
  }
}
