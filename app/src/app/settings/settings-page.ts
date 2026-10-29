import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CalendarSettings } from '../calendar/calendar-settings';
import { Repository } from '../data/repository';
import { LocalStore } from '../data/local-store';
import { Server } from '../server/server';
import { SyncService } from '../sync/sync.service';
import { Clock } from '../time/clock';
import { Icon } from '../ui/icon';
import { deletedItems } from '../archive/deleted-items';

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
  private readonly server = inject(Server);
  private readonly router = inject(Router);
  private readonly store = inject(LocalStore);
  private readonly repository = inject(Repository);
  private readonly clock = inject(Clock);
  protected readonly sync = inject(SyncService);
  protected readonly calendars = inject(CalendarSettings);

  protected readonly email =
    (this.server.pb.authStore.record?.['email'] as string | undefined) ?? '';
  protected readonly name = this.email.split('@')[0];
  protected readonly serverUrl = this.server.url;
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
    await this.sync.stop();
    this.server.signOut();
    await this.store.delete();
    location.assign('/sign-in');
  }
}
