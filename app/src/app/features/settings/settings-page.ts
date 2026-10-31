import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CalendarSettings } from '../../core/calendar/calendar-settings';
import { Repository } from '../../core/data/repository';
import { Session } from '../../core/session/session';
import { Sync } from '../../core/sync/sync';
import { Clock } from '../../core/time/clock';
import { Icon } from '../../shared/ui/icon';
import { deletedItems } from '../../domain/deleted-items';

export function syncedLabel(last: Date | null, now: Date, online: boolean): string {
  if (!online) {
    return 'Offline';
  }
  if (!last) {
    return 'Not yet';
  }
  const minutes = Math.floor((now.getTime() - last.getTime()) / 60_000);
  return minutes < 1 ? 'Synced just now' : `Synced ${minutes} min ago`;
}

@Component({
  selector: 'app-settings-page',
  imports: [Icon, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './settings-page.html',
  styleUrl: './settings-page.scss',
})
export class SettingsPage {
  private readonly session = inject(Session);
  private readonly repository = inject(Repository);
  private readonly clock = inject(Clock);
  protected readonly sync = inject(Sync);
  protected readonly calendars = inject(CalendarSettings);

  protected readonly email = this.session.email();
  protected readonly name = this.email.split('@')[0];
  protected readonly serverUrl = this.session.serverUrl;
  protected readonly synced = computed(() =>
    syncedLabel(this.sync.lastSynced(), this.clock.now(), this.sync.online()),
  );
  private readonly todos = this.repository.watchAll('todos');
  private readonly notes = this.repository.watchAll('notes');
  private readonly lists = this.repository.watchAll('lists');
  protected readonly deletedCount = computed(
    () => deletedItems(this.todos(), this.notes(), this.lists(), this.clock.today()).length,
  );

  protected syncNow() {
    this.sync.sync();
  }

  protected async signOut() {
    await this.session.signOut();
    location.assign('/sign-in');
  }
}
