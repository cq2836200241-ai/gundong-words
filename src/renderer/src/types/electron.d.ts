import { AppSettings, DockChangeEvent, Word, WordBook } from '@shared/types';

export interface ElectronAPI {
  getSettings: () => Promise<AppSettings>;
  openWordDetail: (wordId: number) => Promise<void>;
  
  onDockChanged: (callback: (data: DockChangeEvent) => void) => () => void;
  onPlaybackUpdate: (callback: (data: { bookId: number; bookName: string; words: Word[] }) => void) => () => void;
  onWordAdded: (callback: (data: { word: Word; bookId: number }) => void) => () => void;
  onSettingsUpdate: (callback: (data: Partial<AppSettings>) => void) => () => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};
