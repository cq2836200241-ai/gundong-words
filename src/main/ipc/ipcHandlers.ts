import { ipcMain, BrowserWindow } from 'electron';
import { IPC_CHANNELS } from '@shared/types';
import { settingsManager } from '../config/settings';
import { WordRepository } from '../database/wordRepository';
import { WordBookRepository } from '../database/wordBookRepository';
import { deepseekService } from '../services/deepseekService';

export function setupIpcHandlers(scrollBarManager: any, db: any) {
  const wordRepo = new WordRepository();
  const bookRepo = new WordBookRepository();

  // Settings
  ipcMain.handle(IPC_CHANNELS.SETTINGS_GET, () => {
    return settingsManager.getAll();
  });

  ipcMain.handle(IPC_CHANNELS.SETTINGS_UPDATE, (_, partial) => {
    settingsManager.update(partial);
    // Broadcast setting changes
    BrowserWindow.getAllWindows().forEach(win => {
      win.webContents.send(IPC_CHANNELS.SETTINGS_UPDATE, partial);
    });
    
    // Specific handlers for dock position
    if (partial.dock?.position) {
      scrollBarManager.switchDock(partial.dock.position);
    }
  });

  // Windows
  ipcMain.handle(IPC_CHANNELS.WINDOW_OPEN_DETAIL, (_, wordId: number) => {
    // Placeholder to open detail window
    console.log(`Open detail window for word ${wordId}`);
  });

  // Init deepseek if key exists
  const settings = settingsManager.getAll();
  if (settings.deepseek.apiKey) {
    deepseekService.init(settings.deepseek.apiKey, settings.deepseek.baseUrl);
  }
}
