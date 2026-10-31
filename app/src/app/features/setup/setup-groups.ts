import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Icon } from '../../shared/ui/icon';
import { ChoiceChips } from './choice-chips';
import { SetupState } from './setup-state';

@Component({
  selector: 'app-setup-groups',
  imports: [ChoiceChips, FormsModule, Icon, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './setup-page.html',
  styleUrl: './setup-page.scss',
})
export class SetupGroups {
  private readonly state = inject(SetupState);
  private readonly router = inject(Router);

  protected readonly heading = 'Your groups.';
  protected readonly step: number = 1;
  protected readonly back = '/sign-in';
  protected readonly addLabel = 'New group';
  protected readonly sections = computed(() => [{ name: '', choices: this.state.groups() }]);
  protected readonly newName = signal('');
  protected readonly canContinue = computed(() =>
    this.state.groups().some((group) => group.picked),
  );

  protected toggle(_section: string, name: string) {
    this.state.groups.update((groups) =>
      groups.map((group) => (group.name === name ? { ...group, picked: !group.picked } : group)),
    );
  }

  protected add() {
    const name = this.newName().trim();
    if (name && !this.state.groups().some((group) => group.name === name)) {
      this.state.groups.update((groups) => [...groups, { name, picked: true }]);
    }
    this.newName.set('');
  }

  protected continue() {
    void this.router.navigateByUrl('/setup/lists');
  }
}
