import { BrowserWindow, app } from 'electron';
import { join } from 'path';

export class SettingsWindowManager {
  private window: BrowserWindow | null = null;

  open(): void {
    if (this.window && !this.window.isDestroyed()) {
      this.window.show();
      this.window.focus();
      return;
    }

    this.window = new BrowserWindow({
      title: '设置',
      width: 600,
      height: 550,
      minWidth: 500,
      minHeight: 450,
      show: false,
      backgroundColor: '#0a0a14',
      webPreferences: {
        preload: join(__dirname, '../preload/index.js'),
        nodeIntegration: false,
        contextIsolation: true
      }
    });

    this.window.once('ready-to-show', () => {
      this.window?.show();
      this.window?.focus();
    });

    this.window.on('closed', () => {
      this.window = null;
    });

    this.window.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
      console.error(`Settings window failed to load: ${errorCode} ${errorDescription} (${validatedURL})`);
    });

    if (!app.isPackaged && process.env['ELECTRON_RENDERER_URL']) {
      const rendererUrl = process.env['ELECTRON_RENDERER_URL'].replace(/\/$/, '');
      void this.window.loadURL(`${rendererUrl}/settings.html`);
    } else {
      void this.window.loadFile(join(__dirname, '../renderer/settings.html'));
    }
  }
}
