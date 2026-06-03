import { Tray, Menu, app } from 'electron';
import path from 'path';
import { ScrollBarWindowManager } from '../windows/scrollBarWindow';
import { settingsManager } from '../config/settings';

export class TrayManager {
  private tray: Tray | null = null;
  private scrollManager: ScrollBarWindowManager;

  constructor(scrollManager: ScrollBarWindowManager) {
    this.scrollManager = scrollManager;
  }

  init() {
    // We need a dummy icon path for now, in a real app this should point to a built asset
    const iconPath = process.platform === 'win32' 
      ? path.join(__dirname, '../../build/icon.ico') 
      : path.join(__dirname, '../../build/icon.png');
    
    // In dev mode, if icon doesn't exist, we might crash. Better to handle it.
    try {
      this.tray = new Tray(iconPath);
    } catch {
      const { nativeImage } = require('electron');
      // Red pixel for visibility
      const iconBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
      const image = nativeImage.createFromDataURL(iconBase64);
      this.tray = new Tray(image);
    }

    this.tray.setToolTip('滚动单词学习');
    this.tray.on('right-click', () => {
      this.tray?.popUpContextMenu(this.buildMenu());
    });
  }

  private buildMenu(): Menu {
    return Menu.buildFromTemplate([
      { label: '暂停 / 恢复', click: () => { /* Notify via IPC to toggle */ } },
      { type: 'separator' },
      {
        label: '吸附位置',
        submenu: [
          { label: '顶部', type: 'radio', checked: settingsManager.get('dock').position === 'top', click: () => this.scrollManager.switchDock('top') },
          { label: '左侧', type: 'radio', checked: settingsManager.get('dock').position === 'left', click: () => this.scrollManager.switchDock('left') },
          { label: '右侧', type: 'radio', checked: settingsManager.get('dock').position === 'right', click: () => this.scrollManager.switchDock('right') }
        ]
      },
      {
        label: '透明度',
        submenu: [
          { label: '100%', click: () => this.scrollManager.setOpacity(1) },
          { label: '75%', click: () => this.scrollManager.setOpacity(0.75) },
          { label: '50%', click: () => this.scrollManager.setOpacity(0.5) }
        ]
      },
      { type: 'separator' },
      { label: '词库管理', click: () => { /* Open wordbook window */ } },
      { label: '退出', click: () => app.quit() }
    ]);
  }
}
