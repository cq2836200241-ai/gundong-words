import { WordBookRepository } from '../database/wordBookRepository';
import { WordRepository } from '../database/wordRepository';
import { enrichmentQueue } from './wordEnrichment';
import { Word } from '@shared/types';
import { BrowserWindow } from 'electron';
import { IPC_CHANNELS } from '@shared/types';

export class WordBookPlaybackService {
  private bookRepo = new WordBookRepository();
  private wordRepo = new WordRepository();
  private paused: boolean = false;

  isPaused(): boolean {
    return this.paused;
  }

  togglePause(): void {
    this.paused = !this.paused;
    BrowserWindow.getAllWindows().forEach(win => {
      win.webContents.send(IPC_CHANNELS.PLAYBACK_TOGGLE, { isPaused: this.paused });
    });
  }

  async addWordToActiveBook(wordText: string): Promise<Word | null> {
    let activeBook = this.bookRepo.getActiveBook();
    if (!activeBook) {
      activeBook = this.bookRepo.create({ name: '我的收藏', description: '默认收藏夹' });
      this.bookRepo.setActive(activeBook.id);
    }

    const word = this.wordRepo.create({ word: wordText, source: 'capture' });
    this.bookRepo.addWord(activeBook.id, word.id);

    if (!word.isEnriched) {
      enrichmentQueue.add(word.id);
    }

    // Broadcast newly added word to the scroll bar
    BrowserWindow.getAllWindows().forEach(win => {
      win.webContents.send(IPC_CHANNELS.PLAYBACK_WORD_ADDED, { word, bookId: activeBook!.id });
    });

    return word;
  }

  async setActiveBook(bookId: number): Promise<void> {
    this.bookRepo.setActive(bookId);
    await this.refresh();
  }

  async refresh(): Promise<void> {
    const activeBook = this.bookRepo.getActiveBook();
    if (!activeBook) return;

    const words = this.bookRepo.getWordsInBook(activeBook.id);
    BrowserWindow.getAllWindows().forEach(win => {
      win.webContents.send(IPC_CHANNELS.PLAYBACK_UPDATE, { bookId: activeBook.id, bookName: activeBook.name, words });
    });
  }
}
