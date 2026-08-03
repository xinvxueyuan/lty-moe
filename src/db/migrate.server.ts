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
