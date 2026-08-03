import sqlite3 from 'sqlite3'
import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { exampleWorks } from '../data/examples'
import { normalizeCategory } from '../data/taxonomy'
import type { Work } from '../data/types'
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
}

let databasePromise: Promise<sqlite3.Database> | null = null

type RunResult = { lastID: number; changes: number }

function promisifyRun(
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

function promisifyGet(db: sqlite3.Database, sql: string, params: unknown[] = []): Promise<unknown> {
  return new Promise((resolvePromise, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err)
      else resolvePromise(row)
    })
  })
}

function promisifyAll(
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
        resolvePromise(db)
      } catch (seedErr) {
        databasePromise = null
        reject(seedErr)
      }
    })
  })
  return databasePromise
}

async function seedDemoWorks(db: sqlite3.Database): Promise<void> {
  const row = (await promisifyGet(db, 'SELECT COUNT(*) AS count FROM works')) as { count: number }
  if (row.count > 0) return
  const insert = `
    INSERT INTO works (
      id, title, creator, handle, category, image, likes, comments, palette,
      description, date, source_url, license, maintainers, co_authors,
      ai_disclosure, origin, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `
  for (const work of exampleWorks) {
    const category = normalizeCategory(work.category) ?? work.category
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
      work.date.replaceAll('.', '-') + ' 00:00:00',
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
  }
}

const selectColumns = `
  id, title, creator, handle, category, image, likes, comments, palette,
  description, date, source_url, license, maintainers, co_authors,
  ai_disclosure, origin, submitted_by, created_at
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
}

export async function listWorks(options: ListWorksOptions = {}): Promise<Work[]> {
  const db = await openDatabase()
  const params: unknown[] = []
  const clauses: string[] = []

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

export async function getWorkById(id: string): Promise<Work | null> {
  const db = await openDatabase()
  const row = (await promisifyGet(db, `SELECT ${selectColumns} FROM works WHERE id = ?`, [id])) as
    WorkRow | undefined
  if (!row) return null
  const [work] = await attachTags(db, [rowToWork(row)])
  return work
}

export async function insertWork(work: Work): Promise<void> {
  const db = await openDatabase()
  const category = normalizeCategory(work.category) ?? work.category
  await promisifyRun(
    db,
    `
      INSERT INTO works (
        id, title, creator, handle, category, image, likes, comments, palette,
        description, date, source_url, license, maintainers, co_authors,
        ai_disclosure, origin, submitted_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
    ],
  )
  if (work.tags?.length) {
    await setWorkTags(db, promisifyRun, work.id, work.tags)
  }
}

export async function listAllTags() {
  const db = await openDatabase()
  return listTags(db, promisifyAll)
}
