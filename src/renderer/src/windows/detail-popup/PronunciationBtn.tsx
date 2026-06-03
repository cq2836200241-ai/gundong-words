import { useState, useEffect } from 'react';

export function PronunciationBtn({ word }: { word: string }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    const loadVoices = () => setVoices(window.speechSynthesis.getVoices());
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  const speak = () => {
    if (isPlaying || !word) return;
    setIsPlaying(true);

    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = 'en-US';
    
    const preferredVoice = voices.find(v => v.name.includes('Microsoft Zira') || v.name.includes('Microsoft Mark')) 
                        || voices.find(v => v.lang.startsWith('en'));
    
    if (preferredVoice) utterance.voice = preferredVoice;

    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  return (
    <button 
      onClick={speak} 
      className={`btn-icon ${isPlaying ? 'playing' : ''}`}
      title="发音"
      style={{
        background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-color)'
      }}
    >
      <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
        <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
      </svg>
    </button>
  );
}
