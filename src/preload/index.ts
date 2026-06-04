import { contextBridge, ipcRenderer } from 'electron';
import { IPC_CHANNELS, DockChangeEvent, WordBookCreateInput } from '../shared/types';

contextBridge.exposeInMainWorld('electronAPI', {
  // Settings
  getSettings: () => ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_GET),
  updateSettings: (partial: any) => ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_UPDATE, partial),
  
  // Windows
  openWordDetail: (wordId: number) => ipcRenderer.invoke(IPC_CHANNELS.WINDOW_OPEN_DETAIL, wordId),
  openWordBookWindow: () => ipcRenderer.invoke(IPC_CHANNELS.WINDOW_OPEN_WORDBOOK),
  
  // Playback
  togglePlayback: () => ipcRenderer.invoke(IPC_CHANNELS.PLAYBACK_TOGGLE),
  getWordDetail: (wordId: number) => ipcRenderer.invoke(IPC_CHANNELS.WORDS_GET_DETAIL, wordId),
  setIgnoreMouseEvents: (ignore: boolean, options?: any) => ipcRenderer.send(IPC_CHANNELS.WINDOW_SET_IGNORE_MOUSE_EVENTS, ignore, options),

  // Word books
  listWordBooks: () => ipcRenderer.invoke(IPC_CHANNELS.WORDBOOK_LIST),
  createWordBook: (input: WordBookCreateInput) => ipcRenderer.invoke(IPC_CHANNELS.WORDBOOK_CREATE, input),
  deleteWordBook: (bookId: number) => ipcRenderer.invoke(IPC_CHANNELS.WORDBOOK_DELETE, bookId),
  setActiveWordBook: (bookId: number) => ipcRenderer.invoke(IPC_CHANNELS.WORDBOOK_SET_ACTIVE, bookId),
  getWordsInBook: (bookId: number) => ipcRenderer.invoke(IPC_CHANNELS.WORDBOOK_GET_WORDS, bookId),
  importWordsToBook: (bookId: number) => ipcRenderer.invoke(IPC_CHANNELS.WORDBOOK_IMPORT, bookId),
  downloadImportTemplate: () => ipcRenderer.invoke(IPC_CHANNELS.WORDBOOK_DOWNLOAD_TEMPLATE),
  removeWordFromBook: (bookId: number, wordId: number) => ipcRenderer.invoke(IPC_CHANNELS.WORDBOOK_REMOVE_WORD, bookId, wordId),
  
  // Listeners
  onDockChanged: (callback: (data: DockChangeEvent) => void) => {
    const handler = (_event: any, data: DockChangeEvent) => callback(data);
    ipcRenderer.on(IPC_CHANNELS.DOCK_CHANGED, handler);
    return () => ipcRenderer.removeListener(IPC_CHANNELS.DOCK_CHANGED, handler);
  },
  
  onPlaybackUpdate: (callback: (data: any) => void) => {
    const handler = (_event: any, data: any) => callback(data);
    ipcRenderer.on(IPC_CHANNELS.PLAYBACK_UPDATE, handler);
    return () => ipcRenderer.removeListener(IPC_CHANNELS.PLAYBACK_UPDATE, handler);
  },

  onWordAdded: (callback: (data: any) => void) => {
    const handler = (_event: any, data: any) => callback(data);
    ipcRenderer.on(IPC_CHANNELS.PLAYBACK_WORD_ADDED, handler);
    return () => ipcRenderer.removeListener(IPC_CHANNELS.PLAYBACK_WORD_ADDED, handler);
  },

  onSettingsUpdate: (callback: (data: any) => void) => {
    const handler = (_event: any, data: any) => callback(data);
    ipcRenderer.on(IPC_CHANNELS.SETTINGS_UPDATE, handler);
    return () => ipcRenderer.removeListener(IPC_CHANNELS.SETTINGS_UPDATE, handler);
  }
});
