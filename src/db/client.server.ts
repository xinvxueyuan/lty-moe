import sqlite3 from 'sqlite3'
import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import type { WorkStatus } from '../data/auth-types'
import { exampleWorks } from '../data/examples'
import { normalizeCategory } from '../data/taxonomy'
import type { Work } from '../data/types'
import { createUser, countUsers } from './users.server'
import { migrateDatabase } from './migrate.server'
import { getTagsForWorks, listTags, setWorkTags } from './tags.server'

type WorkRow = {
  id: string
  title: string
  creator: string
  handle: string
  category: Work['category']
  image: string
  likes: string
  comments: number
  palette: string
  description: string
  date: string
  source_url: string | null
  license: string
  maintainers: string
  co_authors: string
  ai_disclosure: Work['aiDisclosure']
  origin: Work['origin']
  submitted_by: string | null
  created_at: string
  status?: string
  owner_id?: string | null
  body?: string
  updated_at?: string
}

let databasePromise: Promise<sqlite3.Database> | null = null

type RunResult = { lastID: number; changes: number }

export function promisifyRun(
  db: sqlite3.Database,
  sql: string,
  params: unknown[] = [],
): Promise<RunResult> {
  return new Promise((resolvePromise, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err)
      else resolvePromise({ lastID: this.lastID, changes: this.changes })
    })
  })
}

export function promisifyGet(
  db: sqlite3.Database,
  sql: string,
  params: unknown[] = [],
): Promise<unknown> {
  return new Promise((resolvePromise, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err)
      else resolvePromise(row)
    })
  })
}

export function promisifyAll(
  db: sqlite3.Database,
  sql: string,
  params: unknown[] = [],
): Promise<unknown[]> {
  return new Promise((resolvePromise, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err)
      else resolvePromise(rows)
    })
  })
}

function promisifyExec(db: sqlite3.Database, sql: string): Promise<void> {
  return new Promise((resolvePromise, reject) => {
    db.exec(sql, (err) => {
      if (err) reject(err)
      else resolvePromise()
    })
  })
}

const helpers = {
  run: promisifyRun,
  get: promisifyGet,
  all: promisifyAll,
  exec: promisifyExec,
}

export async function getDb(): Promise<sqlite3.Database> {
  return openDatabase()
}

function openDatabase(): Promise<sqlite3.Database> {
  if (databasePromise) return databasePromise
  const path = process.env.DATABASE_PATH || resolve(process.cwd(), 'data', 'lty-moe.db')
  mkdirSync(dirname(path), { recursive: true })
  databasePromise = new Promise((resolvePromise, reject) => {
    const db = new sqlite3.Database(path, async (err) => {
      if (err) {
        databasePromise = null
        reject(err)
        return
      }
      try {
        await migrateDatabase(db, helpers)
        await seedDemoWorks(db)
        await seedAdminUser(db)
        resolvePromise(db)
      } catch (seedErr) {
        databasePromise = null
        reject(seedErr)
      }
    })
  })
  return databasePromise
}

async function seedAdminUser(db: sqlite3.Database): Promise<void> {
  const count = await countUsers(db, promisifyGet)
  if (count > 0) return
  const email = process.env.ADMIN_EMAIL || 'admin@lty.local'
  const password = process.env.ADMIN_PASSWORD || 'admin123456'
  const handle = process.env.ADMIN_HANDLE || 'admin'
  await createUser(db, promisifyRun, {
    id: 'user-admin',
    email,
    handle,
    displayName: '档案管理员',
    password,
    role: 'admin',
    bio: '天依档案默认管理员。请尽快修改密码。',
  })
}

async function seedDemoWorks(db: sqlite3.Database): Promise<void> {
  const row = (await promisifyGet(db, 'SELECT COUNT(*) AS count FROM works')) as { count: number }
  if (row.count > 0) return
  const insert = `
    INSERT INTO works (
      id, title, creator, handle, category, image, likes, comments, palette,
      description, date, source_url, license, maintainers, co_authors,
      ai_disclosure, origin, created_at, status, body, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'published', ?, ?)
  `
  for (const work of exampleWorks) {
    const category = normalizeCategory(work.category) ?? work.category
    const created = work.date.replaceAll('.', '-') + ' 00:00:00'
    await promisifyRun(db, insert, [
      work.id,
      work.title,
      work.creator,
      work.handle,
      category,
      work.image,
      work.likes,
      work.comments,
      JSON.stringify(work.palette),
      work.description,
      work.date,
      work.sourceUrl ?? null,
      work.license,
      JSON.stringify(work.maintainers),
      JSON.stringify(work.coAuthors),
      work.aiDisclosure,
      work.origin,
      created,
      work.description,
      created,
    ])
    if (work.tags?.length) {
      await setWorkTags(db, promisifyRun, work.id, work.tags)
    }
  }
}

function rowToWork(row: WorkRow, tags: string[] = []): Work {
  return {
    id: row.id,
    title: row.title,
    creator: row.creator,
    handle: row.handle,
    category: (normalizeCategory(row.category) ?? row.category) as Work['category'],
    image: row.image,
    likes: row.likes,
    comments: row.comments,
    palette: JSON.parse(row.palette),
    description: row.description,
    date: row.date,
    sourceUrl: row.source_url,
    license: row.license,
    maintainers: JSON.parse(row.maintainers),
    coAuthors: JSON.parse(row.co_authors),
    aiDisclosure: row.ai_disclosure,
    origin: row.origin,
    submittedBy: row.submitted_by ?? undefined,
    tags,
    status: (row.status as WorkStatus) || 'published',
    ownerId: row.owner_id ?? null,
    body: row.body ?? '',
    updatedAt: row.updated_at,
  }
}

