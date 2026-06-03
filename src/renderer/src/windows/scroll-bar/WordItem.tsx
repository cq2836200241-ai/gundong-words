import { motion } from 'framer-motion';
import { Word } from '@shared/types';

export function WordItem({ word, orientation }: { word: Word; orientation: string }) {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.electronAPI.openWordDetail(word.id);
  };

  return (
    <motion.div 
      className={`word-item ${orientation}`}
      onClick={handleClick}
      whileHover={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
      // Flash effect if newly captured/imported
      initial={word.source === 'capture' ? { backgroundColor: 'rgba(255,200,0,0.5)' } : {}}
      animate={{ backgroundColor: 'rgba(255,255,255,0)' }}
      transition={{ duration: 1.5 }}
    >
      <span className="word-text">{word.word}</span>
      {word.meaning && <span className="meaning-text">{word.meaning}</span>}
    </motion.div>
  );
}
