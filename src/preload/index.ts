import { contextBridge, ipcRenderer } from 'electron';
import { IPC_CHANNELS, DockChangeEvent } from '../shared/types';

contextBridge.exposeInMainWorld('electronAPI', {
  // Settings
  getSettings: () => ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_GET),
  
  // Windows
  openWordDetail: (wordId: number) => ipcRenderer.invoke(IPC_CHANNELS.WINDOW_OPEN_DETAIL, wordId),
  
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
