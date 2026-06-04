import { motion } from 'framer-motion';
import { Word } from '@shared/types';
import { useRef, useLayoutEffect, useState } from 'react';

export function WordItem({ word, orientation }: { word: Word; orientation: string }) {
  const textRef = useRef<HTMLSpanElement>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    if (textRef.current && orientation === 'vertical') {
      const textEl = textRef.current;
      const scrollW = textEl.scrollWidth;
      const clientW = textEl.clientWidth;
      
      if (scrollW > clientW && clientW > 0) {
        setScale(clientW / scrollW);
      } else {
        setScale(1);
      }
    } else {
      setScale(1);
    }
  }, [word.word, orientation]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.electronAPI) return;
    void window.electronAPI.openWordDetail(word.id);
  };

  return (
    <motion.div 
      className={`word-item ${orientation}`}
      onClick={handleClick}
      onMouseEnter={() => window.electronAPI?.setIgnoreMouseEvents?.(false)}
      onMouseLeave={() => window.electronAPI?.setIgnoreMouseEvents?.(true, { forward: true })}
      whileHover={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
      // Flash effect if newly captured/imported
      initial={word.source === 'capture' ? { backgroundColor: 'rgba(255,200,0,0.5)' } : {}}
      animate={{ backgroundColor: 'rgba(255,255,255,0)' }}
      transition={{ duration: 1.5 }}
    >
      <span 
        className="word-text" 
        ref={textRef}
        style={{ 
          transform: `scale(${scale})`, 
          transformOrigin: 'center center',
          display: 'inline-block'
        }}
      >
        {word.word}
      </span>
      {word.meaning && <span className="meaning-text">{word.meaning}</span>}
    </motion.div>
  );
}
