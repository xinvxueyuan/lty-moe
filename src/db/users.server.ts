import type sqlite3 from 'sqlite3'
import type { PublicUser, UserRole } from '../data/auth-types'
import { hashPassword } from '../lib/password.server'

type Run = (db: sqlite3.Database, sql: string, params?: unknown[]) => Promise<unknown>
type Get = (db: sqlite3.Database, sql: string, params?: unknown[]) => Promise<unknown>
type All = (db: sqlite3.Database, sql: string, params?: unknown[]) => Promise<unknown[]>

type UserRow = {
  id: string
  email: string
  handle: string
  display_name: string
  password_hash: string
  role: UserRole
  bio: string
  avatar_url: string | null
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
    password: string
    role?: UserRole
    bio?: string
  },
): Promise<void> {
  const passwordHash = await hashPassword(input.password)
  await run(
    db,
    `INSERT INTO users (id, email, handle, display_name, password_hash, role, bio)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      input.id,
      input.email.toLowerCase(),
      input.handle,
      input.displayName,
      passwordHash,
      input.role ?? 'creator',
      input.bio ?? '',
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

export async function listUsers(db: sqlite3.Database, all: All): Promise<PublicUser[]> {
  const rows = (await all(db, `SELECT * FROM users ORDER BY created_at DESC`)) as UserRow[]
  return rows.map(toPublicUser)
}

export async function updateUserProfile(
  db: sqlite3.Database,
  run: Run,
  id: string,
  input: { displayName: string; bio: string },
): Promise<void> {
  await run(
    db,
    `UPDATE users SET display_name = ?, bio = ?, updated_at = datetime('now') WHERE id = ?`,
    [input.displayName, input.bio, id],
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

export async function countUsers(db: sqlite3.Database, get: Get): Promise<number> {
  const row = (await get(db, `SELECT COUNT(*) AS count FROM users`)) as { count: number }
  return row.count
}
