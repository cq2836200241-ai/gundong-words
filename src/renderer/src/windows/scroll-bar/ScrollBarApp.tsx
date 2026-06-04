import { useState, useEffect } from 'react';
import { WordTrack } from './WordTrack';
import { Word, DockChangeEvent, AppSettings } from '@shared/types';

const hexToRgba = (hex: string, alpha: number) => {
  const r = parseInt(hex.slice(1, 3), 16) || 0;
  const g = parseInt(hex.slice(3, 5), 16) || 0;
  const b = parseInt(hex.slice(5, 7), 16) || 0;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};
const FALLBACK_WORDS: Word[] = [
  {
    id: 1,
    word: 'Gravity',
    phonetic: 'ˈgrævɪti',
    meaning: '重力；引力',
    partOfSpeech: 'n.',
    examples: null,
    synonyms: null,
    antonyms: null,
    source: 'manual',
    isEnriched: true,
    createdAt: '',
    updatedAt: ''
  },
  {
    id: 2,
    word: 'Universe',
    phonetic: 'ˈjuːnɪvɜːrs',
    meaning: '宇宙',
    partOfSpeech: 'n.',
    examples: null,
    synonyms: null,
    antonyms: null,
    source: 'manual',
    isEnriched: true,
    createdAt: '',
    updatedAt: ''
  },
  {
    id: 3,
    word: 'Fascinating',
    phonetic: 'ˈfæsɪneɪtɪŋ',
    meaning: '迷人的',
    partOfSpeech: 'adj.',
    examples: null,
    synonyms: null,
    antonyms: null,
    source: 'manual',
    isEnriched: true,
    createdAt: '',
    updatedAt: ''
  }
];

export function ScrollBarApp() {
  const [words, setWords] = useState<Word[]>([]);
  const [orientation, setOrientation] = useState<'horizontal'|'vertical'>('horizontal');
  const [direction, setDirection] = useState<'forward'|'reverse'>('forward');
  const [speed, setSpeed] = useState(1.0);
  const [theme, setTheme] = useState({ backgroundColor: '#000000', backgroundOpacity: 0.85 });

  useEffect(() => {
    const api = window.electronAPI;

    if (!api) {
      console.warn('electronAPI is not available; showing fallback words.');
      setWords(FALLBACK_WORDS);
      return;
    }

    // Initial fetch
    api.getSettings().then((settings: AppSettings) => {
      setDirection(settings.scroll.direction);
      setSpeed(settings.scroll.speed);
      setTheme(settings.theme || { backgroundColor: '#000000', backgroundOpacity: 0.85 });
      // We'll get orientation from dock:changed event initially or it defaults
    }).catch((error) => {
      console.error('Failed to load settings:', error);
    });

    const unDock = api.onDockChanged((data: DockChangeEvent) => {
      setOrientation(data.orientation);
    });

    const unUpdate = api.onPlaybackUpdate((data: { words: Word[] }) => {
      setWords(data.words || []);
    });

    const unWordAdded = api.onWordAdded((data: { word: Word }) => {
      setWords(prev => [data.word, ...prev]);
    });

    const unSettings = api.onSettingsUpdate((partial: Partial<AppSettings>) => {
      if (partial.scroll?.direction) setDirection(partial.scroll.direction);
      if (partial.scroll?.speed) setSpeed(partial.scroll.speed);
      if (partial.theme) setTheme(prev => ({ ...prev, ...partial.theme }));
    });

    return () => {
      unDock(); unUpdate(); unWordAdded(); unSettings();
    };
  }, []);

  return (
    <div 
      className="scroll-bar-container" 
      style={{ backgroundColor: hexToRgba(theme.backgroundColor, theme.backgroundOpacity), width: '100%', height: '100%', overflow: 'hidden' }}
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
