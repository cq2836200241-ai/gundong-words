import { Word } from '@shared/types';
import { useRef, useLayoutEffect, useState } from 'react';

interface WordItemProps {
  word: Word;
  orientation: string;
}

export function WordItem({ word, orientation }: WordItemProps) {
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

  // Build the meaning display: "v. 放弃；抛弃" or just "放弃；抛弃"
  const meaningDisplay = [word.partOfSpeech, word.meaning].filter(Boolean).join(' ');

  return (
    <div className={`word-item ${orientation}`}>
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
      {word.phonetic && <span className="phonetic-text">{word.phonetic}</span>}
      {meaningDisplay && <span className="meaning-text">{meaningDisplay}</span>}
    </div>
  );
}
