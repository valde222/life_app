import { Injectable } from '@angular/core';

interface TauriWindow {
  label: string;
  hide(): Promise<void>;
  show(): Promise<void>;
  setFocus(): Promise<void>;
}

interface TauriGlobal {
  window: { getCurrentWindow(): TauriWindow };
  event: { listen(event: string, handler: () => void): Promise<() => void> };
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

  onEvent(name: string, handler: () => void) {
    this.tauri?.event.listen(name, handler);
  }
}
