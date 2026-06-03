import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Word } from '@shared/types';
import { WordDetail } from './WordDetail';

export function DetailApp() {
  const [word, setWord] = useState<Word | null>(null);

  useEffect(() => {
    // In a real implementation we might get wordId from query params
    // For now we assume IPC fetch on open or pushed directly
    // const params = new URLSearchParams(window.location.search);
    // const wordId = params.get('id');
    // if(wordId) window.electronAPI.getWordDetail(Number(wordId)).then(setWord);
    
    // Stubbing a word for display until full IPC is linked
    setWord({
      id: 1,
      word: 'Loading...',
      phonetic: '',
      meaning: 'Waiting for data',
      partOfSpeech: '',
      examples: [],
      synonyms: [],
      antonyms: [],
      source: 'manual',
      isEnriched: true,
      createdAt: '',
      updatedAt: ''
    });
  }, []);

  if (!word) return null;

  return (
    <motion.div 
      className="detail-wrapper"
      initial={{ y: 20, opacity: 0 }} 
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <WordDetail word={word} />
    </motion.div>
  );
}
