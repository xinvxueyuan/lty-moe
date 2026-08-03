export const schemaVersion = 2

export const baseSchema = `
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

CREATE TABLE IF NOT EXISTS schema_meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tags (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  kind TEXT NOT NULL DEFAULT 'user',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS work_tags (
  work_id TEXT NOT NULL,
  tag_id TEXT NOT NULL,
  PRIMARY KEY (work_id, tag_id),
  FOREIGN KEY (work_id) REFERENCES works(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_work_tags_tag_id ON work_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_works_category ON works(category);
`

/** @deprecated use baseSchema; kept for import clarity during migration */
export const schema = baseSchema
