import { Injectable } from '@angular/core';

interface TauriWindow {
  label: string;
  hide(): Promise<void>;
}

interface TauriGlobal {
  window: { getCurrentWindow(): TauriWindow };
  core: { invoke(command: string, args: Record<string, unknown>): Promise<unknown> };
}

const CAPTURE_WINDOW = 'capture';

@Injectable({ providedIn: 'root' })
export class DesktopShell {
  private readonly tauri = (window as unknown as { __TAURI__?: TauriGlobal }).__TAURI__;

  readonly available = !!this.tauri;

  inCaptureWindow(): boolean {
    return this.tauri?.window.getCurrentWindow().label === CAPTURE_WINDOW;
  }

  async hideWindow() {
    await this.tauri?.window.getCurrentWindow().hide();
  }

  async openFile(url: string, name: string) {
    await this.tauri?.core.invoke('open_file', { url, name });
  }
}
