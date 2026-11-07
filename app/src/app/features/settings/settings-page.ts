import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CalendarSettings } from '../../core/calendar/calendar-settings';
import { AllRecords } from '../../core/data/all-records';
import { Session } from '../../core/session/session';
import { Sync } from '../../core/sync/sync';
import { Clock } from '../../core/time/clock';
import { Icon } from '../../shared/ui/icon';

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

export function signOutLabel(waiting: number, confirming: boolean): string {
  if (!confirming) {
    return 'Sign out';
  }
  return `Sign out and lose ${waiting} ${waiting === 1 ? 'change' : 'changes'}`;
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
  private readonly all = inject(AllRecords);
  private readonly clock = inject(Clock);
  protected readonly sync = inject(Sync);
  protected readonly calendars = inject(CalendarSettings);

  protected readonly email = this.session.email();
  protected readonly name = this.email.split('@')[0];
  protected readonly serverUrl = this.session.serverUrl;
  protected readonly synced = computed(() =>
    syncedLabel(this.sync.lastSynced(), this.clock.now(), this.sync.online()),
  );
  protected readonly deletedCount = computed(() => this.all.deletedOn(this.clock.today()).length);

  protected syncNow() {
    void this.sync.sync();
  }

  protected readonly confirmingSignOut = signal(false);
  protected readonly signOutText = computed(() =>
    signOutLabel(this.sync.waiting(), this.confirmingSignOut()),
  );

  protected async signOut() {
    if (this.sync.waiting() > 0 && !this.confirmingSignOut()) {
      this.confirmingSignOut.set(true);
      return;
    }
    await this.session.signOut();
    location.assign('/sign-in');
  }
}
