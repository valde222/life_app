import { inject } from '@angular/core';
import { CanActivateFn, Router, Routes } from '@angular/router';
import { Server } from './server/server';
import { SyncService } from './sync/sync.service';

const signedIn: CanActivateFn = () => {
  if (!inject(Server).signedIn()) {
    return inject(Router).parseUrl('/sign-in');
  }
  inject(SyncService).start();
  return true;
};

export const routes: Routes = [
  { path: 'sign-in', loadComponent: () => import('./sign-in/sign-in').then((m) => m.SignIn) },
  {
    path: '',
    canActivate: [signedIn],
    loadComponent: () => import('./today/today').then((m) => m.Today),
  },
  { path: '**', redirectTo: '' },
];
