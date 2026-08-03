import { randomBytes } from 'node:crypto'
import { appendFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import type sqlite3 from 'sqlite3'

type Level = 'debug' | 'info' | 'warn' | 'error'

export type LogMeta = Record<string, unknown>

function line(level: Level, category: string, message: string, meta: LogMeta = {}) {
  return JSON.stringify({
    ts: new Date().toISOString(),
    level,
    category,
    message,
    ...meta,
  })
}

function writeFile(payload: string) {
  try {
    const dir = process.env.LOG_DIR || join(process.cwd(), 'logs')
    mkdirSync(dir, { recursive: true })
    const file = join(dir, `app-${new Date().toISOString().slice(0, 10)}.log`)
    appendFileSync(file, payload + '\n', 'utf8')
  } catch {
    // ignore file logging failures
  }
}

export const logger = {
  debug(category: string, message: string, meta?: LogMeta) {
    if (process.env.LOG_LEVEL === 'debug') {
      const payload = line('debug', category, message, meta)
      console.debug(payload)
      writeFile(payload)
    }
  },
  info(category: string, message: string, meta?: LogMeta) {
    const payload = line('info', category, message, meta)
    console.info(payload)
    writeFile(payload)
  },
  warn(category: string, message: string, meta?: LogMeta) {
    const payload = line('warn', category, message, meta)
    console.warn(payload)
    writeFile(payload)
  },
  error(category: string, message: string, meta?: LogMeta) {
    const payload = line('error', category, message, meta)
    console.error(payload)
    writeFile(payload)
  },
}

type Run = (db: sqlite3.Database, sql: string, params?: unknown[]) => Promise<unknown>

export async function writeAuditLog(
  db: sqlite3.Database,
  run: Run,
  input: {
    level?: Level
    category: string
    message: string
    meta?: LogMeta
    userId?: string | null
    requestId?: string | null
  },
): Promise<void> {
  const level = input.level ?? 'info'
  logger[level](input.category, input.message, input.meta)
  await run(
    db,
    `INSERT INTO audit_logs (id, level, category, message, meta, user_id, request_id)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      randomBytes(10).toString('hex'),
      level,
      input.category,
      input.message,
      JSON.stringify(input.meta ?? {}),
      input.userId ?? null,
      input.requestId ?? null,
    ],
  )
}
