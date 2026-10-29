import { inject } from '@angular/core';
import { CanActivateFn, Router, Routes } from '@angular/router';
import { LocalStore } from './data/local-store';
import { MainLayout } from './layout/main-layout';
import { Placeholder } from './layout/placeholder';
import { Server } from './server/server';
import { ShareReceiver } from './share/share-receiver';
import { SyncService } from './sync/sync.service';

const signedIn: CanActivateFn = () => {
  if (!inject(Server).signedIn()) {
    return inject(Router).parseUrl('/sign-in');
  }
  inject(SyncService).start();
  inject(ShareReceiver).start();
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

const placeholder = (path: string, title: string) => ({
  path,
  component: Placeholder,
  data: { title },
});

export const routes: Routes = [
  { path: 'sign-in', loadComponent: () => import('./sign-in/sign-in').then((m) => m.SignIn) },
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
    path: 'todo/:id',
    canActivate: [signedIn],
    loadComponent: () => import('./todo/todo-editor').then((m) => m.TodoEditor),
  },
  {
    path: 'lists/edit',
    canActivate: [signedIn],
    loadComponent: () => import('./lists/manage-lists').then((m) => m.ManageLists),
  },
  {
    path: 'lists/:id/settings',
    canActivate: [signedIn],
    loadComponent: () => import('./lists/list-settings').then((m) => m.ListSettings),
  },
  {
    path: 'note/:id',
    canActivate: [signedIn],
    loadComponent: () => import('./note/note-editor').then((m) => m.NoteEditor),
  },
  {
    path: '',
    component: MainLayout,
    canActivate: [signedIn],
    children: [
      {
        path: '',
        pathMatch: 'full',
        canActivate: [setUp],
        loadComponent: () => import('./today/today').then((m) => m.Today),
      },
      { path: 'inbox', loadComponent: () => import('./inbox/inbox').then((m) => m.Inbox) },
      { path: 'lists', loadComponent: () => import('./lists/lists-page').then((m) => m.ListsPage) },
      {
        path: 'lists/:id',
        loadComponent: () => import('./lists/list-page').then((m) => m.ListPage),
      },
      placeholder('agenda', 'Agenda.'),
      placeholder('search', 'Search.'),
      placeholder('week', 'This week.'),
      placeholder('settings', 'Settings.'),
    ],
  },
  { path: '**', redirectTo: '' },
];
