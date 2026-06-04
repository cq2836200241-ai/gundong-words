import { BrowserWindow, screen, app } from 'electron';
import { join } from 'path';
import { DockPosition } from '@shared/types';
import { IPC_CHANNELS } from '@shared/types';
import { settingsManager } from '../config/settings';

export class ScrollBarWindowManager {
  private window: BrowserWindow | null = null;
  private currentDock: DockPosition = 'top';
  private currentOrientation: 'horizontal' | 'vertical' = 'horizontal';
  private currentBounds = { x: 0, y: 0, width: 800, height: 35 };
  private rendererReady = false;
  private readyCallbacks: Array<() => void | Promise<void>> = [];

  create(): void {
    const isDev = !app.isPackaged;

    this.window = new BrowserWindow({
      title: '滚动单词学习',
      width: 800,
      height: 35,
      transparent: true,
      backgroundColor: '#00000000',
      frame: false,
      alwaysOnTop: settingsManager.get('dock').alwaysOnTop ?? true,
      skipTaskbar: !isDev,
      resizable: false,
      focusable: isDev,
      webPreferences: {
        preload: join(__dirname, '../preload/index.js'),
        nodeIntegration: false,
        contextIsolation: true
      }
    });

    this.window.setIgnoreMouseEvents(true, { forward: true });

    this.window.webContents.on('did-finish-load', () => {
      console.log('Scroll bar renderer loaded.');
      this.rendererReady = true;
      this.switchDock(this.currentDock);
      this.show();
      void Promise.all(this.readyCallbacks.map((callback) => callback()));
    });

    this.window.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
      console.error(`Scroll bar renderer failed to load: ${errorCode} ${errorDescription} (${validatedURL})`);
    });

    this.window.webContents.on('render-process-gone', (_event, details) => {
      console.error('Scroll bar renderer process gone:', details);
    });

    if (!app.isPackaged && process.env['ELECTRON_RENDERER_URL']) {
      const rendererUrl = process.env['ELECTRON_RENDERER_URL'].replace(/\/$/, '');
      void this.window.loadURL(`${rendererUrl}/scroll-bar.html`);
    } else {
      void this.window.loadFile(join(__dirname, '../renderer/scroll-bar.html'));
    }

    this.switchDock('top');
  }

  switchDock(position: DockPosition): void {
    if (!this.window) return;
    this.currentDock = position;
    
    const display = screen.getPrimaryDisplay();
    const workArea = display.workAreaSize;
    const fullSize = display.size;
    
    const thickness = settingsManager.get('dock').thickness;
    
    let bounds = { x: 0, y: 0, width: 0, height: 0 };
    let orientation = 'horizontal';

    switch (position) {
      case 'top':
        bounds = { x: 0, y: 0, width: fullSize.width, height: thickness };
        orientation = 'horizontal';
        break;
      case 'left':
        bounds = { x: 0, y: 0, width: thickness, height: workArea.height };
        orientation = 'vertical';
        break;
      case 'right':
        bounds = { x: fullSize.width - thickness, y: 0, width: thickness, height: workArea.height };
        orientation = 'vertical';
        break;
    }

    this.currentBounds = bounds;
    this.currentOrientation = orientation as 'horizontal' | 'vertical';
    this.window.setBounds(bounds, true);
    this.window.setAlwaysOnTop(settingsManager.get('dock').alwaysOnTop ?? true, 'screen-saver');
    this.show();

    if (this.rendererReady) this.sendDockChanged();
  }



  show(): void {
    if (!this.window || this.window.isDestroyed()) return;
    this.window.showInactive();
    this.window.moveTop();
  }

  onReady(callback: () => void | Promise<void>): void {
    if (this.rendererReady) {
      void callback();
      return;
    }

    this.readyCallbacks.push(callback);
  }

  getWindow(): BrowserWindow | null {
    return this.window;
  }

  private sendDockChanged(): void {
    if (!this.window || this.window.isDestroyed()) return;

    this.window.webContents.send(IPC_CHANNELS.DOCK_CHANGED, {
      position: this.currentDock,
      orientation: this.currentOrientation,
      dimensions: { width: this.currentBounds.width, height: this.currentBounds.height }
    });
  }
}
