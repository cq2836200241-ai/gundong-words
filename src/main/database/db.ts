import Database from 'better-sqlite3';
import { app } from 'electron';
import path from 'path';
import fs from 'fs';

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS words (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  word TEXT NOT NULL UNIQUE COLLATE NOCASE,
  phonetic TEXT,
  meaning TEXT,
  part_of_speech TEXT,
  examples TEXT,
  synonyms TEXT,
  antonyms TEXT,
  source TEXT DEFAULT 'manual',
  is_enriched BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_words_word ON words(word);
CREATE INDEX IF NOT EXISTS idx_words_is_enriched ON words(is_enriched);

CREATE TABLE IF NOT EXISTS word_books (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT 0,
  word_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS word_book_items (
  book_id INTEGER NOT NULL,
  word_id INTEGER NOT NULL,
  sort_order INTEGER DEFAULT 0,
  added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (book_id, word_id),
  FOREIGN KEY (book_id) REFERENCES word_books(id) ON DELETE CASCADE,
  FOREIGN KEY (word_id) REFERENCES words(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_word_book_items_word ON word_book_items(word_id);
`;

class DatabaseManager {
  private db: Database.Database | null = null;

  init() {
    const userDataPath = app.getPath('userData');
    const dbPath = path.join(userDataPath, 'scrolling-words.db');
    
    // Create database instance
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');

    const schemaSql = this.loadSchema();
    this.db.exec(schemaSql);
    this.ensureDemoData();
  }

  getDb(): Database.Database {
    if (!this.db) {
      throw new Error("Database not initialized");
    }
    return this.db;
  }

  private loadSchema(): string {
    const candidates = [
      path.join(app.getAppPath(), 'src/main/database/schema.sql'),
      path.join(process.cwd(), 'src/main/database/schema.sql'),
      path.join(__dirname, '../../src/main/database/schema.sql')
    ];

    const schemaPath = candidates.find((candidate) => fs.existsSync(candidate));
    if (!schemaPath) {
      console.warn('schema.sql not found; using bundled schema fallback.');
      return SCHEMA_SQL;
    }

    return fs.readFileSync(schemaPath, 'utf8');
  }

  private ensureDemoData(): void {
    if (!this.db) return;

    const bookCount = this.db.prepare('SELECT COUNT(*) as count FROM word_books').get() as { count: number };
    if (bookCount.count > 0) return;

    this.db.exec(`
      INSERT INTO word_books (id, name, description, is_active, word_count) VALUES (1, '演示词库', '系统自带', 1, 3);
      INSERT INTO words (id, word, meaning, phonetic, part_of_speech, source, is_enriched) VALUES 
      (1, 'Gravity', '重力；引力', 'ˈgrævɪti', 'n.', 'manual', 1),
      (2, 'Universe', '宇宙', 'ˈjuːnɪvɜːrs', 'n.', 'manual', 1),
      (3, 'Fascinating', '迷人的', 'ˈfæsɪneɪtɪŋ', 'adj.', 'manual', 1);
      INSERT INTO word_book_items (book_id, word_id) VALUES (1, 1), (1, 2), (1, 3);
    `);
  }
}

export const dbManager = new DatabaseManager();
