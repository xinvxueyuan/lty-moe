import type { PublicUser } from '../data/auth-types'
import { getDb, promisifyGet, promisifyRun } from '../db/client.server'
import {
  assertCsrf,
  createCsrfToken,
  csrfCookieHeader,
  getCsrfFromRequest,
  getSessionUser,
} from './session.server'

export type AuthContext = {
  user: PublicUser | null
  csrfToken: string
  setCookieHeaders: string[]
}

export async function loadAuthContext(request: Request): Promise<AuthContext> {
  const db = await getDb()
  const user = await getSessionUser(db, promisifyGet, promisifyRun, request)
  const existingCsrf = getCsrfFromRequest(request)
  const csrfToken = existingCsrf || createCsrfToken()
  const setCookieHeaders: string[] = []
  if (!existingCsrf) {
    setCookieHeaders.push(csrfCookieHeader(csrfToken))
  }
  return { user, csrfToken, setCookieHeaders }
}

export function withAuthCookies(response: Response, cookies: string[]): Response {
  if (!cookies.length) return response
  const headers = new Headers(response.headers)
  for (const cookie of cookies) headers.append('Set-Cookie', cookie)
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}

export async function requireUser(request: Request): Promise<PublicUser> {
  const db = await getDb()
  const user = await getSessionUser(db, promisifyGet, promisifyRun, request)
  if (!user) {
    const next = new URL(request.url).pathname + new URL(request.url).search
    throw new Response(null, {
      status: 302,
      headers: { Location: `/login?next=${encodeURIComponent(next)}` },
    })
  }
  return user
}

export async function requireAdmin(request: Request): Promise<PublicUser> {
  const user = await requireUser(request)
  if (user.role !== 'admin') {
    throw new Response('需要管理员权限', { status: 403 })
  }
  return user
}

export function requireCsrf(request: Request, formData: FormData): void {
  assertCsrf(request, String(formData.get('_csrf') ?? ''))
}
