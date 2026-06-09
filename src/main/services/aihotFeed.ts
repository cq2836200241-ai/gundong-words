import Parser from 'rss-parser';
import { WordBookRepository } from '../database/wordBookRepository';
import { WordRepository } from '../database/wordRepository';
import { BrowserWindow } from 'electron';
import { IPC_CHANNELS } from '@shared/types';
import { dbManager } from '../database/db';

const parser = new Parser();

export class AihotFeedService {
  private bookRepo = new WordBookRepository();
  private wordRepo = new WordRepository();
  private readonly FEED_URL = 'https://aihot.virxact.com/feed.xml';
  private readonly BOOK_NAME = '📰 AIHOT 实时资讯';
  private timer: NodeJS.Timeout | null = null;
  private isFetching = false;

  constructor() {}

  async start() {
    // Ensure the special word book exists
    let books = this.bookRepo.getAll();
    let aihotBook = books.find(b => b.name === this.BOOK_NAME);
    
    if (!aihotBook) {
      aihotBook = this.bookRepo.create({
        name: this.BOOK_NAME,
        description: '自动同步最新的 AIHOT 资讯',
        type: 'news' // A special type so we can distinguish if needed
      });
    }

    // Fetch immediately on startup
    await this.fetchAndStore();

    // Schedule fetching every 1 hour (3600000 ms)
    this.timer = setInterval(() => {
      this.fetchAndStore();
    }, 60 * 60 * 1000);
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  async fetchAndStore() {
    if (this.isFetching) return;
    this.isFetching = true;

    try {
      console.log(`[AIHOT] Fetching RSS feed from ${this.FEED_URL}`);
      const feed = await parser.parseURL(this.FEED_URL);
      
      const aihotBook = this.bookRepo.getAll().find(b => b.name === this.BOOK_NAME);
      if (!aihotBook) {
        this.isFetching = false;
        return;
      }

      let newItemsCount = 0;

      // We traverse in reverse to insert oldest first so that ORDER BY added_at DESC makes the newest on top.
      for (const item of feed.items.reverse()) {
        const title = item.title?.trim();
        let content = item.contentSnippet || item.content || item.pubDate || '';
        
        // Clean up content to be shorter for scrollbar (max ~60 chars)
        content = content.replace(/\n/g, ' ').trim();

        if (!title) continue;

        // Ensure this 'word' exists
        let word = this.wordRepo.findByWord(title);
        if (!word) {
          word = this.wordRepo.create({
            word: title,
            meaning: content,
            source: 'aihot'
          });
        } else {
          // Update the existing word so that previously truncated text gets the full text
          this.wordRepo.update(word.id, { meaning: content });
        }

        // Add to book if not already in it
        // addWord ignores primary key constraints (duplicate book/word links)
        this.bookRepo.addWord(aihotBook.id, word.id);
        newItemsCount++;
      }

      console.log(`[AIHOT] Fetch completed. Inserted/Ensured items: ${newItemsCount}`);

      // Auto cleanup: Keep only the latest 200 items
      this.cleanupOldWords(aihotBook.id);

      // If this book is currently active, notify windows to refresh playback
      const activeBook = this.bookRepo.getActiveBook();
      if (activeBook && activeBook.id === aihotBook.id) {
        const words = this.bookRepo.getWordsInBook(activeBook.id);
        BrowserWindow.getAllWindows().forEach(win => {
          win.webContents.send(IPC_CHANNELS.PLAYBACK_UPDATE, { 
            bookId: activeBook.id, 
            bookName: activeBook.name, 
            words 
          });
        });
      }

    } catch (e) {
      console.error(`[AIHOT] Failed to fetch feed:`, e);
    } finally {
      this.isFetching = false;
    }
  }

  private cleanupOldWords(aihotBookId: number) {
    try {
      const db = dbManager.getDb();
      const stmt = db.prepare(`
        DELETE FROM words 
        WHERE source = 'aihot' 
          AND id NOT IN (
            SELECT id FROM words 
            WHERE source = 'aihot' 
            ORDER BY id DESC 
            LIMIT 200
          )
      `);
      stmt.run();
      // Update the word count for the book after deletion
      this.bookRepo.updateWordCount(aihotBookId);
    } catch (e) {
      console.error(`[AIHOT] Failed to clean up old words:`, e);
    }
  }
}
