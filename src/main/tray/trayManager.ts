import { Tray, Menu, app } from 'electron';
import path from 'path';
import { ScrollBarWindowManager } from '../windows/scrollBarWindow';
import { WordBookWindowManager } from '../windows/wordBookWindow';
import { SettingsWindowManager } from '../windows/settingsWindow';
import { WordBookPlaybackService } from '../services/wordBookPlayback';
import { settingsManager } from '../config/settings';

export class TrayManager {
  private tray: Tray | null = null;
  private scrollManager: ScrollBarWindowManager;
  private wordBookManager: WordBookWindowManager;
  private settingsManagerWindow: SettingsWindowManager;
  private playbackService: WordBookPlaybackService;

  constructor(
    scrollManager: ScrollBarWindowManager, 
    wordBookManager: WordBookWindowManager,
    settingsManagerWindow: SettingsWindowManager,
    playbackService: WordBookPlaybackService
  ) {
    this.scrollManager = scrollManager;
    this.wordBookManager = wordBookManager;
    this.settingsManagerWindow = settingsManagerWindow;
    this.playbackService = playbackService;
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
    this.tray.on('click', () => {
      this.settingsManagerWindow.open();
    });
  }

  private buildMenu(): Menu {
    const isPaused = this.playbackService.isPaused();
    return Menu.buildFromTemplate([
      { label: isPaused ? '▶ 恢复播放' : '⏸ 暂停播放', click: () => this.playbackService.togglePause() },
      { type: 'separator' },
      { label: '⚙️ 控制面板 (设置)', click: () => this.settingsManagerWindow.open() },
      { label: '📚 词库管理', click: () => this.wordBookManager.open() },
      { type: 'separator' },
      { label: '❌ 退出程序', click: () => app.quit() }
    ]);
  }
}
