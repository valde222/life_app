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
import { Actions } from '../core/data/actions';
import { pocketBaseTimestamp } from '../domain/ids';
import { ListColour } from '../domain/models';
import { Repository } from '../core/data/repository';
import { Store } from '../core/data/store';
import { Icon } from '../ui/icon';
import { Toasts } from '../ui/toast';
import { ColourPicker } from './colour-picker';

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
  private readonly repository = inject(Repository);
  private readonly actions = inject(Actions);
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
      await this.repository.save('lists', {
        id: this.id(),
        name,
        group: this.group(),
        colour: this.colour(),
      });
    }
    await this.router.navigate(['/lists', this.id()]);
  }

  protected async archive() {
    await this.repository.save('lists', { id: this.id(), archived_at: pocketBaseTimestamp() });
    this.toasts.show({
      title: 'List archived',
      undo: () => this.repository.save('lists', { id: this.id(), archived_at: '' }),
    });
    await this.router.navigateByUrl('/lists');
  }

  protected async delete() {
    if (!this.confirmingDelete()) {
      this.confirmingDelete.set(true);
      return;
    }
    for (const todo of this.store.todos().filter((todo) => todo.list === this.id())) {
      await this.actions.delete('todos', todo);
    }
    for (const note of this.store.notes().filter((note) => note.list === this.id())) {
      await this.actions.delete('notes', note);
    }
    await this.repository.remove('lists', this.id());
    await this.router.navigateByUrl('/lists');
  }
}
