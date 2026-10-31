import { DialogRef } from '@angular/cdk/dialog';
import { motionMs } from './motion';

const DISMISS_FRACTION = 0.25;
const DESKTOP = '(min-width: 900px)';

export function closeWithMotion<R, C>(ref: DialogRef<R, C>): void {
  const close = ref.close.bind(ref);
  let closing = false;
  ref.close = (result, options) => {
    const duration = motionMs('fast');
    if (closing) {
      return;
    }
    if (!duration) {
      close(result, options);
      return;
    }
    closing = true;
    ref.overlayRef.addPanelClass('sheet-closing');
    ref.overlayRef.backdropElement?.classList.add('sheet-backdrop-closing');
    setTimeout(() => {
      close(result, options);
    }, duration);
  };
}

export class SheetDrag {
  private start: { y: number; id: number } | null = null;
  private offset = 0;

  constructor(
    private readonly panel: HTMLElement,
    private readonly dismiss: () => void,
  ) {
    panel.addEventListener('pointerdown', (event) => {
      this.down(event);
    });
    panel.addEventListener('pointermove', (event) => {
      this.move(event);
    });
    panel.addEventListener('pointerup', () => {
      this.release();
    });
    panel.addEventListener('pointercancel', () => {
      this.snapBack();
    });
  }

  private down(event: PointerEvent) {
    const grab = (event.target as HTMLElement).closest('.handle');
    if (!grab || matchMedia(DESKTOP).matches) {
      return;
    }
    this.start = { y: event.clientY, id: event.pointerId };
    this.offset = 0;
    this.panel.setPointerCapture(event.pointerId);
    this.panel.classList.add('sheet-dragging');
  }

  private move(event: PointerEvent) {
    if (this.start?.id !== event.pointerId) {
      return;
    }
    this.offset = Math.max(0, event.clientY - this.start.y);
    this.panel.style.transform = `translateY(${this.offset}px)`;
  }

  private release() {
    if (!this.start) {
      return;
    }
    this.start = null;
    this.panel.classList.remove('sheet-dragging');
    if (this.offset > this.panel.offsetHeight * DISMISS_FRACTION) {
      this.dismiss();
      return;
    }
    this.snapBack();
  }

  private snapBack() {
    this.start = null;
    this.panel.classList.remove('sheet-dragging');
    this.panel.style.transform = '';
  }
}
