import { useRef } from 'react';
import { useScrollAnimation } from '../../hooks/useScrollAnimation';
import { WordItem } from './WordItem';
import { Word } from '@shared/types';

interface Props {
  words: Word[];
  orientation: 'horizontal' | 'vertical';
  direction: 'forward' | 'reverse';
  speed: number;
}

export function WordTrack({ words, orientation, direction, speed }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  
  const { pause, resume } = useScrollAnimation(
    trackRef, 
    words.length, 
    orientation, 
    direction, 
    speed
  );

  if (words.length === 0) {
    return (
      <div 
        className={`empty-state ${orientation}`} 
        style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh', 
          width: orientation === 'horizontal' ? '100vw' : '100%' 
        }}
      >
        <span style={{ padding: '10px 20px', color: '#fff', background: 'rgba(0,0,0,0.6)', borderRadius: '8px' }}>
          等待加载词库 (W+Space)
        </span>
      </div>
    );
  }

  const displayWords = [...words, ...words];

  return (
    <div 
      className={`word-track ${orientation}`} 
      ref={trackRef}
      onMouseEnter={pause}
      onMouseLeave={resume}
    >
      {displayWords.map((word, index) => (
        <WordItem 
          key={`${word.id}-${index}`} 
          word={word} 
          orientation={orientation} 
        />
      ))}
    </div>
  );
}
