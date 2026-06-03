import Database from 'better-sqlite3';
import { app } from 'electron';
import path from 'path';
import fs from 'fs';

class DatabaseManager {
  private db: Database.Database | null = null;

  init() {
    const userDataPath = app.getPath('userData');
    const dbPath = path.join(userDataPath, 'scrolling-words.db');
    
    // Create database instance
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');

    // Run schema
    const schemaPath = path.join(__dirname, '../../src/main/database/schema.sql');
    if (fs.existsSync(schemaPath)) {
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      this.db.exec(schemaSql);
      
      // Insert demo words if empty
      const bookCount = this.db.prepare('SELECT COUNT(*) as count FROM word_books').get() as { count: number };
      if (bookCount.count === 0) {
        this.db.exec(`
          INSERT INTO word_books (id, name, description, is_active, word_count) VALUES (1, '演示词库', '系统自带', 1, 3);
          INSERT INTO words (id, word, meaning, phonetic, part_of_speech, source, is_enriched) VALUES 
          (1, 'Gravity', '重力；引力', 'ˈgrævɪti', 'n.', 'demo', 1),
          (2, 'Universe', '宇宙', 'ˈjuːnɪvɜːrs', 'n.', 'demo', 1),
          (3, 'Fascinating', '迷人的', 'ˈfæsɪneɪtɪŋ', 'adj.', 'demo', 1);
          INSERT INTO word_book_items (book_id, word_id) VALUES (1, 1), (1, 2), (1, 3);
        `);
      }
    } else {
      // Fallback for production if schema.sql isn't packaged properly, though we should configure electron-vite to bundle it.
      // For now, we will rely on it being available in dev or we execute inline.
      console.warn("schema.sql not found at " + schemaPath);
    }
  }

  getDb(): Database.Database {
    if (!this.db) {
      throw new Error("Database not initialized");
    }
    return this.db;
  }
}

export const dbManager = new DatabaseManager();
