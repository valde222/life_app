import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { HapticTicks } from '../../core/platform/haptics';
import { Icon, IconName } from './icon';

export interface SwipeAction {
  label?: string;
  icon: IconName;
  quiet?: boolean;
}

export const SWIPE_THRESHOLD = 80;
const DRAG_START = 8;

export function swipeOutcome(offset: number): 'right' | 'left' | null {
  if (offset >= SWIPE_THRESHOLD) {
    return 'right';
  }
  return offset <= -SWIPE_THRESHOLD ? 'left' : null;
}

@Component({
  selector: 'app-swipe-row',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (offset() > 0 && right(); as action) {
      <div
        class="action right"
        [class.quiet]="action.quiet"
        [class.armed]="armed()"
        [style.opacity]="reveal()"
      >
        <app-icon [name]="action.icon" [size]="16" [stroke]="2.4" />{{ action.label }}
      </div>
    }
    @if (offset() < 0 && left(); as action) {
      <div
        class="action left"
        [class.quiet]="action.quiet"
        [class.armed]="armed()"
        [style.opacity]="reveal()"
      >
        <app-icon [name]="action.icon" [size]="16" [stroke]="2.4" />{{ action.label }}
      </div>
    }
    <div
      class="content"
      [style.transform]="'translateX(' + offset() + 'px)'"
      [class.settling]="!dragging()"
      (pointerdown)="start($event)"
      (pointermove)="move($event)"
      (pointerup)="end()"
      (pointercancel)="cancel()"
      (click.capture)="swallowClickAfterDrag($event)"
    >
      <ng-content />
    </div>
  `,
  styles: `
    :host {
      position: relative;
      display: block;
      border-radius: var(--radius-row);
      overflow: hidden;
    }
    .content {
      position: relative;
      touch-action: pan-y;
      user-select: none;
    }
    .settling {
      transition: transform var(--motion-base) var(--ease-standard);
    }
    .action {
      position: absolute;
      inset: 0;
      padding: 0 var(--space-6);
      background: var(--accent);
      color: var(--on-accent);
      display: flex;
      align-items: center;
      gap: var(--space-2);
      font-size: var(--text-15);
      font-weight: 700;
    }
    .action app-icon {
      transition: transform var(--motion-fast) var(--ease-standard);
    }
    .action.armed app-icon {
      transform: scale(1.2);
    }
    .action.left {
      justify-content: flex-end;
    }
    .action.quiet {
      background: var(--muted);
    }
  `,
})
export class SwipeRow {
  readonly right = input<SwipeAction | null>(null);
  readonly left = input<SwipeAction | null>(null);
  readonly swipedRight = output();
  readonly swipedLeft = output();

  protected readonly offset = signal(0);
  protected readonly dragging = signal(false);
  protected readonly armed = computed(() => swipeOutcome(this.offset()) !== null);
  protected readonly reveal = computed(() =>
    Math.min(1, Math.abs(this.offset()) / SWIPE_THRESHOLD),
  );
  private readonly haptics = inject(HapticTicks);
  private origin: { x: number; y: number; id: number } | null = null;
  private moved = false;
  private readonly limits = computed(() => ({
    max: this.right() ? 160 : 0,
    min: this.left() ? -160 : 0,
  }));

  protected start(event: PointerEvent) {
    this.origin = { x: event.clientX, y: event.clientY, id: event.pointerId };
    this.moved = false;
  }

  protected move(event: PointerEvent) {
    if (this.origin?.id !== event.pointerId) {
      return;
    }
    const dx = event.clientX - this.origin.x;
    if (!this.dragging()) {
      if (Math.abs(dx) < DRAG_START || Math.abs(event.clientY - this.origin.y) > Math.abs(dx)) {
        return;
      }
      this.dragging.set(true);
      this.moved = true;
      (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    }
    const { min, max } = this.limits();
    const wasArmed = this.armed();
    this.offset.set(Math.min(max, Math.max(min, dx)));
    if (this.armed() && !wasArmed) {
      this.haptics.tick();
    }
  }

  protected end() {
    const outcome = swipeOutcome(this.offset());
    this.cancel();
    if (outcome === 'right') {
      this.swipedRight.emit();
    } else if (outcome === 'left') {
      this.swipedLeft.emit();
    }
  }

  protected cancel() {
    this.origin = null;
    this.dragging.set(false);
    this.offset.set(0);
  }

  protected swallowClickAfterDrag(event: Event) {
    if (this.moved) {
      event.stopPropagation();
      event.preventDefault();
      this.moved = false;
    }
  }
}
