import { effect, inject, Injectable, Injector } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Todo } from '../../domain/models';
import { Store } from '../data/store';

const MAX_SCHEDULED = 60;
const DEBOUNCE_MS = 2000;

export function notificationId(todoId: string): number {
  let hash = 0;
  for (const char of todoId) {
    hash = (Math.imul(hash, 31) + char.charCodeAt(0)) | 0;
  }
  return Math.abs(hash) || 1;
}

export function dueReminders(
  todos: Todo[],
  now: Date,
): { id: number; title: string; at: Date; todo: string }[] {
  return todos
    .filter((todo) => todo.reminder && !todo.done_at && !todo.deleted_at && !todo.archived_at)
    .map((todo) => ({
      id: notificationId(todo.id),
      title: todo.title,
      at: new Date(todo.reminder.replace(' ', 'T')),
      todo: todo.id,
    }))
    .filter((reminder) => reminder.at > now)
    .sort((a, b) => a.at.getTime() - b.at.getTime())
    .slice(0, MAX_SCHEDULED);
}

@Injectable({ providedIn: 'root' })
export class Reminders {
  private readonly store = inject(Store);
  private timer: ReturnType<typeof setTimeout> | undefined;
  private started = false;

  start() {
    if (!Capacitor.isNativePlatform() || this.started) {
      return;
    }
    this.started = true;
    effect(
      () => {
        const todos = this.store.todos();
        clearTimeout(this.timer);
        this.timer = setTimeout(() => this.reschedule(todos), DEBOUNCE_MS);
      },
      { injector: this.injector },
    );
  }

  private readonly injector = inject(Injector);

  private async reschedule(todos: Todo[]) {
    try {
      if ((await LocalNotifications.checkPermissions()).display !== 'granted') {
        if ((await LocalNotifications.requestPermissions()).display !== 'granted') {
          return;
        }
      }
      const pending = await LocalNotifications.getPending();
      if (pending.notifications.length) {
        await LocalNotifications.cancel({
          notifications: pending.notifications.map(({ id }) => ({ id })),
        });
      }
      const due = dueReminders(todos, new Date());
      if (due.length) {
        await LocalNotifications.schedule({
          notifications: due.map((reminder) => ({
            id: reminder.id,
            title: reminder.title,
            body: '',
            schedule: { at: reminder.at, allowWhileIdle: true },
            extra: { todo: reminder.todo },
          })),
        });
      }
    } catch (error) {
      console.error('Scheduling reminders failed', error);
    }
  }
}
