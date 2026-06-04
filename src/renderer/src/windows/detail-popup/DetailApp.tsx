import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Word } from '@shared/types';
import { WordDetail } from './WordDetail';

export function DetailApp() {
  const [word, setWord] = useState<Word | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const wordId = params.get('id');
    
    if (wordId) {
      window.electronAPI?.getWordDetail(Number(wordId)).then((data: Word) => {
        setWord(data);
      });
    } else {
      setWord({
        id: -1,
        word: 'Error',
        phonetic: '',
        meaning: 'Word ID not found',
        partOfSpeech: '',
        examples: [],
        synonyms: [],
        antonyms: [],
        source: 'manual',
        isEnriched: true,
        createdAt: '',
        updatedAt: ''
      });
    }
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
