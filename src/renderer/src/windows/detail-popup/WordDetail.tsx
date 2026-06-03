import { Word } from '@shared/types';
import { PronunciationBtn } from './PronunciationBtn';

export function WordDetail({ word }: { word: Word }) {
  return (
    <div className="detail-container">
      <header className="header">
        <div className="title-row">
          <h1>{word.word}</h1>
          <PronunciationBtn word={word.word} />
        </div>
        {word.phonetic && <div className="phonetic">/{word.phonetic}/</div>}
      </header>

      <section className="section-meaning">
        {word.partOfSpeech && <span className="pos">{word.partOfSpeech}</span>}
        <p className="meaning">{word.meaning}</p>
      </section>

      {word.examples && word.examples.length > 0 && (
        <section className="section-examples">
          <h3>例句</h3>
          <ul>
            {word.examples.map((ex, i) => (
              <li key={i}>
                <p className="en">{ex.en}</p>
                <p className="zh">{ex.zh}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="tags-container">
        {word.synonyms && word.synonyms.length > 0 && (
          <div className="synonyms">
            <h3>近义词</h3>
            <div className="tags">
              {word.synonyms.map(s => <span className="tag" key={s}>{s}</span>)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
