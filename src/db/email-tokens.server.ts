import { createHash, randomBytes } from 'node:crypto'
import type sqlite3 from 'sqlite3'

type Run = (db: sqlite3.Database, sql: string, params?: unknown[]) => Promise<unknown>
type Get = (db: sqlite3.Database, sql: string, params?: unknown[]) => Promise<unknown>

export type EmailPurpose = 'verify-email' | 'reset-password'

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export async function issueEmailToken(
  db: sqlite3.Database,
  run: Run,
  userId: string,
  purpose: EmailPurpose,
  ttlMinutes = 60,
): Promise<string> {
  const token = randomBytes(24).toString('base64url')
  const id = randomBytes(10).toString('hex')
  const expires = new Date(Date.now() + ttlMinutes * 60_000).toISOString()
  await run(
    db,
    `INSERT INTO email_tokens (id, user_id, token_hash, purpose, expires_at) VALUES (?, ?, ?, ?, ?)`,
    [id, userId, hashToken(token), purpose, expires],
  )
  return token
}

export async function consumeEmailToken(
  db: sqlite3.Database,
  get: Get,
  run: Run,
  token: string,
  purpose: EmailPurpose,
): Promise<string | null> {
  const row = (await get(
    db,
    `SELECT id, user_id, expires_at, used_at FROM email_tokens
     WHERE token_hash = ? AND purpose = ?`,
    [hashToken(token), purpose],
  )) as { id: string; user_id: string; expires_at: string; used_at: string | null } | undefined
  if (!row || row.used_at) return null
  if (new Date(row.expires_at).getTime() < Date.now()) return null
  await run(db, `UPDATE email_tokens SET used_at = datetime('now') WHERE id = ?`, [row.id])
  return row.user_id
}
