import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/shell/app.config';
import { App } from './app/shell/app';
import { logError } from './app/core/logging/log';

bootstrapApplication(App, appConfig).catch((error: unknown) => {
  logError('The app failed to start', error);
});
