import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ListActions } from '../../core/data/list-actions';
import { ListColour } from '../../domain/models';
import { Store } from '../../core/data/store';
import { Icon } from '../../shared/ui/icon';
import { ColourPicker } from './colour-picker';
import { Toasts } from '../../core/toasts/toasts';

@Component({
  selector: 'app-list-settings',
  imports: [ColourPicker, FormsModule, Icon, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './list-settings.html',
  styleUrl: './list-settings.scss',
})
export class ListSettings {
  readonly id = input.required<string>();

  private readonly store = inject(Store);
  private readonly lists = inject(ListActions);
  private readonly toasts = inject(Toasts);
  private readonly router = inject(Router);

  protected readonly list = computed(() => this.store.list(this.id()));
  protected readonly groups = this.store.sortedGroups;
  protected readonly name = signal('');
  protected readonly group = signal('');
  protected readonly colour = signal<ListColour>('grey');
  protected readonly confirmingDelete = signal(false);

  constructor() {
    let loaded = false;
    effect(() => {
      const list = this.list();
      if (list && !loaded) {
        loaded = true;
        untracked(() => {
          this.name.set(list.name);
          this.group.set(list.group);
          this.colour.set(list.colour);
        });
      }
    });
  }

  protected async done() {
    const name = this.name().trim();
    if (name) {
      await this.lists.updateList(this.id(), { name, group: this.group(), colour: this.colour() });
    }
    await this.router.navigate(['/lists', this.id()]);
  }

  protected async archive() {
    const undo = await this.lists.archiveList(this.id());
    this.toasts.show({ title: 'List archived', undo });
    await this.router.navigateByUrl('/lists');
  }

  protected async delete() {
    if (!this.confirmingDelete()) {
      this.confirmingDelete.set(true);
      return;
    }
    await this.lists.deleteListWithItems(this.id());
    await this.router.navigateByUrl('/lists');
  }
}
