import { dbManager } from './db';
import { Word, WordCreateInput } from '@shared/types';

export class WordRepository {
  findByWord(wordText: string): Word | null {
    const db = dbManager.getDb();
    const row = db.prepare('SELECT * FROM words WHERE word = ? COLLATE NOCASE').get(wordText) as any;
    if (!row) return null;
    return this.parseRow(row);
  }

  create(input: WordCreateInput): Word {
    const db = dbManager.getDb();
    const existing = this.findByWord(input.word);
    if (existing) return existing;

    const isComplete = !!(input.meaning && input.phonetic && input.partOfSpeech);
    const stmt = db.prepare(`
      INSERT INTO words (word, meaning, phonetic, part_of_speech, source, is_enriched)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    const info = stmt.run(
      input.word,
      input.meaning || null,
      input.phonetic || null,
      input.partOfSpeech || null,
      input.source,
      isComplete ? 1 : 0
    );
    return this.getById(info.lastInsertRowid as number)!;
  }

  getById(id: number): Word | null {
    const db = dbManager.getDb();
    const row = db.prepare('SELECT * FROM words WHERE id = ?').get(id) as any;
    return row ? this.parseRow(row) : null;
  }

  update(id: number, data: Partial<Word>): void {
    const db = dbManager.getDb();
    const sets: string[] = [];
    const values: any[] = [];
    
    for (const [key, value] of Object.entries(data)) {
      if (key === 'id' || key === 'createdAt' || key === 'updatedAt') continue;
      
      const dbCol = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      sets.push(`${dbCol} = ?`);
      
      if (Array.isArray(value) || typeof value === 'object') {
        values.push(value ? JSON.stringify(value) : null);
      } else {
        values.push(value);
      }
    }
    
    if (sets.length === 0) return;
    
    sets.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);
    
    db.prepare(`UPDATE words SET ${sets.join(', ')} WHERE id = ?`).run(...values);
  }

  getAll(): Word[] {
    const db = dbManager.getDb();
    const rows = db.prepare('SELECT * FROM words ORDER BY id DESC').all() as any[];
    return rows.map(r => this.parseRow(r));
  }

  delete(id: number): void {
    const db = dbManager.getDb();
    db.prepare('DELETE FROM words WHERE id = ?').run(id);
  }

  private parseRow(row: any): Word {
    return {
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
    };
  }
}
