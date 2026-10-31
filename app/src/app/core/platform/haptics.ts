import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { logError } from '../logging/log';

@Injectable({ providedIn: 'root' })
export class HapticTicks {
  private readonly available = Capacitor.getPlatform() === 'android';

  tick() {
    if (this.available) {
      Haptics.impact({ style: ImpactStyle.Light }).catch((error: unknown) => {
        logError('Haptic feedback failed', error);
      });
    }
  }
}
