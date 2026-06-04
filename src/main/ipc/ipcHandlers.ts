import { ipcMain, BrowserWindow, dialog } from 'electron';
import * as fs from 'fs';
import { IPC_CHANNELS, WordBookCreateInput } from '@shared/types';
import { settingsManager } from '../config/settings';
import { WordRepository } from '../database/wordRepository';
import { WordBookRepository } from '../database/wordBookRepository';
import { deepseekService } from '../services/deepseekService';
import { ImportService } from '../services/importService';
import { DetailWindowManager } from '../windows/detailWindow';
import { WordBookWindowManager } from '../windows/wordBookWindow';
import { WordBookPlaybackService } from '../services/wordBookPlayback';

export function setupIpcHandlers(
  scrollBarManager: any, 
  detailWindowManager: DetailWindowManager, 
  wordBookWindowManager: WordBookWindowManager,
  playbackService: WordBookPlaybackService,
  db: any
) {
  const wordRepo = new WordRepository();
  const bookRepo = new WordBookRepository();
  const importService = new ImportService();

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
    
    // Specific handlers for dock position and thickness
    if (partial.dock?.position !== undefined || partial.dock?.thickness !== undefined) {
      scrollBarManager.switchDock(settingsManager.get('dock').position);
    }
    
    if (partial.dock?.alwaysOnTop !== undefined) {
      const win = scrollBarManager.getWindow();
      if (win && !win.isDestroyed()) {
        win.setAlwaysOnTop(partial.dock.alwaysOnTop, 'screen-saver');
      }
    }
  });

  // Windows
  ipcMain.handle(IPC_CHANNELS.WINDOW_OPEN_DETAIL, (_, wordId: number) => {
    console.log(`Open detail window for word ${wordId}`);
    detailWindowManager.show(wordId);
  });

  ipcMain.handle(IPC_CHANNELS.WORDS_GET_DETAIL, (_, wordId: number) => {
    return wordRepo.getById(wordId);
  });

  ipcMain.on(IPC_CHANNELS.WINDOW_SET_IGNORE_MOUSE_EVENTS, (event, ignore: boolean, options?: any) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) {
      win.setIgnoreMouseEvents(ignore, options);
    }
  });

  ipcMain.handle(IPC_CHANNELS.WINDOW_OPEN_WORDBOOK, () => {
    wordBookWindowManager.open();
  });

  ipcMain.handle(IPC_CHANNELS.PLAYBACK_TOGGLE, () => {
    playbackService.togglePause();
  });

  // Word books
  ipcMain.handle(IPC_CHANNELS.WORDBOOK_LIST, () => {
    return bookRepo.getAll();
  });

  ipcMain.handle(IPC_CHANNELS.WORDBOOK_CREATE, (_, input: WordBookCreateInput) => {
    const book = bookRepo.create(input);
    bookRepo.setActive(book.id);
    broadcastPlaybackForBook(book.id);
    return bookRepo.getAll();
  });

  ipcMain.handle(IPC_CHANNELS.WORDBOOK_DELETE, (_, bookId: number) => {
    bookRepo.delete(bookId);
    let allBooks = bookRepo.getAll();
    const activeBook = allBooks.find(b => b.isActive);
    if (!activeBook) {
      if (allBooks.length > 0) {
        bookRepo.setActive(allBooks[0].id);
        allBooks = bookRepo.getAll();
        broadcastPlaybackForBook(allBooks[0].id);
      } else {
        BrowserWindow.getAllWindows().forEach(win => {
          win.webContents.send(IPC_CHANNELS.PLAYBACK_UPDATE, {
            bookId: -1,
            bookName: '',
            words: []
          });
        });
      }
    }
    return allBooks;
  });

  ipcMain.handle(IPC_CHANNELS.WORDBOOK_SET_ACTIVE, (_, bookId: number) => {
    bookRepo.setActive(bookId);
    broadcastPlaybackForBook(bookId);
    return bookRepo.getAll();
  });

  ipcMain.handle(IPC_CHANNELS.WORDBOOK_GET_WORDS, (_, bookId: number) => {
    return bookRepo.getWordsInBook(bookId);
  });

  ipcMain.handle(IPC_CHANNELS.WORDBOOK_IMPORT, async (_, bookId: number) => {
    const result = await dialog.showOpenDialog({
      title: '导入词库',
      properties: ['openFile'],
      filters: [
        { name: '词库文件', extensions: ['txt', 'csv', 'json'] },
        { name: '所有文件', extensions: ['*'] }
      ]
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    const importResult = await importService.importFromFile(result.filePaths[0], bookId);
    broadcastPlaybackForBook(bookId);
    return importResult;
  });

  ipcMain.handle(IPC_CHANNELS.WORDBOOK_DOWNLOAD_TEMPLATE, async () => {
    const result = await dialog.showSaveDialog({
      title: '保存导入模板',
      defaultPath: 'word_import_template.csv',
      filters: [
        { name: 'CSV 文件', extensions: ['csv'] },
        { name: 'JSON 文件', extensions: ['json'] },
        { name: 'TXT 文件', extensions: ['txt'] }
      ]
    });

    if (result.canceled || !result.filePath) return false;

    const ext = result.filePath.split('.').pop()?.toLowerCase();
    let content = '';

    if (ext === 'csv') {
      content = 'word,meaning\napple,苹果\nbanana,香蕉\ncomputer,电脑';
    } else if (ext === 'json') {
      content = JSON.stringify([
        { word: 'apple', meaning: '苹果' },
        { word: 'banana', meaning: '香蕉' },
        { word: 'computer', meaning: '电脑' }
      ], null, 2);
    } else if (ext === 'txt') {
      content = 'apple 苹果\nbanana 香蕉\ncomputer 电脑';
    }

    try {
      fs.writeFileSync(result.filePath, content, 'utf-8');
      return true;
    } catch (error) {
      console.error('Failed to save template:', error);
      return false;
    }
  });

  ipcMain.handle(IPC_CHANNELS.WORDBOOK_REMOVE_WORD, (_, bookId: number, wordId: number) => {
    bookRepo.removeWord(bookId, wordId);
    broadcastPlaybackForBook(bookId);
    return bookRepo.getWordsInBook(bookId);
  });

  // Init deepseek if key exists
  const settings = settingsManager.getAll();
  if (settings.deepseek.apiKey) {
    deepseekService.init(settings.deepseek.apiKey, settings.deepseek.baseUrl);
  }

  function broadcastPlaybackForBook(bookId: number): void {
    const book = bookRepo.getById(bookId);
    if (!book) return;

    const words = bookRepo.getWordsInBook(bookId);
    BrowserWindow.getAllWindows().forEach(win => {
      win.webContents.send(IPC_CHANNELS.PLAYBACK_UPDATE, {
        bookId,
        bookName: book.name,
        words
      });
    });
  }
}
