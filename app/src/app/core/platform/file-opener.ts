import { inject, Injectable } from '@angular/core';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { DesktopShell } from './desktop-shell';

interface FileOpenerPlugin {
  open(options: { url: string; name: string }): Promise<void>;
}

const NativeOpener = registerPlugin<FileOpenerPlugin>('FileOpener');

export type OpenFailure = 'no-app' | 'failed';

export class OpenError extends Error {
  constructor(
    readonly failure: OpenFailure,
    cause?: unknown,
  ) {
    super(failure, { cause });
  }
}

@Injectable({ providedIn: 'root' })
export class FileOpener {
  private readonly desktop = inject(DesktopShell);

  async open(url: string, name: string): Promise<void> {
    try {
      if (Capacitor.isNativePlatform()) {
        await NativeOpener.open({ url, name });
      } else if (this.desktop.available) {
        await this.desktop.openFile(url, name);
      } else {
        window.open(url, '_blank', 'noopener');
      }
    } catch (error) {
      const code = (error as { code?: string }).code;
      throw new OpenError(code === 'NO_APP' ? 'no-app' : 'failed', error);
    }
  }
}
