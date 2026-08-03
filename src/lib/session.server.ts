import { createHash, randomBytes } from 'node:crypto'
import type sqlite3 from 'sqlite3'
import type { PublicUser, SessionInfo } from '../data/auth-types'
import { getUserById, toPublicUser } from '../db/users.server'

const SESSION_COOKIE = 'lty_session'
const CSRF_COOKIE = 'lty_csrf'
const SESSION_DAYS = 30

type Run = (db: sqlite3.Database, sql: string, params?: unknown[]) => Promise<unknown>
type Get = (db: sqlite3.Database, sql: string, params?: unknown[]) => Promise<unknown>
type All = (db: sqlite3.Database, sql: string, params?: unknown[]) => Promise<unknown[]>

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

function deviceLabel(userAgent: string): string {
  const ua = userAgent.toLowerCase()
  if (ua.includes('iphone') || ua.includes('ipad')) return 'iOS'
  if (ua.includes('android')) return 'Android'
  if (ua.includes('mac os') || ua.includes('macintosh')) return 'macOS'
  if (ua.includes('windows')) return 'Windows'
  if (ua.includes('linux')) return 'Linux'
  return 'Device'
}

export async function createSession(
  db: sqlite3.Database,
  run: Run,
  userId: string,
  meta: { userAgent?: string; ip?: string } = {},
): Promise<string> {
  const token = randomBytes(32).toString('base64url')
  const id = randomBytes(12).toString('hex')
  const expires = new Date(Date.now() + SESSION_DAYS * 86400_000).toISOString()
  const userAgent = (meta.userAgent || '').slice(0, 300)
  const ip = (meta.ip || '').slice(0, 80)
  await run(
    db,
    `INSERT INTO sessions (id, user_id, token_hash, expires_at, user_agent, ip, label, last_seen_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
    [id, userId, hashToken(token), expires, userAgent, ip, deviceLabel(userAgent)],
  )
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

export async function destroySessionById(
  db: sqlite3.Database,
  run: Run,
  userId: string,
  sessionId: string,
): Promise<void> {
  await run(db, `DELETE FROM sessions WHERE id = ? AND user_id = ?`, [sessionId, userId])
}

export async function listUserSessions(
  db: sqlite3.Database,
  all: All,
  userId: string,
  currentToken?: string,
): Promise<SessionInfo[]> {
  const rows = (await all(
    db,
    `SELECT id, label, user_agent, ip, created_at, last_seen_at, token_hash
     FROM sessions WHERE user_id = ? AND expires_at > datetime('now')
     ORDER BY last_seen_at DESC`,
    [userId],
  )) as {
    id: string
    label: string
    user_agent: string
    ip: string
    created_at: string
    last_seen_at: string
    token_hash: string
  }[]
  const currentHash = currentToken ? hashToken(currentToken) : ''
  return rows.map((row) => ({
    id: row.id,
    label: row.label || 'Device',
    userAgent: row.user_agent,
    ip: row.ip,
    createdAt: row.created_at,
    lastSeenAt: row.last_seen_at,
    current: Boolean(currentHash && row.token_hash === currentHash),
  }))
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
  const row = (await get(db, `SELECT id, user_id, expires_at FROM sessions WHERE token_hash = ?`, [
    hashToken(token),
  ])) as { id: string; user_id: string; expires_at: string } | undefined
  if (!row) return null
  if (new Date(row.expires_at).getTime() < Date.now()) {
    await run(db, `DELETE FROM sessions WHERE token_hash = ?`, [hashToken(token)])
    return null
  }

  // Sliding expiry + last seen for multi-device session health
  const newExpiry = new Date(Date.now() + SESSION_DAYS * 86400_000).toISOString()
  await run(db, `UPDATE sessions SET last_seen_at = datetime('now'), expires_at = ? WHERE id = ?`, [
    newExpiry,
    row.id,
  ])

  const user = await getUserById(db, get, row.user_id)
  return user ? toPublicUser(user) : null
}

export function getSessionToken(request: Request): string | undefined {
  return parseCookies(request.headers.get('Cookie'))[SESSION_COOKIE]
}

export function requestIp(request: Request): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local'
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

export { SESSION_COOKIE, CSRF_COOKIE, hashToken }
