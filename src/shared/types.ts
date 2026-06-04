// === Dock System ===
export type DockPosition = 'top' | 'left' | 'right';
export type ScrollOrientation = 'horizontal' | 'vertical';
export type ScrollDirection = 'forward' | 'reverse';

export interface DockConfig {
  position: DockPosition;
  thickness: number; // px, 默认: top 为 40, left/right 为 55
}

export interface DockChangeEvent {
  position: DockPosition;
  orientation: ScrollOrientation;
  dimensions: { width: number; height: number };
}

// === Word System ===
export interface Word {
  id: number;
  word: string;
  phonetic: string | null;
  meaning: string | null;
  partOfSpeech: string | null;
  examples: ExampleSentence[] | null;
  synonyms: string[] | null;
  antonyms: string[] | null;
  source: 'import' | 'capture' | 'manual';
  isEnriched: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ExampleSentence {
  en: string;
  zh: string;
}

export interface WordCreateInput {
  word: string;
  meaning?: string;
  phonetic?: string;
  source: 'import' | 'capture' | 'manual';
}

// === Word Book System ===
export interface WordBook {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
  wordCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface WordBookCreateInput {
  name: string;
  description?: string;
}

export interface ImportResult {
  total: number;
  imported: number;
  skipped: number;
  errors: string[];
}

// === Settings ===
export interface AppSettings {
  dock: {
    position: DockPosition;
    thickness: number;
  };
  scroll: {
    direction: ScrollDirection;
    speed: number; // 0.5 - 3.0, default 1.0
  };
  font: {
    wordSize: number; // px, default 16
    meaningSize: number; // px, default 13
  };
  theme: {
    backgroundColor: string;
    backgroundOpacity: number;
  };
  hotkey: {
    captureKey: string; // default 'W+Space'
  };
  deepseek: {
    apiKey: string;
    baseUrl: string; // default 'https://api.deepseek.com'
    model: string; // default 'deepseek-chat'
  };
  activeBookId: number | null;
}

export const DEFAULT_SETTINGS: AppSettings = {
  dock: { position: 'top', thickness: 40 },
  scroll: { direction: 'forward', speed: 1.0 },
  font: { wordSize: 16, meaningSize: 13 },
  theme: { backgroundColor: '#000000', backgroundOpacity: 0.85 },
  hotkey: { captureKey: 'W+Space' },
  deepseek: { apiKey: '', baseUrl: 'https://api.deepseek.com', model: 'deepseek-chat' },
  activeBookId: null
};

// === IPC Channel Names ===
export const IPC_CHANNELS = {
  DOCK_CHANGED: 'dock:changed',
  DOCK_SWITCH: 'dock:switch',
  PLAYBACK_UPDATE: 'playback:update',
  PLAYBACK_TOGGLE: 'playback:toggle',
  PLAYBACK_WORD_ADDED: 'playback:word-added',
  WORD_ENRICHED: 'word:enriched',
  WORDS_GET_DETAIL: 'words:getDetail',
  WORDBOOK_LIST: 'wordbook:list',
  WORDBOOK_CREATE: 'wordbook:create',
  WORDBOOK_DELETE: 'wordbook:delete',
  WORDBOOK_SET_ACTIVE: 'wordbook:setActive',
  WORDBOOK_IMPORT: 'wordbook:import',
  WORDBOOK_DOWNLOAD_TEMPLATE: 'wordbook:download-template',
  WORDBOOK_GET_WORDS: 'wordbook:getWords',
  WORDBOOK_ADD_WORD: 'wordbook:addWord',
  WORDBOOK_REMOVE_WORD: 'wordbook:removeWord',
  SETTINGS_GET: 'settings:get',
  SETTINGS_UPDATE: 'settings:update',
  SETTINGS_SET: 'settings:set',
  TTS_PLAY: 'tts:play',
  WINDOW_OPEN_DETAIL: 'window:open-detail',
  WINDOW_OPEN_WORDBOOK: 'window:open-wordbook',
  WINDOW_OPEN_SETTINGS: 'window:open-settings',
  WINDOW_SET_IGNORE_MOUSE_EVENTS: 'window:set-ignore-mouse-events',
} as const;
