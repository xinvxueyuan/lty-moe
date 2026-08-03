import type sqlite3 from 'sqlite3'
import { parseTagNames, slugifyTag } from '../data/taxonomy'
import type { Tag } from '../data/types'

type Run = (db: sqlite3.Database, sql: string, params?: unknown[]) => Promise<unknown>
type All = (db: sqlite3.Database, sql: string, params?: unknown[]) => Promise<unknown[]>

export async function ensureTags(
  db: sqlite3.Database,
  run: Run,
  names: string[],
  kind: Tag['kind'] = 'user',
): Promise<string[]> {
  const ids: string[] = []
  for (const name of names) {
    const id = slugifyTag(name)
    await run(db, `INSERT OR IGNORE INTO tags(id, name, kind) VALUES(?, ?, ?)`, [id, name, kind])
    ids.push(id)
  }
  return ids
}

export async function setWorkTags(
  db: sqlite3.Database,
  run: Run,
  workId: string,
  tagNames: string[],
): Promise<void> {
  const names = parseTagNames(tagNames.join(','))
  const ids = await ensureTags(db, run, names, 'user')
  await run(db, `DELETE FROM work_tags WHERE work_id = ?`, [workId])
  for (const tagId of ids) {
    await run(db, `INSERT OR IGNORE INTO work_tags(work_id, tag_id) VALUES(?, ?)`, [workId, tagId])
  }
}

export async function getTagsForWorks(
  db: sqlite3.Database,
  all: All,
  workIds: string[],
): Promise<Map<string, string[]>> {
  const map = new Map<string, string[]>()
  if (!workIds.length) return map
  const placeholders = workIds.map(() => '?').join(', ')
  const rows = (await all(
    db,
    `
      SELECT wt.work_id AS work_id, t.name AS name
      FROM work_tags wt
      JOIN tags t ON t.id = wt.tag_id
      WHERE wt.work_id IN (${placeholders})
      ORDER BY t.name COLLATE NOCASE
    `,
    workIds,
  )) as { work_id: string; name: string }[]
  for (const row of rows) {
    const list = map.get(row.work_id) ?? []
    list.push(row.name)
    map.set(row.work_id, list)
  }
  return map
}

export async function listTags(db: sqlite3.Database, all: All): Promise<Tag[]> {
  const rows = (await all(
    db,
    `SELECT id, name, kind FROM tags ORDER BY kind DESC, name COLLATE NOCASE`,
  )) as Tag[]
  return rows
}
