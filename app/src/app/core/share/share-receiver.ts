import { inject, Injectable } from '@angular/core';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { Actions } from '../data/actions';
import { Toasts } from '../../ui/toast';
import { sharedNote, SharePayload } from '../../domain/shared-note';

interface ShareTargetPlugin {
  takePending(): Promise<{ share: SharePayload | null }>;
  addListener(event: 'shared', listener: (share: SharePayload) => void): Promise<unknown>;
}

export const SHARE_EVENT = 'life:share';

@Injectable({ providedIn: 'root' })
export class ShareReceiver {
  private readonly actions = inject(Actions);
  private readonly toasts = inject(Toasts);
  private started = false;

  async start() {
    if (this.started) {
      return;
    }
    this.started = true;
    window.addEventListener(SHARE_EVENT, (event) =>
      this.receive((event as CustomEvent<SharePayload>).detail),
    );
    if (!Capacitor.isNativePlatform()) {
      return;
    }
    const plugin = registerPlugin<ShareTargetPlugin>('ShareTarget');
    await plugin.addListener('shared', (share) => this.receive(share));
    const { share } = await plugin.takePending();
    if (share) {
      await this.receive(share);
    }
  }

  async receive(share: SharePayload) {
    const note = sharedNote(share);
    if (!note) {
      return;
    }
    await this.actions.createNote(note);
    this.toasts.show({ title: 'In the Inbox' });
  }
}
