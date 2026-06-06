import { dbManager } from './db';
import { WordBook, WordBookCreateInput, Word } from '@shared/types';
import { WordRepository } from './wordRepository';

const wordRepo = new WordRepository();

export class WordBookRepository {
  getAll(): WordBook[] {
    const db = dbManager.getDb();
    const rows = db.prepare('SELECT * FROM word_books ORDER BY id DESC').all() as any[];
    return rows.map(r => this.parseRow(r));
  }

  getById(id: number): WordBook | null {
    const db = dbManager.getDb();
    const row = db.prepare('SELECT * FROM word_books WHERE id = ?').get(id) as any;
    return row ? this.parseRow(row) : null;
  }

  create(input: WordBookCreateInput): WordBook {
    const db = dbManager.getDb();
    const stmt = db.prepare('INSERT INTO word_books (name, description, type) VALUES (?, ?, ?)');
    const info = stmt.run(input.name, input.description || null, input.type || 'english');
    return this.getById(info.lastInsertRowid as number)!;
  }

  delete(id: number): void {
    const db = dbManager.getDb();
    db.prepare('DELETE FROM word_books WHERE id = ?').run(id);
  }

  setActive(bookId: number): void {
    const db = dbManager.getDb();
    const deactivate = db.prepare('UPDATE word_books SET is_active = 0');
    const activate = db.prepare('UPDATE word_books SET is_active = 1 WHERE id = ?');
    
    db.transaction(() => {
      deactivate.run();
      activate.run(bookId);
    })();
  }

  getActiveBook(): WordBook | null {
    const db = dbManager.getDb();
    const row = db.prepare('SELECT * FROM word_books WHERE is_active = 1 LIMIT 1').get() as any;
    return row ? this.parseRow(row) : null;
  }

  getWordsInBook(bookId: number): Word[] {
    const db = dbManager.getDb();
    const rows = db.prepare(`
      SELECT w.* FROM words w
      JOIN word_book_items i ON w.id = i.word_id
      WHERE i.book_id = ?
      ORDER BY i.added_at DESC
    `).all(bookId) as any[];
    
    // We re-use parser logic
    // A quick hack is mapping through repo, but we need the parser exposed or repeated.
    return rows.map(row => ({
      id: row.id,
      word: row.word,
      phonetic: row.phonetic,
      meaning: row.meaning,
      partOfSpeech: row.part_of_speech,
      examples: row.examples ? JSON.parse(row.examples) : null,
      synonyms: row.synonyms ? JSON.parse(row.synonyms) : null,
      antonyms: row.antonyms ? JSON.parse(row.antonyms) : null,
      source: row.source,
      isEnriched: Boolean(row.is_enriched),
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  }

  addWord(bookId: number, wordId: number): void {
    const db = dbManager.getDb();
    try {
      db.prepare('INSERT INTO word_book_items (book_id, word_id) VALUES (?, ?)').run(bookId, wordId);
      this.updateWordCount(bookId);
    } catch (e: any) {
      // Ignore unique constraint error
      if (e.code !== 'SQLITE_CONSTRAINT_PRIMARYKEY') {
        throw e;
      }
    }
  }

  removeWord(bookId: number, wordId: number): void {
    const db = dbManager.getDb();
    db.prepare('DELETE FROM word_book_items WHERE book_id = ? AND word_id = ?').run(bookId, wordId);
    this.updateWordCount(bookId);
  }

  updateWordCount(bookId: number): void {
    const db = dbManager.getDb();
    db.prepare(`
      UPDATE word_books 
      SET word_count = (SELECT COUNT(*) FROM word_book_items WHERE book_id = ?) 
      WHERE id = ?
    `).run(bookId, bookId);
  }

  private parseRow(row: any): WordBook {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      type: row.type || 'english',
      isActive: Boolean(row.is_active),
      wordCount: row.word_count,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}
