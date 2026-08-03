import sqlite3 from 'sqlite3'
import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { schema } from './schema'
import { exampleWorks } from '../data/examples'
import type { Work } from '../data/types'

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

function promisifyRun(db: sqlite3.Database, sql: string, params: unknown[]): Promise<RunResult> {
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
        await promisifyExec(db, schema)
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
    await promisifyRun(db, insert, [
      work.id,
      work.title,
      work.creator,
      work.handle,
      work.category,
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
  }
}

function rowToWork(row: WorkRow): Work {
  return {
    id: row.id,
    title: row.title,
    creator: row.creator,
    handle: row.handle,
    category: row.category,
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
  }
}

const selectColumns = `
  id, title, creator, handle, category, image, likes, comments, palette,
  description, date, source_url, license, maintainers, co_authors,
  ai_disclosure, origin, submitted_by, created_at
`

export async function listWorks(): Promise<Work[]> {
  const db = await openDatabase()
  const rows = (await promisifyAll(
    db,
    `SELECT ${selectColumns} FROM works ORDER BY created_at DESC`,
  )) as unknown as WorkRow[]
  return rows.map(rowToWork)
}

export async function getWorkById(id: string): Promise<Work | null> {
  const db = await openDatabase()
  const row = (await promisifyGet(db, `SELECT ${selectColumns} FROM works WHERE id = ?`, [id])) as
    WorkRow | undefined
  return row ? rowToWork(row) : null
}

export async function insertWork(work: Work): Promise<void> {
  const db = await openDatabase()
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
      work.category,
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
}
