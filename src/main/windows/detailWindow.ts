import { BrowserWindow, app } from 'electron';
import { join } from 'path';

export class DetailWindowManager {
  private window: BrowserWindow | null = null;

  show(wordId: number): void {
    if (this.window && !this.window.isDestroyed()) {
      // If window already exists, just load the new URL and show it
      const url = this.getRendererUrl(wordId);
      void this.window.loadURL(url);
      this.window.show();
      this.window.focus();
      return;
    }

    const isDev = !app.isPackaged;

    this.window = new BrowserWindow({
      title: '单词详情',
      width: 400,
      height: 600,
      show: false,
      autoHideMenuBar: true,
      webPreferences: {
        preload: join(__dirname, '../preload/index.js'),
        nodeIntegration: false,
        contextIsolation: true
      }
    });

    this.window.webContents.on('did-finish-load', () => {
      if (this.window) {
        this.window.show();
        this.window.focus();
      }
    });

    const url = this.getRendererUrl(wordId);
    void this.window.loadURL(url);

    this.window.on('closed', () => {
      this.window = null;
    });
  }

  private getRendererUrl(wordId: number): string {
    if (!app.isPackaged && process.env['ELECTRON_RENDERER_URL']) {
      const rendererUrl = process.env['ELECTRON_RENDERER_URL'].replace(/\/$/, '');
      return `${rendererUrl}/detail.html?id=${wordId}`;
    }
    return `file://${join(__dirname, '../renderer/detail.html')}?id=${wordId}`;
  }
}
