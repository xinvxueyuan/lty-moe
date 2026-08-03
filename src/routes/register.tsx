import { randomBytes } from 'node:crypto'
import { Form, Link, useActionData, useLoaderData, useNavigation } from 'react-router'
import { Input } from '../components/ui/input'
import { Textarea } from '../components/ui/textarea'
import { getDb, promisifyGet, promisifyRun } from '../db/client.server'
import { issueEmailToken } from '../db/email-tokens.server'
import { createUser, getUserByEmail, getUserByHandle } from '../db/users.server'
import { loadAuthContext, withAuthCookies } from '../lib/auth.server'
import {
  validateDisplayName,
  validateEmail,
  validateHandle,
  validatePassword,
} from '../lib/auth-validate'
import { appBaseUrl, sendMail } from '../lib/mail.server'
import { rateLimit } from '../lib/rate-limit.server'
import { createSession, sessionCookieHeader } from '../lib/session.server'

export async function loader({ request }: { request: Request }) {
  const auth = await loadAuthContext(request)
  if (auth.user) {
    return new Response(null, { status: 302, headers: { Location: '/dashboard' } })
  }
  return withAuthCookies(Response.json({ csrfToken: auth.csrfToken }), auth.setCookieHeaders)
}

export async function action({ request }: { request: Request }) {
  const formData = await request.formData()
  const auth = await loadAuthContext(request)
  const email = String(formData.get('email') ?? '')
  const handle = String(formData.get('handle') ?? '')
  const displayName = String(formData.get('displayName') ?? '')
  const password = String(formData.get('password') ?? '')
  const bio = String(formData.get('bio') ?? '').slice(0, 500)
  const errors: string[] = []

  if (String(formData.get('_csrf') ?? '') !== auth.csrfToken) {
    errors.push('安全校验失败，请刷新页面重试。')
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local'
  const limited = rateLimit(`register:${ip}`, 5, 60 * 60_000)
  if (!limited.ok) return { errors: [`注册过于频繁，请 ${limited.retryAfterSec} 秒后再试。`] }

  for (const err of [
    validateEmail(email),
    validateHandle(handle),
    validateDisplayName(displayName),
    validatePassword(password),
  ]) {
    if (err) errors.push(err)
  }
  if (errors.length) return { errors }

  const db = await getDb()
  if (await getUserByEmail(db, promisifyGet, email)) errors.push('该邮箱已被注册。')
  if (await getUserByHandle(db, promisifyGet, handle.replace(/^@/, '').trim())) {
    errors.push('该主页 ID 已被占用。')
  }
  if (errors.length) return { errors }

  const id = `user-${randomBytes(8).toString('hex')}`
  const cleanHandle = handle.replace(/^@/, '').trim()
  await createUser(db, promisifyRun, {
    id,
    email,
    handle: cleanHandle,
    displayName: displayName.replace(/\s+/g, ' ').trim(),
    password,
    bio,
    role: 'creator',
  })
  try {
    const name = displayName.replace(/\s+/g, ' ').trim()
    const verifyToken = await issueEmailToken(db, promisifyRun, id, 'verify-email', 24 * 60)
    await sendMail({
      to: email,
      template: 'welcome',
      vars: { name, url: `${appBaseUrl(request)}/dashboard` },
    })
    await sendMail({
      to: email,
      template: 'verify-email',
      vars: { name, url: `${appBaseUrl(request)}/verify-email?token=${verifyToken}` },
    })
  } catch {
    // mail is best-effort
  }
  const token = await createSession(db, promisifyRun, id, {
    userAgent: request.headers.get('user-agent') || '',
    ip: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local',
  })
  const headers = new Headers({ Location: '/dashboard' })
  headers.append('Set-Cookie', sessionCookieHeader(token))
  return new Response(null, { status: 303, headers })
}

export default function RegisterPage() {
  const data = useLoaderData<{ csrfToken: string }>()
  const actionData = useActionData<{ errors?: string[] }>()
  const navigation = useNavigation()
  const busy = navigation.state === 'submitting'

  return (
    <section className="archive-container page-shell auth-page">
      <div className="auth-card">
        <p className="eyebrow">JOIN / 注册</p>
        <h1>
          成为
          <br />
          <em>档案创作者。</em>
        </h1>
        {actionData?.errors?.length ? (
          <ul className="submission-errors" role="alert">
            {actionData.errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        ) : null}
        <Form className="submission-form" method="post">
          <input name="_csrf" type="hidden" value={data.csrfToken} />
          <label className="submission-field">
            <span>邮箱</span>
            <Input aria-label="邮箱" autoComplete="email" name="email" required type="email" />
          </label>
          <label className="submission-field">
            <span>显示名称</span>
            <Input aria-label="显示名称" name="displayName" required />
          </label>
          <label className="submission-field">
            <span>主页 ID</span>
            <Input aria-label="主页 ID" name="handle" placeholder="miao_official" required />
          </label>
          <label className="submission-field">
            <span>密码</span>
            <Input
              aria-label="密码"
              autoComplete="new-password"
              name="password"
              required
              type="password"
            />
          </label>
          <label className="submission-field">
            <span>简介（可选）</span>
            <Textarea aria-label="简介" name="bio" rows={3} />
          </label>
          <button className="submission-button" disabled={busy} type="submit">
            {busy ? '创建中…' : '创建账号'}
          </button>
        </Form>
        <p className="auth-switch">
          已有账号？ <Link to="/login">去登录</Link>
        </p>
      </div>
    </section>
  )
}
