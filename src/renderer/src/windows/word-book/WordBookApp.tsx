import { useEffect, useMemo, useState } from 'react';
import { ImportResult, Word, WordBook } from '@shared/types';

export function WordBookApp() {
  const [books, setBooks] = useState<WordBook[]>([]);
  const [words, setWords] = useState<Word[]>([]);
  const [activeBookId, setActiveBookId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [isPromptOpen, setIsPromptOpen] = useState(false);
  const [promptValue, setPromptValue] = useState('');
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const activeBook = useMemo(
    () => books.find((book) => book.id === activeBookId) ?? null,
    [books, activeBookId]
  );

  useEffect(() => {
    void loadBooks();
  }, []);

  async function loadBooks(preferredBookId?: number): Promise<void> {
    const api = window.electronAPI;
    if (!api) {
      setMessage('当前页面缺少 Electron 接口，无法读取词库。');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const nextBooks = await api.listWordBooks();
      setBooks(nextBooks);

      const nextActiveBook =
        nextBooks.find((book) => book.id === preferredBookId) ??
        nextBooks.find((book) => book.isActive) ??
        nextBooks[0] ??
        null;

      setActiveBookId(nextActiveBook?.id ?? null);
      if (nextActiveBook) {
        setWords(await api.getWordsInBook(nextActiveBook.id));
      } else {
        setWords([]);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '读取词库失败。');
    } finally {
      setIsLoading(false);
    }
  }

  async function selectBook(bookId: number): Promise<void> {
    const api = window.electronAPI;
    if (!api || bookId === activeBookId) return;

    setActiveBookId(bookId);
    setMessage('');
    try {
      const nextBooks = await api.setActiveWordBook(bookId);
      setBooks(nextBooks);
      setWords(await api.getWordsInBook(bookId));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '切换词库失败。');
    }
  }

  async function createBook(): Promise<void> {
    setPromptValue('');
    setIsPromptOpen(true);
  }

  async function submitCreateBook(): Promise<void> {
    const api = window.electronAPI;
    if (!api) return;

    const normalizedName = promptValue.trim();
    if (!normalizedName) return;

    setIsPromptOpen(false);

    try {
      const nextBooks = await api.createWordBook({ name: normalizedName });
      const createdBook = nextBooks.find((book) => book.name === normalizedName) ?? nextBooks.find((book) => book.isActive);
      setBooks(nextBooks);
      await loadBooks(createdBook?.id);
      setMessage(`已创建词库：${normalizedName}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '创建词库失败。');
    }
  }

  async function importWords(): Promise<void> {
    const api = window.electronAPI;
    if (!api || !activeBookId) return;

    setMessage('');
    try {
      const result = await api.importWordsToBook(activeBookId);
      if (!result) return;

      setWords(await api.getWordsInBook(activeBookId));
      await loadBooks(activeBookId);
      setMessage(formatImportResult(result));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '导入失败。');
    }
  }

  async function downloadTemplate(): Promise<void> {
    const api = window.electronAPI;
    if (!api) return;

    try {
      const result = await api.downloadImportTemplate();
      if (result) {
        setMessage('模板下载成功。');
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '下载模板失败。');
    }
  }

  async function submitDeleteBook(): Promise<void> {
    const api = window.electronAPI;
    if (!api || !activeBookId) return;

    setIsConfirmOpen(false);

    try {
      const nextBooks = await api.deleteWordBook(activeBookId);
      setBooks(nextBooks);
      
      const nextActiveBook = nextBooks.find(b => b.isActive) ?? nextBooks[0] ?? null;
      setActiveBookId(nextActiveBook?.id ?? null);
      if (nextActiveBook) {
        setWords(await api.getWordsInBook(nextActiveBook.id));
      } else {
        setWords([]);
      }
      setMessage('已成功删除词库。');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '删除词库失败。');
    }
  }

  async function removeWord(wordId: number): Promise<void> {
    const api = window.electronAPI;
    if (!api || !activeBookId) return;

    try {
      setWords(await api.removeWordFromBook(activeBookId, wordId));
      await loadBooks(activeBookId);
      setMessage('已从当前词库移除。');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '移除失败。');
    }
  }

  return (
    <div className="word-book-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>词库管理</h2>
          <span>{books.length}</span>
        </div>

        <ul className="book-list">
          {books.map((book) => (
            <li
              key={book.id}
              className={book.id === activeBookId ? 'active' : ''}
              onClick={() => void selectBook(book.id)}
            >
              <span className="book-name">{book.name}</span>
              <span className="count">{book.wordCount}</span>
            </li>
          ))}
        </ul>

        <button className="create-btn" onClick={() => void createBook()}>
          + 新建词库
        </button>
      </aside>

      <main className="main-content">
        <header className="content-header">
          <div>
            <h1>{activeBook?.name ?? '词汇列表'}</h1>
            <p>{activeBook ? `${activeBook.wordCount} 个单词` : '还没有可用词库'}</p>
          </div>
          <div className="header-actions">
            <button className="import-btn" onClick={() => void importWords()} disabled={!activeBookId}>
              导入词库
            </button>
            <button className="import-btn" onClick={() => void downloadTemplate()}>
              下载模板
            </button>
            <button className="delete-btn" onClick={() => setIsConfirmOpen(true)} disabled={!activeBookId}>
              删除词库
            </button>
          </div>
        </header>

        {message && <div className="status-bar">{message}</div>}

        <div className="table-wrap">
          {isLoading ? (
            <div className="empty-panel">正在加载词库...</div>
          ) : words.length === 0 ? (
            <div className="empty-panel">当前词库还没有单词。</div>
          ) : (
            <table className="word-table">
              <thead>
                <tr>
                  <th>单词</th>
                  <th>音标</th>
                  <th>词性</th>
                  <th>释义</th>
                  <th>来源</th>
                  <th>状态</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {words.map((word) => (
                  <tr key={word.id}>
                    <td className="font-bold">{word.word}</td>
                    <td>{word.phonetic || '-'}</td>
                    <td>{word.partOfSpeech || '-'}</td>
                    <td>{word.meaning || '-'}</td>
                    <td>{sourceLabel(word.source)}</td>
                    <td>{word.isEnriched ? '已完善' : '待补全'}</td>
                    <td className="actions-cell">
                      <button className="text-btn" onClick={() => void removeWord(word.id)}>
                        移除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>

      {isPromptOpen && (
        <div className="prompt-modal">
          <div className="prompt-content">
            <h3>新建词库</h3>
            <input 
              autoFocus
              type="text" 
              value={promptValue} 
              onChange={e => setPromptValue(e.target.value)} 
              placeholder="请输入新词库名称"
              onKeyDown={e => {
                if (e.key === 'Enter') void submitCreateBook();
                if (e.key === 'Escape') setIsPromptOpen(false);
              }}
            />
            <div className="prompt-actions">
              <button onClick={() => setIsPromptOpen(false)}>取消</button>
              <button className="primary" onClick={() => void submitCreateBook()}>确定</button>
            </div>
          </div>
        </div>
      )}

      {isConfirmOpen && (
        <div className="prompt-modal">
          <div className="prompt-content">
            <h3>删除词库</h3>
            <p style={{ color: '#ccc', marginBottom: '16px', fontSize: '13px' }}>
              确定要删除选中的词库吗？里面的所有单词记录都会被一并删除且无法恢复。
            </p>
            <div className="prompt-actions">
              <button onClick={() => setIsConfirmOpen(false)}>取消</button>
              <button className="danger" onClick={() => void submitDeleteBook()}>确定删除</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function formatImportResult(result: ImportResult): string {
  const summary = `导入完成：${result.imported}/${result.total} 个单词`;
  if (result.errors.length === 0) return summary;
  return `${summary}，${result.errors.length} 个错误。`;
}

function sourceLabel(source: Word['source']): string {
  if (source === 'capture') return '划词';
  if (source === 'import') return '导入';
  return '手动';
}
