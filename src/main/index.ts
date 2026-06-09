import { app, BrowserWindow } from 'electron';
import { ScrollBarWindowManager } from './windows/scrollBarWindow';
import { WordBookWindowManager } from './windows/wordBookWindow';
import { DetailWindowManager } from './windows/detailWindow';
import { TrayManager } from './tray/trayManager';
import { GlobalHotkey } from './hotkeys/globalHotkey';
import { dbManager } from './database/db';
import { setupIpcHandlers } from './ipc/ipcHandlers';
import { WordBookPlaybackService } from './services/wordBookPlayback';
import { AihotFeedService } from './services/aihotFeed';
import { GithubFeedService } from './services/githubFeed';
import { settingsManager } from './config/settings';
import { SettingsWindowManager } from './windows/settingsWindow';

let scrollBarManager: ScrollBarWindowManager;
let wordBookManager: WordBookWindowManager;
let detailWindowManager: DetailWindowManager;
let settingsWindowManager: SettingsWindowManager;
let trayManager: TrayManager;
let aihotFeedService: AihotFeedService;
let githubFeedService: GithubFeedService;
let hotkey: GlobalHotkey | null = null;

process.on('uncaughtException', (err) => {
  console.error('CRITICAL ERROR:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('UNHANDLED REJECTION:', reason);
});

console.log("App starting...");

app.disableHardwareAcceleration();

const gotInstanceLock = app.requestSingleInstanceLock();
if (!gotInstanceLock) {
  console.log('Another instance is already running. Quitting this one.');
  app.quit();
} else {
console.log("Got instance lock. Proceeding...");

app.on('second-instance', () => {
  scrollBarManager?.show();
});

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
  wordBookManager = new WordBookWindowManager();
  detailWindowManager = new DetailWindowManager();
  settingsWindowManager = new SettingsWindowManager();
  setupIpcHandlers(scrollBarManager, detailWindowManager, wordBookManager, playbackService, dbManager);
  scrollBarManager.create();
  scrollBarManager.onReady(() => {
    playbackService.refresh();

  });

  aihotFeedService = new AihotFeedService();
  aihotFeedService.start();

  githubFeedService = new GithubFeedService();
  githubFeedService.start();

  trayManager = new TrayManager(scrollBarManager, wordBookManager, settingsWindowManager, playbackService);
  trayManager.init();

  hotkey = new GlobalHotkey(playbackService);
  try {
    hotkey.start();
    console.log('Global hotkey listener started.');
  } catch (e) {
    console.error('Global hotkey listener failed to start:', e);
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    // Hide to tray, do not quit
  }
});
}