const selectColumns = `
  id, title, creator, handle, category, image, likes, comments, palette,
  description, date, source_url, license, maintainers, co_authors,
  ai_disclosure, origin, submitted_by, created_at, status, owner_id, body, updated_at
`

async function attachTags(db: sqlite3.Database, works: Work[]): Promise<Work[]> {
  const tagMap = await getTagsForWorks(
    db,
    promisifyAll,
    works.map((work) => work.id),
  )
  return works.map((work) => ({ ...work, tags: tagMap.get(work.id) ?? [] }))
}

export type ListWorksOptions = {
  category?: string
  tag?: string
  status?: WorkStatus | 'all'
  ownerId?: string
  includeUnpublished?: boolean
}

export async function listWorks(options: ListWorksOptions = {}): Promise<Work[]> {
  const db = await openDatabase()
  const params: unknown[] = []
  const clauses: string[] = []

  if (!options.includeUnpublished && options.status !== 'all' && !options.ownerId) {
    clauses.push(`status = 'published'`)
  } else if (options.status && options.status !== 'all') {
    clauses.push('status = ?')
    params.push(options.status)
  }

  if (options.category && options.category !== '全部') {
    clauses.push('category = ?')
    params.push(options.category)
  }
  if (options.tag) {
    clauses.push(
      `id IN (SELECT work_id FROM work_tags wt JOIN tags t ON t.id = wt.tag_id WHERE t.name = ? OR t.id = ?)`,
    )
    params.push(options.tag, options.tag)
  }
  if (options.ownerId) {
    clauses.push('owner_id = ?')
    params.push(options.ownerId)
  }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''
  const rows = (await promisifyAll(
    db,
    `SELECT ${selectColumns} FROM works ${where} ORDER BY created_at DESC`,
    params,
  )) as unknown as WorkRow[]
  return attachTags(
    db,
    rows.map((row) => rowToWork(row)),
  )
}

export async function getWorkById(
  id: string,
  options: { allowUnpublished?: boolean } = {},
): Promise<Work | null> {
  const db = await openDatabase()
  const row = (await promisifyGet(db, `SELECT ${selectColumns} FROM works WHERE id = ?`, [id])) as
    WorkRow | undefined
  if (!row) return null
  const work = rowToWork(row)
  if (!options.allowUnpublished && work.status && work.status !== 'published') {
    return null
  }
  const [withTags] = await attachTags(db, [work])
  return withTags
}

export async function insertWork(work: Work): Promise<void> {
  const db = await openDatabase()
  const category = normalizeCategory(work.category) ?? work.category
  const status = work.status ?? 'published'
  await promisifyRun(
    db,
    `
      INSERT INTO works (
        id, title, creator, handle, category, image, likes, comments, palette,
        description, date, source_url, license, maintainers, co_authors,
        ai_disclosure, origin, submitted_by, status, owner_id, body, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `,
    [
      work.id,
      work.title,
      work.creator,
      work.handle,
      category,
      work.image,
      work.likes,
      work.comments,
      JSON.stringify(work.palette),
      work.description,
      work.date,
      work.sourceUrl ?? null,
      work.license,
      JSON.stringify(work.maintainers),
      JSON.stringify(work.coAuthors),
      work.aiDisclosure,
      work.origin,
      work.submittedBy ?? null,
      status,
      work.ownerId ?? null,
      work.body ?? work.description ?? '',
    ],
  )
  if (work.tags?.length) {
    await setWorkTags(db, promisifyRun, work.id, work.tags)
  }
}

export async function updateWork(
  id: string,
  patch: Partial<Work> & { tags?: string[] },
): Promise<void> {
  const db = await openDatabase()
  const current = await getWorkById(id, { allowUnpublished: true })
  if (!current) throw new Response('Not found', { status: 404 })

  const next: Work = {
    ...current,
    ...patch,
    id,
    tags: patch.tags ?? current.tags,
  }
  const category = normalizeCategory(next.category) ?? next.category
  await promisifyRun(
    db,
    `
      UPDATE works SET
        title = ?, creator = ?, handle = ?, category = ?, image = ?,
        description = ?, date = ?, source_url = ?, license = ?,
        maintainers = ?, co_authors = ?, ai_disclosure = ?, origin = ?,
        status = ?, owner_id = ?, body = ?, updated_at = datetime('now')
      WHERE id = ?
    `,
    [
      next.title,
      next.creator,
      next.handle,
      category,
      next.image,
      next.description,
      next.date,
      next.sourceUrl ?? null,
      next.license,
      JSON.stringify(next.maintainers),
      JSON.stringify(next.coAuthors),
      next.aiDisclosure,
      next.origin,
      next.status ?? 'published',
      next.ownerId ?? null,
      next.body ?? '',
      id,
    ],
  )
  if (patch.tags) {
    await setWorkTags(db, promisifyRun, id, patch.tags)
  }
}

export async function deleteWork(id: string): Promise<void> {
  const db = await openDatabase()
  await promisifyRun(db, `DELETE FROM works WHERE id = ?`, [id])
}

export async function listAllTags() {
  const db = await openDatabase()
  return listTags(db, promisifyAll)
}

export async function adminStats() {
  const db = await openDatabase()
  const users = (await promisifyGet(db, `SELECT COUNT(*) AS count FROM users`)) as { count: number }
  const works = (await promisifyGet(db, `SELECT COUNT(*) AS count FROM works`)) as { count: number }
  const drafts = (await promisifyGet(
    db,
    `SELECT COUNT(*) AS count FROM works WHERE status = 'draft'`,
  )) as { count: number }
  const published = (await promisifyGet(
    db,
    `SELECT COUNT(*) AS count FROM works WHERE status = 'published'`,
  )) as { count: number }
  return {
    users: users.count,
    works: works.count,
    drafts: drafts.count,
    published: published.count,
  }
}
