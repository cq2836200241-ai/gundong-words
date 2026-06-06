import * as fs from 'fs';
import { ImportResult, WordCreateInput } from '@shared/types';
import { WordRepository } from '../database/wordRepository';
import { WordBookRepository } from '../database/wordBookRepository';
import { enrichmentQueue } from './wordEnrichment';

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

      const book = this.bookRepo.getById(bookId);
      const bookType = book?.type || 'english';

      for (const input of inputs) {
        try {
          const word = this.wordRepo.create(input);
          this.bookRepo.addWord(bookId, word.id);
          result.imported++;

          // Queue for AI enrichment if data is incomplete
          if (!word.isEnriched) {
            enrichmentQueue.add(word.id, bookType);
          }
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

    // Support template format: { template: "...", words: [...] }
    let items: any[];
    if (data && !Array.isArray(data) && Array.isArray(data.words)) {
      items = data.words;
    } else if (Array.isArray(data)) {
      items = data;
    } else {
      return [];
    }
    
    return items.map((item): WordCreateInput => ({
      word: item.word || item.name || item['词语'] || '',
      meaning: item.meaning || item.translation || item['解释'] || item['释义'] || '',
      phonetic: item.phonetic || item['拼音'] || item['音标'] || '',
      partOfSpeech: item.partOfSpeech || item.part_of_speech || item.pos || '',
      source: 'import'
    })).filter(w => w.word.trim().length > 0);
  }

  private parseCSV(content: string): WordCreateInput[] {
    const lines = content.split(/\r?\n/).filter(l => l.trim());
    if (lines.length === 0) return [];

    const result: WordCreateInput[] = [];

    // Check if the first line is a header row
    const firstLine = lines[0].toLowerCase();
    const hasHeader = firstLine.includes('word') || firstLine.includes('phonetic') || firstLine.includes('meaning') || 
                      firstLine.includes('词语') || firstLine.includes('解释') || firstLine.includes('释义');
    
    let columnMap = { word: 0, meaning: 1, phonetic: -1, partOfSpeech: -1 };

    if (hasHeader) {
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      columnMap.word = headers.findIndex(h => h === 'word' || h === 'name' || h === '词语' || h === '单词');
      columnMap.meaning = headers.findIndex(h => h === 'meaning' || h === 'translation' || h === '释义' || h === '解释');
      columnMap.phonetic = headers.findIndex(h => h === 'phonetic' || h === '音标' || h === '拼音');
      columnMap.partOfSpeech = headers.findIndex(h => 
        h === 'partofspeech' || h === 'part_of_speech' || h === 'pos' || h === '词性'
      );
    }

    const startLine = hasHeader ? 1 : 0;

    for (let i = startLine; i < lines.length; i++) {
      const parts = this.parseCSVLine(lines[i]);
      if (parts.length === 0) continue;

      const word = columnMap.word >= 0 ? parts[columnMap.word]?.trim() : parts[0]?.trim();
      if (!word) continue;

      result.push({
        word,
        meaning: columnMap.meaning >= 0 ? parts[columnMap.meaning]?.trim() || '' : parts[1]?.trim() || '',
        phonetic: columnMap.phonetic >= 0 ? parts[columnMap.phonetic]?.trim() || '' : '',
        partOfSpeech: columnMap.partOfSpeech >= 0 ? parts[columnMap.partOfSpeech]?.trim() || '' : '',
        source: 'import'
      });
    }
    return result;
  }

  /** Parse a single CSV line, handling quoted fields (e.g. "含逗号,的释义") */
  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQuotes) {
        if (ch === '"') {
          if (i + 1 < line.length && line[i + 1] === '"') {
            current += '"';
            i++; // skip escaped quote
          } else {
            inQuotes = false;
          }
        } else {
          current += ch;
        }
      } else {
        if (ch === '"') {
          inQuotes = true;
        } else if (ch === ',') {
          result.push(current);
          current = '';
        } else {
          current += ch;
        }
      }
    }
    result.push(current);
    return result;
  }

  private parseTXT(content: string): WordCreateInput[] {
    const lines = content.split(/\r?\n/);
    const result: WordCreateInput[] = [];
    
    for (const line of lines) {
      if (!line.trim()) continue;

      // Try tab-separated first (4 columns: word, phonetic, partOfSpeech, meaning)
      const tabParts = line.split('\t');
      if (tabParts.length >= 2) {
        if (tabParts.length >= 4) {
          result.push({
            word: tabParts[0].trim(),
            phonetic: tabParts[1].trim(),
            partOfSpeech: tabParts[2].trim(),
            meaning: tabParts[3].trim(),
            source: 'import'
          });
        } else {
          // 2 columns: word + meaning
          result.push({
            word: tabParts[0].trim(),
            meaning: tabParts.slice(1).join(' ').trim(),
            source: 'import'
          });
        }
        continue;
      }

      // Fall back to space-separated
      const match = line.match(/^([a-zA-Z\-]+)[\s]+(.*)$/);
      if (match) {
        result.push({
          word: match[1].trim(),
          meaning: match[2].trim(),
          source: 'import'
        });
      } else {
        result.push({
          word: line.trim(),
          source: 'import'
        });
      }
    }
    return result;
  }
}
