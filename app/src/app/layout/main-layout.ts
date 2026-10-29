import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { CaptureSheet } from '../capture/capture-sheet';
import { EventPage } from '../calendar/event-page';
import { NoteEditor } from '../note/note-editor';
import { TodoEditor } from '../todo/todo-editor';
import { BottomNav } from '../ui/bottom-nav';
import { Icon } from '../ui/icon';
import { Sheets } from '../ui/sheet';
import { isTyping } from '../ui/keyboard';
import { Toast } from '../ui/toast';
import { DetailPane, detailFromPath } from './detail-pane';
import { ShortcutsOverlay } from './shortcuts-overlay';
import { Sidebar } from './sidebar';
import { Viewport } from './viewport';

const NO_SEARCH_BAR = /^\/(search|archive)/;
const FULL_SCREEN = /^\/(todo|note|event|repeat|settings|lists\/edit|lists\/[^/]+\/settings)/;

@Component({
  selector: 'app-main-layout',
  imports: [BottomNav, EventPage, Icon, NoteEditor, RouterOutlet, Sidebar, TodoEditor, Toast],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.desktop]': 'viewport.desktop()',
    '(document:keydown)': 'onKey($event)',
  },
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.scss',
})
export class MainLayout {
  private readonly sheets = inject(Sheets);
  private readonly router = inject(Router);
  protected readonly viewport = inject(Viewport);
  protected readonly pane = inject(DetailPane);

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => this.router.url),
    ),
    { initialValue: this.router.url },
  );
  protected readonly showSearch = computed(() => !NO_SEARCH_BAR.test(this.url()));
  protected readonly showNav = computed(() => !FULL_SCREEN.test(this.url()));

  constructor() {
    const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const listener = (event: MouseEvent) => this.openInPane(event);
    host.addEventListener('click', listener, { capture: true });
    inject(DestroyRef).onDestroy(() =>
      host.removeEventListener('click', listener, { capture: true }),
    );
  }

  capture() {
    if (!this.sheets.isOpen(CaptureSheet)) {
      this.sheets.open(CaptureSheet, {}, { autoFocus: '.what' });
    }
  }

  protected shortcuts() {
    this.sheets.open(ShortcutsOverlay, undefined, { panelClass: 'dialog-panel' });
  }

  protected openInPane(event: MouseEvent) {
    if (
      !this.viewport.desktop() ||
      event.defaultPrevented ||
      event.button !== 0 ||
      event.ctrlKey ||
      event.metaKey
    ) {
      return;
    }
    const link = (event.target as HTMLElement).closest('a[href]') as HTMLAnchorElement | null;
    if (!link || link.closest('.pane')) {
      return;
    }
    const detail = detailFromPath(new URL(link.href).pathname);
    if (detail) {
      event.preventDefault();
      event.stopPropagation();
      this.pane.open(detail);
    }
  }

  protected onKey(event: KeyboardEvent) {
    if (event.ctrlKey && event.code === 'Space') {
      event.preventDefault();
      this.capture();
    } else if (event.ctrlKey && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      this.router.navigateByUrl('/search');
    } else if (event.key === '?' && !isTyping(event.target) && !this.sheets.anyOpen()) {
      this.shortcuts();
    } else if (event.key === 'Escape' && this.pane.current() && !this.sheets.anyOpen()) {
      this.pane.close();
    }
  }
}
