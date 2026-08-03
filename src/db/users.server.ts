import type sqlite3 from 'sqlite3'
import type { PublicUser, UserRole } from '../data/auth-types'
import { hashPassword } from '../lib/password.server'

type Run = (db: sqlite3.Database, sql: string, params?: unknown[]) => Promise<unknown>
type Get = (db: sqlite3.Database, sql: string, params?: unknown[]) => Promise<unknown>
type All = (db: sqlite3.Database, sql: string, params?: unknown[]) => Promise<unknown[]>

export type UserRow = {
  id: string
  email: string
  handle: string
  display_name: string
  password_hash: string | null
  role: UserRole
  bio: string
  avatar_url: string | null
  github_id?: string | null
  email_verified_at?: string | null
  locale?: string
  created_at: string
}

export function toPublicUser(row: UserRow): PublicUser {
  return {
    id: row.id,
    email: row.email,
    handle: row.handle,
    displayName: row.display_name,
    role: row.role,
    bio: row.bio,
    avatarUrl: row.avatar_url,
    createdAt: row.created_at,
    emailVerified: Boolean(row.email_verified_at),
    hasPassword: Boolean(row.password_hash),
    githubLinked: Boolean(row.github_id),
    locale: row.locale || 'zh-CN',
  }
}

export async function createUser(
  db: sqlite3.Database,
  run: Run,
  input: {
    id: string
    email: string
    handle: string
    displayName: string
    password?: string | null
    role?: UserRole
    bio?: string
    githubId?: string | null
    emailVerifiedAt?: string | null
    avatarUrl?: string | null
    locale?: string
  },
): Promise<void> {
  const passwordHash = input.password ? await hashPassword(input.password) : null
  await run(
    db,
    `INSERT INTO users (
      id, email, handle, display_name, password_hash, role, bio,
      github_id, email_verified_at, avatar_url, locale
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.id,
      input.email.toLowerCase(),
      input.handle,
      input.displayName,
      passwordHash,
      input.role ?? 'creator',
      input.bio ?? '',
      input.githubId ?? null,
      input.emailVerifiedAt ?? null,
      input.avatarUrl ?? null,
      input.locale ?? 'zh-CN',
    ],
  )
}

export async function getUserByEmail(
  db: sqlite3.Database,
  get: Get,
  email: string,
): Promise<UserRow | null> {
  const row = (await get(db, `SELECT * FROM users WHERE email = ?`, [email.toLowerCase()])) as
    UserRow | undefined
  return row ?? null
}

export async function getUserByHandle(
  db: sqlite3.Database,
  get: Get,
  handle: string,
): Promise<UserRow | null> {
  const row = (await get(db, `SELECT * FROM users WHERE handle = ?`, [handle])) as
    UserRow | undefined
  return row ?? null
}

export async function getUserById(
  db: sqlite3.Database,
  get: Get,
  id: string,
): Promise<UserRow | null> {
  const row = (await get(db, `SELECT * FROM users WHERE id = ?`, [id])) as UserRow | undefined
  return row ?? null
}

export async function getUserByGithubId(
  db: sqlite3.Database,
  get: Get,
  githubId: string,
): Promise<UserRow | null> {
  const row = (await get(db, `SELECT * FROM users WHERE github_id = ?`, [githubId])) as
    UserRow | undefined
  return row ?? null
}

export async function listUsers(db: sqlite3.Database, all: All): Promise<PublicUser[]> {
  const rows = (await all(db, `SELECT * FROM users ORDER BY created_at DESC`)) as UserRow[]
  return rows.map(toPublicUser)
}

export async function updateUserProfile(
  db: sqlite3.Database,
  run: Run,
  id: string,
  input: { displayName: string; bio: string; locale?: string },
): Promise<void> {
  await run(
    db,
    `UPDATE users SET display_name = ?, bio = ?, locale = COALESCE(?, locale), updated_at = datetime('now') WHERE id = ?`,
    [input.displayName, input.bio, input.locale ?? null, id],
  )
}

export async function setUserRole(
  db: sqlite3.Database,
  run: Run,
  id: string,
  role: UserRole,
): Promise<void> {
  await run(db, `UPDATE users SET role = ?, updated_at = datetime('now') WHERE id = ?`, [role, id])
}

export async function setEmailVerified(db: sqlite3.Database, run: Run, id: string): Promise<void> {
  await run(
    db,
    `UPDATE users SET email_verified_at = datetime('now'), updated_at = datetime('now') WHERE id = ?`,
    [id],
  )
}

export async function setPassword(
  db: sqlite3.Database,
  run: Run,
  id: string,
  password: string,
): Promise<void> {
  const passwordHash = await hashPassword(password)
  await run(db, `UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?`, [
    passwordHash,
    id,
  ])
}

export async function linkGithub(
  db: sqlite3.Database,
  run: Run,
  id: string,
  githubId: string,
  avatarUrl?: string | null,
): Promise<void> {
  await run(
    db,
    `UPDATE users SET github_id = ?, avatar_url = COALESCE(?, avatar_url), email_verified_at = COALESCE(email_verified_at, datetime('now')), updated_at = datetime('now') WHERE id = ?`,
    [githubId, avatarUrl ?? null, id],
  )
}

export async function countUsers(db: sqlite3.Database, get: Get): Promise<number> {
  const row = (await get(db, `SELECT COUNT(*) AS count FROM users`)) as { count: number }
  return row.count
}
