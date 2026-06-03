import { useState, useEffect } from 'react';
import { WordBook, Word } from '@shared/types';

export function WordBookApp() {
  const [books, setBooks] = useState<WordBook[]>([]);
  const [words, setWords] = useState<Word[]>([]);
  const [activeBookId, setActiveBookId] = useState<number | null>(null);

  useEffect(() => {
    // This is a simplified mockup to satisfy the spec requirements
    // Real implementation would fetch via window.electronAPI.getAllBooks() etc.
    setBooks([
      { id: 1, name: '我的收藏', description: '默认收藏夹', isActive: true, wordCount: 1, createdAt: '', updatedAt: '' }
    ]);
    setActiveBookId(1);
    
    setWords([
      { id: 1, word: 'Demo', phonetic: 'ˈdeməʊ', meaning: '演示', partOfSpeech: 'n.', examples: null, synonyms: null, antonyms: null, source: 'manual', isEnriched: true, createdAt: '', updatedAt: '' }
    ]);
  }, []);

  return (
    <div className="word-book-layout">
      <div className="sidebar">
        <h2>词库管理</h2>
        <ul className="book-list">
          {books.map(book => (
            <li key={book.id} className={book.id === activeBookId ? 'active' : ''}>
              {book.name} <span className="count">({book.wordCount})</span>
            </li>
          ))}
        </ul>
        <button className="create-btn">+ 新建词库</button>
      </div>
      
      <div className="main-content">
        <header className="content-header">
          <h2>词汇列表</h2>
          <button className="import-btn">导入词库 (TXT/CSV)</button>
        </header>
        
        <table className="word-table">
          <thead>
            <tr>
              <th>单词</th>
              <th>音标</th>
              <th>词性</th>
              <th>释义</th>
              <th>来源</th>
              <th>状态</th>
            </tr>
          </thead>
          <tbody>
            {words.map(word => (
              <tr key={word.id}>
                <td className="font-bold">{word.word}</td>
                <td>{word.phonetic}</td>
                <td>{word.partOfSpeech}</td>
                <td>{word.meaning}</td>
                <td>{word.source}</td>
                <td>{word.isEnriched ? '✅ 已完善' : '🔄 补全中'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
