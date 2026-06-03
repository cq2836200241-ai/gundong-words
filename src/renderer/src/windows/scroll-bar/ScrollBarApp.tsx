import { useState, useEffect } from 'react';
import { WordTrack } from './WordTrack';
import { Word, DockChangeEvent, AppSettings, DEFAULT_SETTINGS } from '@shared/types';

export function ScrollBarApp() {
  const [words, setWords] = useState<Word[]>([]);
  const [orientation, setOrientation] = useState<'horizontal'|'vertical'>('horizontal');
  const [direction, setDirection] = useState<'forward'|'reverse'>('forward');
  const [speed, setSpeed] = useState(1.0);
  const [opacity, setOpacity] = useState(0.85);

  useEffect(() => {
    // Initial fetch
    window.electronAPI.getSettings().then((settings: AppSettings) => {
      setDirection(settings.scroll.direction);
      setSpeed(settings.scroll.speed);
      setOpacity(settings.opacity);
      // We'll get orientation from dock:changed event initially or it defaults
    });

    const unDock = window.electronAPI.onDockChanged((data: DockChangeEvent) => {
      setOrientation(data.orientation);
    });

    const unUpdate = window.electronAPI.onPlaybackUpdate((data: { words: Word[] }) => {
      setWords(data.words || []);
    });

    const unWordAdded = window.electronAPI.onWordAdded((data: { word: Word }) => {
      setWords(prev => [data.word, ...prev]);
    });

    const unSettings = window.electronAPI.onSettingsUpdate((partial: Partial<AppSettings>) => {
      if (partial.scroll?.direction) setDirection(partial.scroll.direction);
      if (partial.scroll?.speed) setSpeed(partial.scroll.speed);
      if (partial.opacity !== undefined) setOpacity(partial.opacity);
    });

    return () => {
      unDock(); unUpdate(); unWordAdded(); unSettings();
    };
  }, []);

  return (
    <div 
      className="scroll-bar-container" 
      style={{ opacity, width: '100%', height: '100%', overflow: 'hidden' }}
    >
      <WordTrack 
        words={words} 
        orientation={orientation} 
        direction={direction} 
        speed={speed} 
      />
    </div>
  );
}
