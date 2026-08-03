import type sqlite3 from 'sqlite3'
import { categoryAliases, normalizeCategory, slugifyTag, systemTagNames } from '../data/taxonomy'
import { schemaVersion, baseSchema } from './schema'

type Run = (db: sqlite3.Database, sql: string, params?: unknown[]) => Promise<unknown>
type Get = (db: sqlite3.Database, sql: string, params?: unknown[]) => Promise<unknown>
type All = (db: sqlite3.Database, sql: string, params?: unknown[]) => Promise<unknown[]>
type Exec = (db: sqlite3.Database, sql: string) => Promise<void>

export type DbHelpers = {
  run: Run
  get: Get
  all: All
  exec: Exec
}

async function tableColumns(db: sqlite3.Database, all: All, table: string): Promise<Set<string>> {
  const rows = (await all(db, `PRAGMA table_info(${table})`)) as { name: string }[]
  return new Set(rows.map((row) => row.name))
}

export async function migrateDatabase(db: sqlite3.Database, helpers: DbHelpers): Promise<void> {
  const { run, get, exec } = helpers
  await exec(db, baseSchema)

  const versionRow = (await get(db, `SELECT value FROM schema_meta WHERE key = 'version'`)) as
    { value: string } | undefined
  let current = versionRow ? Number(versionRow.value) : 1
  if (!Number.isFinite(current) || current < 1) current = 1

  if (current < 2) {
    await migrateToV2(db, helpers)
  }
  if (current < 3) {
    await migrateToV3(db, helpers)
  }
  if (current < 4) {
    await migrateToV4(db, helpers)
  }

  await run(
    db,
    `INSERT INTO schema_meta(key, value) VALUES('version', ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    [String(schemaVersion)],
  )
}

async function migrateToV2(db: sqlite3.Database, helpers: DbHelpers): Promise<void> {
  const { run, all } = helpers

  for (const name of systemTagNames) {
    const id = slugifyTag(name)
    await run(db, `INSERT OR IGNORE INTO tags(id, name, kind) VALUES(?, ?, 'system')`, [id, name])
  }

  const rows = (await all(db, `SELECT id, category FROM works`)) as {
    id: string
    category: string
  }[]
  for (const row of rows) {
    const normalized =
      normalizeCategory(row.category) ?? categoryAliases[row.category] ?? ('其他' as const)
    if (normalized !== row.category) {
      await run(db, `UPDATE works SET category = ? WHERE id = ?`, [normalized, row.id])
    }
  }
}

async function migrateToV3(db: sqlite3.Database, helpers: DbHelpers): Promise<void> {
  const { run, all, exec } = helpers
  const columns = await tableColumns(db, all, 'works')

  if (!columns.has('status')) {
    await exec(db, `ALTER TABLE works ADD COLUMN status TEXT NOT NULL DEFAULT 'published'`)
  }
  if (!columns.has('owner_id')) {
    await exec(db, `ALTER TABLE works ADD COLUMN owner_id TEXT`)
  }
  if (!columns.has('body')) {
    await exec(db, `ALTER TABLE works ADD COLUMN body TEXT NOT NULL DEFAULT ''`)
  }
  if (!columns.has('updated_at')) {
    await exec(
      db,
      `ALTER TABLE works ADD COLUMN updated_at TEXT NOT NULL DEFAULT (datetime('now'))`,
    )
  }

  await run(db, `UPDATE works SET status = 'published' WHERE status IS NULL OR status = ''`)
  await run(db, `UPDATE works SET body = COALESCE(body, '')`)
  await run(db, `UPDATE works SET updated_at = COALESCE(updated_at, created_at, datetime('now'))`)
}

async function migrateToV4(db: sqlite3.Database, helpers: DbHelpers): Promise<void> {
  const { all, exec } = helpers
  const userCols = await tableColumns(db, all, 'users')
  const sessionCols = await tableColumns(db, all, 'sessions')

  if (!userCols.has('github_id')) {
    await exec(db, `ALTER TABLE users ADD COLUMN github_id TEXT`)
  }
  if (!userCols.has('email_verified_at')) {
    await exec(db, `ALTER TABLE users ADD COLUMN email_verified_at TEXT`)
  }
  if (!userCols.has('locale')) {
    await exec(db, `ALTER TABLE users ADD COLUMN locale TEXT NOT NULL DEFAULT 'zh-CN'`)
  }

  if (!sessionCols.has('user_agent')) {
    await exec(db, `ALTER TABLE sessions ADD COLUMN user_agent TEXT NOT NULL DEFAULT ''`)
  }
  if (!sessionCols.has('ip')) {
    await exec(db, `ALTER TABLE sessions ADD COLUMN ip TEXT NOT NULL DEFAULT ''`)
  }
  if (!sessionCols.has('label')) {
    await exec(db, `ALTER TABLE sessions ADD COLUMN label TEXT NOT NULL DEFAULT ''`)
  }
  if (!sessionCols.has('last_seen_at')) {
    await exec(
      db,
      `ALTER TABLE sessions ADD COLUMN last_seen_at TEXT NOT NULL DEFAULT (datetime('now'))`,
    )
  }
}
