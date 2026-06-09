import Parser from 'rss-parser';
import { WordBookRepository } from '../database/wordBookRepository';
import { WordRepository } from '../database/wordRepository';
import { BrowserWindow } from 'electron';
import { IPC_CHANNELS } from '@shared/types';
import { dbManager } from '../database/db';

const parser = new Parser();

export class GithubFeedService {
  private bookRepo = new WordBookRepository();
  private wordRepo = new WordRepository();
  private readonly FEED_URL = 'https://rsshub.rssforever.com/github/trending/daily/any';
  private readonly BOOK_NAME = '💻 GitHub 每日热门';
  private timer: NodeJS.Timeout | null = null;
  private isFetching = false;

  constructor() {}

  async start() {
    let books = this.bookRepo.getAll();
    let githubBook = books.find(b => b.name === this.BOOK_NAME);
    
    if (!githubBook) {
      githubBook = this.bookRepo.create({
        name: this.BOOK_NAME,
        description: '自动抓取每日 GitHub 热门开源项目',
        type: 'news'
      });
    }

    // Fetch immediately on startup
    await this.fetchAndStore();

    // Schedule fetching every 12 hours
    this.timer = setInterval(() => {
      this.fetchAndStore();
    }, 12 * 60 * 60 * 1000);
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
      console.log(`[GitHub] Fetching RSS feed from ${this.FEED_URL}`);
      const feed = await parser.parseURL(this.FEED_URL);
      
      const githubBook = this.bookRepo.getAll().find(b => b.name === this.BOOK_NAME);
      if (!githubBook) {
        this.isFetching = false;
        return;
      }

      let newItemsCount = 0;

      for (const item of feed.items.reverse()) {
        const title = item.title?.trim();
        let content = item.contentSnippet || item.content || item.pubDate || '';
        
        // Remove HTML tags often inserted by RSSHub
        content = content.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();

        if (!title) continue;

        let word = this.wordRepo.findByWord(title);
        if (!word) {
          word = this.wordRepo.create({
            word: title,
            meaning: content,
            source: 'aihot' // Using aihot source tag so they both get auto cleaned up
          });
        } else {
          this.wordRepo.update(word.id, { meaning: content });
        }

        this.bookRepo.addWord(githubBook.id, word.id);
        newItemsCount++;
      }

      console.log(`[GitHub] Fetch completed. Inserted/Ensured items: ${newItemsCount}`);

      this.cleanupOldWords(githubBook.id);

      const activeBook = this.bookRepo.getActiveBook();
      if (activeBook && activeBook.id === githubBook.id) {
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
      console.error(`[GitHub] Failed to fetch feed:`, e);
    } finally {
      this.isFetching = false;
    }
  }

  private cleanupOldWords(bookId: number) {
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
      this.bookRepo.updateWordCount(bookId);
    } catch (e) {
      console.error(`[GitHub] Failed to clean up old words:`, e);
    }
  }
}
