import { AppSettings, DockChangeEvent, ImportResult, Word, WordBook, WordBookCreateInput } from '@shared/types';

export interface ElectronAPI {
  getSettings: () => Promise<AppSettings>;
  updateSettings: (partial: Partial<AppSettings>) => Promise<void>;
  openWordDetail: (wordId: number) => Promise<void>;
  openWordBookWindow: () => Promise<void>;
  togglePlayback: () => Promise<void>;
  getWordDetail: (wordId: number) => Promise<Word>;
  setIgnoreMouseEvents: (ignore: boolean, options?: any) => void;
  listWordBooks: () => Promise<WordBook[]>;
  createWordBook: (input: WordBookCreateInput) => Promise<WordBook[]>;
  deleteWordBook: (bookId: number) => Promise<WordBook[]>;
  setActiveWordBook: (bookId: number) => Promise<WordBook[]>;
  getWordsInBook: (bookId: number) => Promise<Word[]>;
  importWordsToBook: (bookId: number) => Promise<ImportResult | null>;
  downloadImportTemplate: (type?: string) => Promise<boolean>;
  removeWordFromBook: (bookId: number, wordId: number) => Promise<Word[]>;
  
  onDockChanged: (callback: (data: DockChangeEvent) => void) => () => void;
  onPlaybackUpdate: (callback: (data: { bookId: number; bookName: string; words: Word[] }) => void) => () => void;
  onPlaybackToggle: (callback: (data: { isPaused: boolean }) => void) => () => void;
  onWordAdded: (callback: (data: { word: Word; bookId: number }) => void) => () => void;
  onSettingsUpdate: (callback: (data: Partial<AppSettings>) => void) => () => void;
  onWordEnriched: (callback: (data: { wordId: number; word: Word }) => void) => () => void;
  sendPlaybackProgress: (progress: number) => void;
  onPlaybackProgress: (callback: (data: any) => void) => () => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};
