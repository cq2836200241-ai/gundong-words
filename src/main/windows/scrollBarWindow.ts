import { BrowserWindow, screen, app } from 'electron';
import { join } from 'path';
import { DockPosition } from '@shared/types';
import { IPC_CHANNELS } from '@shared/types';

export class ScrollBarWindowManager {
  private window: BrowserWindow | null = null;
  private currentDock: DockPosition = 'top';

  create(): void {
    this.window = new BrowserWindow({
      width: 800, height: 100, // Initial dimensions
      transparent: true,
      frame: false,
      alwaysOnTop: true,
      skipTaskbar: true,
      resizable: false,
      focusable: false,
      type: 'toolbar',
      webPreferences: {
        preload: join(__dirname, '../preload/index.js'),
        nodeIntegration: false,
        contextIsolation: true
      }
    });

    this.window.setIgnoreMouseEvents(true, { forward: true });

    if (!app.isPackaged && process.env['ELECTRON_RENDERER_URL']) {
      this.window.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/src/renderer/scroll-bar.html`);
      this.window.webContents.openDevTools({ mode: 'detach' });
    } else {
      this.window.loadFile(join(__dirname, '../renderer/scroll-bar.html'));
    }

    this.switchDock('top');

    this.window.on('mouseenter', () => {
      this.window?.setIgnoreMouseEvents(false);
    });
    this.window.on('mouseleave', () => {
      this.window?.setIgnoreMouseEvents(true, { forward: true });
    });
  }

  switchDock(position: DockPosition): void {
    if (!this.window) return;
    this.currentDock = position;
    
    const display = screen.getPrimaryDisplay();
    const workArea = display.workAreaSize;
    const fullSize = display.size;
    
    const thicknessTop = 70;
    const thicknessSide = 80;
    
    let bounds = { x: 0, y: 0, width: 0, height: 0 };
    let orientation = 'horizontal';

    switch (position) {
      case 'top':
        bounds = { x: 0, y: 0, width: fullSize.width, height: thicknessTop };
        orientation = 'horizontal';
        break;
      case 'left':
        bounds = { x: 0, y: 0, width: thicknessSide, height: workArea.height };
        orientation = 'vertical';
        break;
      case 'right':
        bounds = { x: fullSize.width - thicknessSide, y: 0, width: thicknessSide, height: workArea.height };
        orientation = 'vertical';
        break;
    }

    this.window.setBounds(bounds, true);

    this.window.webContents.send(IPC_CHANNELS.DOCK_CHANGED, {
      position,
      orientation,
      dimensions: { width: bounds.width, height: bounds.height }
    });
  }

  setOpacity(opacity: number): void {
    if (this.window) this.window.setOpacity(opacity);
  }

  getWindow(): BrowserWindow | null {
    return this.window;
  }
}
