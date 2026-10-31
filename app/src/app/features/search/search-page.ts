import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Actions } from '../../core/data/actions';
import { Store } from '../../core/data/store';
import { Icon } from '../../shared/ui/icon';
import { ListLabel } from '../../shared/ui/list-label';
import { Toasts } from '../../shared/ui/toast';
import { search, SearchFilter, SearchHit } from '../../domain/search-items';

const RECENT_MS = 7 * 86_400_000;
const RECENT_WHEN_EMPTY = 8;

@Component({
  selector: 'app-search-page',
  imports: [FormsModule, Icon, ListLabel, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './search-page.html',
  styleUrl: './search-page.scss',
})
export class SearchPage {
  private readonly store = inject(Store);
  private readonly actions = inject(Actions);
  private readonly toasts = inject(Toasts);
  private readonly router = inject(Router);
  private readonly field = viewChild<ElementRef<HTMLInputElement>>('field');

  protected readonly query = signal(inject(ActivatedRoute).snapshot.queryParamMap.get('q') ?? '');
  protected readonly filter = signal<SearchFilter>('all');
  protected readonly filters: { value: SearchFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'todos', label: 'Todos' },
    { value: 'notes', label: 'Notes' },
  ];

  constructor() {
    afterNextRender(() => this.field()?.nativeElement.focus());
  }

  private readonly hits = computed(() =>
    search(this.store.todos(), this.store.notes(), this.query(), this.filter()),
  );
  protected readonly sections = computed(() => {
    const hits = this.query().trim() ? this.hits() : this.hits().slice(0, RECENT_WHEN_EMPTY);
    const recent = Date.now() - RECENT_MS;
    return [
      { label: 'Recent', hits: hits.filter((hit) => hit.changedAt >= recent) },
      { label: 'Earlier', hits: hits.filter((hit) => hit.changedAt < recent) },
    ].filter((section) => section.hits.length);
  });

  protected list(hit: SearchHit) {
    return this.store.list(hit.list);
  }

  protected link(hit: SearchHit) {
    return [hit.kind === 'note' ? '/note' : '/todo', hit.id];
  }

  protected cancel() {
    this.router.navigateByUrl('/');
  }

  protected async captureAsNote() {
    const note = await this.actions.createNote({ title: this.query().trim() });
    this.toasts.show({ title: 'In the Inbox' });
    await this.router.navigate(['/note', note.id], { state: { back: '/inbox' } });
  }
}
