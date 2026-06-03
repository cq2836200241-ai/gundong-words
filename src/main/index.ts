import { app, BrowserWindow } from 'electron';
import { ScrollBarWindowManager } from './windows/scrollBarWindow';
import { TrayManager } from './tray/trayManager';
import { GlobalHotkey } from './hotkeys/globalHotkey';
import { dbManager } from './database/db';
import { setupIpcHandlers } from './ipc/ipcHandlers';
import { WordBookPlaybackService } from './services/wordBookPlayback';

let scrollBarManager: ScrollBarWindowManager;
let trayManager: TrayManager;

process.on('uncaughtException', (err) => {
  console.error('CRITICAL ERROR:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('UNHANDLED REJECTION:', reason);
});

console.log("App starting...");

app.disableHardwareAcceleration();

console.log("Got instance lock. Proceeding...");

app.whenReady().then(async () => {
  console.log("App is ready. Initializing DB...");
  try {
    dbManager.init();
    console.log("DB initialized.");
  } catch (e) {
    console.error("DB Init Error:", e);
  }

  const playbackService = new WordBookPlaybackService();

  scrollBarManager = new ScrollBarWindowManager();
  scrollBarManager.create();

  trayManager = new TrayManager(scrollBarManager);
  trayManager.init();

  const hotkey = new GlobalHotkey(playbackService);
  hotkey.start();

  setupIpcHandlers(scrollBarManager, dbManager);
  
  // Send initial playback data
  playbackService.refresh();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    // Hide to tray, do not quit
  }
});
