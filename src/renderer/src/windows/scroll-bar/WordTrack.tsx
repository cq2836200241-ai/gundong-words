import { useRef, useState, useEffect } from 'react';
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
  const groupRef = useRef<HTMLDivElement>(null);
  const [copies, setCopies] = useState(2);
  
  const { pause, resume } = useScrollAnimation(
    trackRef, 
    groupRef,
    words.length, 
    copies,
    orientation, 
    direction, 
    speed
  );

  // Dynamically calculate how many copies we need to fill the screen
  useEffect(() => {
    if (!groupRef.current || words.length === 0) return;
    
    const checkSize = () => {
      const groupNode = groupRef.current;
      if (!groupNode) return;
      
      const isHorizontal = orientation === 'horizontal';
      const groupSize = isHorizontal ? groupNode.getBoundingClientRect().width : groupNode.getBoundingClientRect().height;
      const viewportSize = isHorizontal ? window.innerWidth : window.innerHeight;
      
      if (groupSize === 0) return;
      
      // We need enough copies to fill the viewport PLUS one extra copy for smooth scrolling
      const requiredCopies = Math.ceil(viewportSize / groupSize) + 1;
      
      if (requiredCopies !== copies && requiredCopies > 1) {
        setCopies(requiredCopies);
      } else if (copies < 2) {
        setCopies(2);
      }
    };

    // Give the browser a moment to render the first group before measuring
    requestAnimationFrame(checkSize);
    window.addEventListener('resize', checkSize);
    return () => window.removeEventListener('resize', checkSize);
  }, [words, orientation, copies]);

  if (words.length === 0) {
    return (
      <div className={`empty-state ${orientation}`}>
        <span>等待加载词库 (W+Space)</span>
      </div>
    );
  }

  return (
    <div 
      className={`word-track ${orientation}`} 
      ref={trackRef}
      onMouseEnter={pause}
      onMouseLeave={resume}
    >
      {/* Primary group that we measure */}
      <div className="word-group" ref={groupRef}>
        {words.map((word, index) => (
          <WordItem 
            key={`${word.id}-${index}`} 
            word={word} 
            orientation={orientation} 
          />
        ))}
      </div>
      
      {/* Additional copies to ensure seamless scrolling */}
      {Array.from({ length: copies - 1 }).map((_, i) => (
        <div className="word-group" key={i}>
          {words.map((word, index) => (
            <WordItem 
              key={`copy-${i}-${word.id}-${index}`} 
              word={word} 
              orientation={orientation} 
            />
          ))}
        </div>
      ))}
    </div>
  );
}
