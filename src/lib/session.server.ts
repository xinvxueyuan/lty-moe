import { createHash, randomBytes } from 'node:crypto'
import type sqlite3 from 'sqlite3'
import type { PublicUser } from '../data/auth-types'
import { getUserById, toPublicUser } from '../db/users.server'

const SESSION_COOKIE = 'lty_session'
const CSRF_COOKIE = 'lty_csrf'
const SESSION_DAYS = 14

type Run = (db: sqlite3.Database, sql: string, params?: unknown[]) => Promise<unknown>
type Get = (db: sqlite3.Database, sql: string, params?: unknown[]) => Promise<unknown>

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export function parseCookies(header: string | null): Record<string, string> {
  if (!header) return {}
  const out: Record<string, string> = {}
  for (const part of header.split(';')) {
    const idx = part.indexOf('=')
    if (idx === -1) continue
    const key = part.slice(0, idx).trim()
    const value = part.slice(idx + 1).trim()
    if (key) out[key] = decodeURIComponent(value)
  }
  return out
}

function cookieOptions(maxAgeSec: number, httpOnly: boolean): string {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  return `Path=/; Max-Age=${maxAgeSec}; SameSite=Lax${httpOnly ? '; HttpOnly' : ''}${secure}`
}

export function sessionCookieHeader(token: string): string {
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; ${cookieOptions(SESSION_DAYS * 86400, true)}`
}

export function clearSessionCookieHeader(): string {
  return `${SESSION_COOKIE}=; ${cookieOptions(0, true)}`
}

export function csrfCookieHeader(token: string): string {
  return `${CSRF_COOKIE}=${encodeURIComponent(token)}; ${cookieOptions(SESSION_DAYS * 86400, false)}`
}

export function createCsrfToken(): string {
  return randomBytes(24).toString('base64url')
}

export async function createSession(
  db: sqlite3.Database,
  run: Run,
  userId: string,
): Promise<string> {
  const token = randomBytes(32).toString('base64url')
  const id = randomBytes(12).toString('hex')
  const expires = new Date(Date.now() + SESSION_DAYS * 86400_000).toISOString()
  await run(db, `INSERT INTO sessions (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, ?)`, [
    id,
    userId,
    hashToken(token),
    expires,
  ])
  return token
}

export async function destroySession(
  db: sqlite3.Database,
  run: Run,
  token: string | undefined,
): Promise<void> {
  if (!token) return
  await run(db, `DELETE FROM sessions WHERE token_hash = ?`, [hashToken(token)])
}

export async function getSessionUser(
  db: sqlite3.Database,
  get: Get,
  run: Run,
  request: Request,
): Promise<PublicUser | null> {
  const cookies = parseCookies(request.headers.get('Cookie'))
  const token = cookies[SESSION_COOKIE]
  if (!token) return null
  const row = (await get(db, `SELECT user_id, expires_at FROM sessions WHERE token_hash = ?`, [
    hashToken(token),
  ])) as { user_id: string; expires_at: string } | undefined
  if (!row) return null
  if (new Date(row.expires_at).getTime() < Date.now()) {
    await run(db, `DELETE FROM sessions WHERE token_hash = ?`, [hashToken(token)])
    return null
  }
  const user = await getUserById(db, get, row.user_id)
  return user ? toPublicUser(user) : null
}

export function getCsrfFromRequest(request: Request): string | null {
  const cookies = parseCookies(request.headers.get('Cookie'))
  return cookies[CSRF_COOKIE] ?? null
}

export function assertCsrf(request: Request, formToken: string | null | undefined): void {
  const cookieToken = getCsrfFromRequest(request)
  if (!cookieToken || !formToken || cookieToken !== formToken) {
    throw new Response('CSRF 校验失败', { status: 403 })
  }
}

export { SESSION_COOKIE, CSRF_COOKIE }
