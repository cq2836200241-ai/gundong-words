import { deepseekService } from './deepseekService';
import { WordRepository } from '../database/wordRepository';
import { BrowserWindow } from 'electron';
import { IPC_CHANNELS } from '@shared/types';

export class EnrichmentQueue {
  private queue: number[] = [];
  private isProcessing: boolean = false;
  private wordRepo = new WordRepository();

  add(wordId: number) {
    if (!this.queue.includes(wordId)) {
      this.queue.push(wordId);
    }
    this.processQueue();
  }

  private async processQueue() {
    if (this.isProcessing || this.queue.length === 0) return;
    if (!deepseekService.isConfigured()) return; // Skip if no API key

    this.isProcessing = true;

    while (this.queue.length > 0) {
      const wordId = this.queue.shift()!;
      const word = this.wordRepo.getById(wordId);
      
      if (word && !word.isEnriched) {
        const result = await deepseekService.enrichWord(word.word);
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

          // Notify renderer about the update
          BrowserWindow.getAllWindows().forEach(win => {
            win.webContents.send(IPC_CHANNELS.WORD_ENRICHED, { wordId });
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
