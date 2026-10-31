import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

const ICONS = {
  archive: '<rect x="3" y="4" width="18" height="5" rx="1.5"/><path d="M5 9v10h14V9M10 13h4"/>',
  calendar: '<rect x="4" y="5" width="16" height="15" rx="3"/><path d="M4 10h16M9 3v4M15 3v4"/>',
  'calendar-chip': '<rect x="4" y="5" width="16" height="15" rx="3"/><path d="M4 10h16"/>',
  camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
  check: '<path d="M5 12l4 4 10-10"/>',
  'check-picked': '<path d="M5 12l5 5 9-10"/>',
  'chevron-down': '<path d="M6 9l6 6 6-6"/>',
  'chevron-left': '<path d="M15 6l-6 6 6 6"/>',
  'chevron-right': '<path d="M9 6l6 6-6 6"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  code: '<path d="M8 7l-5 5 5 5M16 7l5 5-5 5"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/>',
  folder: '<path d="M3 7h6l2 2h10v10H3z"/>',
  image:
    '<rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="2"/><path d="M21 17l-5-5-9 8"/>',
  inbox:
    '<path d="M4 13l2.5-7h11L20 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><path d="M4 13h5l1 2h4l1-2h5"/>',
  lists:
    '<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1"/><circle cx="4.5" cy="12" r="1"/><circle cx="4.5" cy="18" r="1"/>',
  more: '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
  note: '<rect x="5" y="3" width="14" height="18" rx="3"/><path d="M9 8h6M9 12h6"/>',
  offline:
    '<path d="M3 3l18 18"/><path d="M7 18h10a4 4 0 0 0 1.5-7.7A6 6 0 0 0 8.4 7.6"/><path d="M5.2 9.6A4.5 4.5 0 0 0 7 18"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  'plus-small': '<path d="M12 6v12M6 12h12"/>',
  repeat: '<path d="M20 12a8 8 0 1 1-2.3-5.7"/><path d="M20 4v5h-5"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
  settings:
    '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
} as const;

export type IconName = keyof typeof ICONS;

@Component({
  selector: 'app-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<svg
    [attr.width]="size()"
    [attr.height]="size()"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    [attr.stroke-width]="stroke()"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    [innerHTML]="paths()"
  ></svg>`,
  styles: ':host { display: inline-flex; flex-shrink: 0; }',
})
export class Icon {
  private readonly sanitizer = inject(DomSanitizer);

  readonly name = input.required<IconName>();
  readonly size = input(24);
  readonly stroke = input(1.8);

  protected readonly paths = computed(() =>
    this.sanitizer.bypassSecurityTrustHtml(ICONS[this.name()]),
  );
}
