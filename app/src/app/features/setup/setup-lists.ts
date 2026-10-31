import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ListActions } from '../../core/data/list-actions';
import { Icon } from '../../shared/ui/icon';
import { ChoiceChips } from './choice-chips';
import { Choice, SetupState } from './setup-state';
import { colourFor, LIST_SUGGESTIONS } from './suggestions';

@Component({
  selector: 'app-setup-lists',
  imports: [ChoiceChips, FormsModule, Icon, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './setup-page.html',
  styleUrl: './setup-page.scss',
})
export class SetupLists {
  private readonly state = inject(SetupState);
  private readonly lists = inject(ListActions);
  private readonly router = inject(Router);

  protected readonly heading = 'Your lists.';
  protected readonly step: number = 2;
  protected readonly back = '/setup/groups';
  protected readonly addLabel = 'New list';
  protected readonly newName = signal('');

  private readonly pickedGroups = computed(() =>
    this.state
      .groups()
      .filter((group) => group.picked)
      .map((group) => group.name),
  );

  protected readonly sections = computed(() =>
    this.pickedGroups().map((name) => ({ name, choices: this.choicesFor(name) })),
  );
  protected readonly canContinue = computed(() =>
    this.sections().some((section) => section.choices.some((choice) => choice.picked)),
  );

  protected toggle(section: string, name: string) {
    const choices = this.choicesFor(section).map((choice) =>
      choice.name === name ? { ...choice, picked: !choice.picked } : choice,
    );
    this.state.lists.update((lists) => ({ ...lists, [section]: choices }));
  }

  protected add() {
    const name = this.newName().trim();
    const section = this.pickedGroups()[0];
    if (name && section) {
      this.state.lists.update((lists) => ({
        ...lists,
        [section]: [...this.choicesFor(section), { name, picked: true }],
      }));
    }
    this.newName.set('');
  }

  protected async continue() {
    for (const [order, section] of this.sections().entries()) {
      const picked = section.choices.filter((choice) => choice.picked);
      await this.lists.createGroupWithLists({
        name: section.name,
        order,
        lists: picked.map((choice, index) => ({
          name: choice.name,
          colour: colourFor(section.name, index),
        })),
      });
    }
    await this.router.navigateByUrl('/');
  }

  private choicesFor(group: string): Choice[] {
    return (
      this.state.lists()[group] ??
      (LIST_SUGGESTIONS[group] ?? [{ name: group, picked: true }]).map((choice) => ({ ...choice }))
    );
  }
}
