import { deepseekService } from './deepseekService';
import { WordRepository } from '../database/wordRepository';
import { BrowserWindow } from 'electron';
import { IPC_CHANNELS } from '@shared/types';

export class EnrichmentQueue {
  private queue: { wordId: number; bookType: string }[] = [];
  private isProcessing: boolean = false;
  private wordRepo = new WordRepository();

  add(wordId: number, bookType: string = 'english') {
    if (!this.queue.some(item => item.wordId === wordId)) {
      this.queue.push({ wordId, bookType });
    }
    this.processQueue();
  }

  private async processQueue() {
    if (this.isProcessing || this.queue.length === 0) return;
    if (!deepseekService.isConfigured()) return; // Skip if no API key

    this.isProcessing = true;

    while (this.queue.length > 0) {
      const { wordId, bookType } = this.queue.shift()!;
      const word = this.wordRepo.getById(wordId);
      
      if (word && !word.isEnriched) {
        const result = await deepseekService.enrichWord(word.word, bookType);
        if (result) {
          this.wordRepo.update(wordId, {
            phonetic: result.phonetic,
            meaning: result.meaning,
            partOfSpeech: result.part_of_speech,
            examples: result.examples,
            synonyms: result.synonyms,
            antonyms: result.antonyms,
            isEnriched: true
          });

          // Notify renderer with the full updated word data
          const updatedWord = this.wordRepo.getById(wordId);
          BrowserWindow.getAllWindows().forEach(win => {
            win.webContents.send(IPC_CHANNELS.WORD_ENRICHED, { wordId, word: updatedWord });
          });
        }
      }
      
      // Delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    this.isProcessing = false;
  }
}

export const enrichmentQueue = new EnrichmentQueue();
