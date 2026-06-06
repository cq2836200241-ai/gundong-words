-- Words Table
CREATE TABLE IF NOT EXISTS words (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  word TEXT NOT NULL UNIQUE COLLATE NOCASE,
  phonetic TEXT,
  meaning TEXT,
  part_of_speech TEXT,
  examples TEXT, -- JSON Array
  synonyms TEXT, -- JSON Array
  antonyms TEXT, -- JSON Array
  source TEXT DEFAULT 'manual',
  is_enriched BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_words_word ON words(word);
CREATE INDEX IF NOT EXISTS idx_words_is_enriched ON words(is_enriched);

-- Word Books Table
CREATE TABLE IF NOT EXISTS word_books (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT DEFAULT 'english',
  is_active BOOLEAN DEFAULT 0,
  word_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Word Book Items (Many-to-Many link)
CREATE TABLE IF NOT EXISTS word_book_items (
  book_id INTEGER NOT NULL,
  word_id INTEGER NOT NULL,
  sort_order INTEGER DEFAULT 0,
  added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (book_id, word_id),
  FOREIGN KEY (book_id) REFERENCES word_books(id) ON DELETE CASCADE,
  FOREIGN KEY (word_id) REFERENCES words(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_word_book_items_word ON word_book_items(word_id);
