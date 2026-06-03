import Store from 'electron-store';
import { AppSettings, DEFAULT_SETTINGS } from '@shared/types';

export class SettingsManager {
  private store: Store<AppSettings>;
  
  constructor() {
    this.store = new Store<AppSettings>({
      name: 'settings',
      defaults: DEFAULT_SETTINGS,
    });
  }

  get<K extends keyof AppSettings>(key: K): AppSettings[K] {
    return this.store.get(key);
  }

  set<K extends keyof AppSettings>(key: K, value: AppSettings[K]): void {
    this.store.set(key, value);
  }

  getAll(): AppSettings {
    return this.store.store;
  }

  update(partial: Partial<AppSettings>): void {
    const current = this.getAll();
    this.store.set({ ...current, ...partial });
  }

  reset(): void {
    this.store.clear();
    this.store.set(DEFAULT_SETTINGS);
  }
}

export const settingsManager = new SettingsManager();
