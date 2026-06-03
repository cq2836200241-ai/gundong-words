import * as fs from 'fs';
import { WordCreateInput } from '@shared/types';
import { WordRepository } from '../database/wordRepository';
import { WordBookRepository } from '../database/wordBookRepository';

export interface ImportResult {
  total: number;
  imported: number;
  skipped: number;
  errors: string[];
}

export class ImportService {
  private wordRepo = new WordRepository();
  private bookRepo = new WordBookRepository();

  async importFromFile(filePath: string, bookId: number): Promise<ImportResult> {
    const result: ImportResult = { total: 0, imported: 0, skipped: 0, errors: [] };
    
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const ext = filePath.split('.').pop()?.toLowerCase();
      
      let inputs: WordCreateInput[] = [];
      if (ext === 'json') {
        inputs = this.parseJSON(content);
      } else if (ext === 'csv') {
        inputs = this.parseCSV(content);
      } else {
        inputs = this.parseTXT(content);
      }

      result.total = inputs.length;

      for (const input of inputs) {
        try {
          // In real app, we might check if word already exists in book
          const word = this.wordRepo.create(input);
          this.bookRepo.addWord(bookId, word.id);
          result.imported++;
        } catch (e: any) {
          result.skipped++;
          result.errors.push(`Failed to import word: ${input.word} - ${e.message}`);
        }
      }

    } catch (error: any) {
      result.errors.push(`File read error: ${error.message}`);
    }

    return result;
  }

  private parseJSON(content: string): WordCreateInput[] {
    const data = JSON.parse(content);
    if (!Array.isArray(data)) return [];
    
    return data.map(item => ({
      word: item.word || item.name || '',
      meaning: item.meaning || item.translation || '',
      source: 'import'
    })).filter(w => w.word.trim().length > 0);
  }

  private parseCSV(content: string): WordCreateInput[] {
    // Basic CSV parser
    const lines = content.split(/\r?\n/);
    const result: WordCreateInput[] = [];
    
    for (const line of lines) {
      if (!line.trim()) continue;
      const parts = line.split(',');
      if (parts[0]) {
        result.push({
          word: parts[0].trim(),
          meaning: parts[1]?.trim() || '',
          source: 'import'
        });
      }
    }
    return result;
  }

  private parseTXT(content: string): WordCreateInput[] {
    const lines = content.split(/\r?\n/);
    const result: WordCreateInput[] = [];
    
    for (const line of lines) {
      if (!line.trim()) continue;
      // Split by first space/tab
      const match = line.match(/^([a-zA-Z\-]+)[\s\t]+(.*)$/);
      if (match) {
        result.push({
          word: match[1].trim(),
          meaning: match[2].trim(),
          source: 'import'
        });
      } else {
        // Just the word
        result.push({
          word: line.trim(),
          source: 'import'
        });
      }
    }
    return result;
  }
}
