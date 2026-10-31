import { inject } from '@angular/core';
import { CanActivateFn, Router, Routes } from '@angular/router';
import { LocalStore } from './core/data/local-store';
import { MainLayout } from './layout/main-layout';
import { Server } from './core/server/server';
import { ShareReceiver } from './core/share/share-receiver';
import { CalendarImporter } from './core/calendar/calendar-importer';
import { Reminders } from './core/reminders/reminders';
import { SyncService } from './core/sync/sync.service';

const signedIn: CanActivateFn = () => {
  if (!inject(Server).signedIn()) {
    return inject(Router).parseUrl('/sign-in');
  }
  inject(SyncService).start();
  inject(ShareReceiver).start();
  inject(CalendarImporter).start();
  inject(Reminders).start();
  return true;
};

const setUp: CanActivateFn = async () => {
  const store = inject(LocalStore);
  const router = inject(Router);
  await inject(SyncService).firstSync;
  const empty =
    (await store.records('groups').count()) === 0 && (await store.records('todos').count()) === 0;
  return empty ? router.parseUrl('/setup/groups') : true;
};

export const routes: Routes = [
  { path: 'sign-in', loadComponent: () => import('./sign-in/sign-in').then((m) => m.SignIn) },
  {
    path: 'capture',
    canActivate: [signedIn],
    loadComponent: () => import('./capture/capture-page').then((m) => m.CapturePage),
  },
  {
    path: 'setup',
    canActivate: [signedIn],
    children: [
      {
        path: 'groups',
        loadComponent: () => import('./setup/setup-groups').then((m) => m.SetupGroups),
      },
      {
        path: 'lists',
        loadComponent: () => import('./setup/setup-lists').then((m) => m.SetupLists),
      },
    ],
  },
  {
    path: '',
    component: MainLayout,
    canActivate: [signedIn],
    children: [
      {
        path: 'lists/edit',
        loadComponent: () => import('./lists/manage-lists').then((m) => m.ManageLists),
      },
      {
        path: 'lists/:id/settings',
        loadComponent: () => import('./lists/list-settings').then((m) => m.ListSettings),
      },
      {
        path: 'repeat/:id',
        loadComponent: () => import('./repeating/repeat-editor').then((m) => m.RepeatEditor),
      },
      {
        path: 'event/:id',
        loadComponent: () => import('./calendar/event-page').then((m) => m.EventPage),
      },
      {
        path: 'settings',
        loadComponent: () => import('./settings/settings-page').then((m) => m.SettingsPage),
      },
      {
        path: 'settings/calendars',
        loadComponent: () => import('./calendar/calendars-page').then((m) => m.CalendarsPage),
      },
      {
        path: 'note/:id',
        loadComponent: () => import('./note/note-editor').then((m) => m.NoteEditor),
      },
      {
        path: 'todo/:id',
        loadComponent: () => import('./todo/todo-editor').then((m) => m.TodoEditor),
      },
      {
        path: '',
        pathMatch: 'full',
        canActivate: [setUp],
        loadComponent: () => import('./today/today').then((m) => m.Today),
      },
      {
        path: 'repeating',
        loadComponent: () => import('./repeating/repeating-page').then((m) => m.RepeatingPage),
      },
      { path: 'inbox', loadComponent: () => import('./inbox/inbox').then((m) => m.Inbox) },
      { path: 'lists', loadComponent: () => import('./lists/lists-page').then((m) => m.ListsPage) },
      {
        path: 'lists/:id',
        loadComponent: () => import('./lists/list-page').then((m) => m.ListPage),
      },
      {
        path: 'agenda',
        loadComponent: () => import('./agenda/agenda-page').then((m) => m.AgendaPage),
      },
      {
        path: 'search',
        loadComponent: () => import('./search/search-page').then((m) => m.SearchPage),
      },
      { path: 'week', loadComponent: () => import('./week/week-page').then((m) => m.WeekPage) },
      {
        path: 'archive',
        loadComponent: () => import('./archive/archive-page').then((m) => m.ArchivePage),
      },
      {
        path: 'archive/deleted',
        loadComponent: () => import('./archive/deleted-page').then((m) => m.DeletedPage),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
