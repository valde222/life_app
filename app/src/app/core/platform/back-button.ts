import { Dialog } from '@angular/cdk/dialog';
import { inject, Injectable } from '@angular/core';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { logError } from '../logging/log';

export type BackAction = 'close-sheet' | 'go-back' | 'leave-app';

export function backAction(state: { sheetOpen: boolean; canGoBack: boolean }): BackAction {
  if (state.sheetOpen) {
    return 'close-sheet';
  }
  return state.canGoBack ? 'go-back' : 'leave-app';
}

@Injectable({ providedIn: 'root' })
export class BackButton {
  private readonly dialog = inject(Dialog);

  start() {
    if (Capacitor.getPlatform() !== 'android') {
      return;
    }
    App.addListener('backButton', ({ canGoBack }) => {
      this.handle(canGoBack);
    }).catch((error: unknown) => {
      logError('Listening for the back button failed', error);
    });
  }

  handle(canGoBack: boolean) {
    const sheets = this.dialog.openDialogs;
    switch (backAction({ sheetOpen: sheets.length > 0, canGoBack })) {
      case 'close-sheet':
        sheets.at(-1)?.close();
        return;
      case 'go-back':
        history.back();
        return;
      case 'leave-app':
        App.minimizeApp().catch((error: unknown) => {
          logError('Leaving the app failed', error);
        });
    }
  }
}
