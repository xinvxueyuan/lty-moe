export const schemaVersion = 1

export const schema = `
CREATE TABLE IF NOT EXISTS works (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  creator TEXT NOT NULL,
  handle TEXT NOT NULL,
  category TEXT NOT NULL,
  image TEXT NOT NULL,
  likes TEXT NOT NULL DEFAULT '0',
  comments INTEGER NOT NULL DEFAULT 0,
  palette TEXT NOT NULL DEFAULT '[]',
  description TEXT NOT NULL,
  date TEXT NOT NULL,
  source_url TEXT,
  license TEXT NOT NULL,
  maintainers TEXT NOT NULL DEFAULT '[]',
  co_authors TEXT NOT NULL DEFAULT '[]',
  ai_disclosure TEXT NOT NULL,
  origin TEXT NOT NULL,
  submitted_by TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`
