import { randomBytes } from 'node:crypto'
import { getDb, promisifyGet, promisifyRun } from '../db/client.server'
import { createUser, getUserByEmail, getUserByGithubId, linkGithub } from '../db/users.server'
import { writeAuditLog } from '../lib/logger.server'
import { createSession, parseCookies, sessionCookieHeader } from '../lib/session.server'
import { STATE_COOKIE } from './auth.github'

type GhUser = { id: number; login: string; name?: string | null; avatar_url?: string | null }
type GhEmail = { email: string; primary: boolean; verified: boolean }

export async function loader({ request }: { request: Request }) {
  const clientId = process.env.GITHUB_CLIENT_ID
  const clientSecret = process.env.GITHUB_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    return new Response('GitHub OAuth 未配置', { status: 503 })
  }

  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state') || ''
  const cookies = parseCookies(request.headers.get('Cookie'))
  const cookieState = cookies[STATE_COOKIE] || ''
  if (!code || !state || state !== cookieState) {
    return new Response('OAuth state 无效', { status: 400 })
  }

  const nextRaw = state.split('.')[1]
  const next = nextRaw ? Buffer.from(nextRaw, 'base64url').toString('utf8') : '/dashboard'

  const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
    }),
  })
  const tokenJson = (await tokenRes.json()) as { access_token?: string; error?: string }
  if (!tokenJson.access_token) {
    return new Response(`GitHub token 失败: ${tokenJson.error || 'unknown'}`, { status: 400 })
  }

  const ghHeaders = {
    accept: 'application/vnd.github+json',
    authorization: `Bearer ${tokenJson.access_token}`,
    'user-agent': 'lty-moe',
  }
  const userRes = await fetch('https://api.github.com/user', { headers: ghHeaders })
  const ghUser = (await userRes.json()) as GhUser
  const emailRes = await fetch('https://api.github.com/user/emails', { headers: ghHeaders })
  const emails = (await emailRes.json()) as GhEmail[]
  const primary =
    emails.find((item) => item.primary && item.verified)?.email ||
    emails.find((item) => item.verified)?.email ||
    `${ghUser.login}@users.noreply.github.com`

  const db = await getDb()
  let user = await getUserByGithubId(db, promisifyGet, String(ghUser.id))
  if (!user) {
    const byEmail = await getUserByEmail(db, promisifyGet, primary)
    if (byEmail) {
      await linkGithub(db, promisifyRun, byEmail.id, String(ghUser.id), ghUser.avatar_url)
      user = await getUserByGithubId(db, promisifyGet, String(ghUser.id))
    } else {
      const id = `user-${randomBytes(8).toString('hex')}`
      let handle = ghUser.login.replace(/[^a-zA-Z0-9_.-]/g, '').slice(0, 32) || `gh${ghUser.id}`
      // ensure unique handle
      let suffix = 0
      while (await promisifyGet(db, `SELECT id FROM users WHERE handle = ?`, [handle])) {
        suffix += 1
        handle = `${ghUser.login.slice(0, 28)}${suffix}`
      }
      await createUser(db, promisifyRun, {
        id,
        email: primary,
        handle,
        displayName: ghUser.name || ghUser.login,
        password: null,
        githubId: String(ghUser.id),
        emailVerifiedAt: new Date().toISOString(),
        avatarUrl: ghUser.avatar_url,
      })
      user = await getUserByGithubId(db, promisifyGet, String(ghUser.id))
    }
  }

  if (!user) return new Response('无法创建用户', { status: 500 })

  await writeAuditLog(db, promisifyRun, {
    category: 'auth',
    message: 'github_oauth_login',
    userId: user.id,
    meta: { githubId: ghUser.id },
  })

  const sessionToken = await createSession(db, promisifyRun, user.id, {
    userAgent: request.headers.get('user-agent') || '',
    ip: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local',
  })

  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  const headers = new Headers({
    Location: next.startsWith('/') ? next : '/dashboard',
  })
  headers.append('Set-Cookie', sessionCookieHeader(sessionToken))
  headers.append(
    'Set-Cookie',
    `${STATE_COOKIE}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax${secure}`,
  )
  return new Response(null, { status: 303, headers })
}
