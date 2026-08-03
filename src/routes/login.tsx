import {
  Form,
  Link,
  useActionData,
  useLoaderData,
  useNavigation,
  useSearchParams,
} from 'react-router'
import { Input } from '../components/ui/input'
import { getDb, promisifyGet, promisifyRun } from '../db/client.server'
import { getUserByEmail } from '../db/users.server'
import { loadAuthContext, withAuthCookies } from '../lib/auth.server'
import { validateEmail, validatePassword } from '../lib/auth-validate'
import { verifyPassword } from '../lib/password.server'
import { rateLimit } from '../lib/rate-limit.server'
import { createSession, sessionCookieHeader } from '../lib/session.server'

export async function loader({ request }: { request: Request }) {
  const auth = await loadAuthContext(request)
  if (auth.user) {
    return new Response(null, { status: 302, headers: { Location: '/dashboard' } })
  }
  const response = Response.json({ csrfToken: auth.csrfToken })
  return withAuthCookies(response, auth.setCookieHeaders)
}

export async function action({ request }: { request: Request }) {
  const formData = await request.formData()
  const auth = await loadAuthContext(request)
  const email = String(formData.get('email') ?? '')
  const password = String(formData.get('password') ?? '')
  const next = String(formData.get('next') ?? '/dashboard') || '/dashboard'
  const errors: string[] = []

  const csrf = String(formData.get('_csrf') ?? '')
  if (csrf !== auth.csrfToken) errors.push('安全校验失败，请刷新页面重试。')

  const emailError = validateEmail(email)
  const passwordError = validatePassword(password)
  if (emailError) errors.push(emailError)
  if (passwordError) errors.push(passwordError)

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local'
  const limited = rateLimit(`login:${ip}`, 10, 15 * 60_000)
  if (!limited.ok) {
    return { errors: [`尝试过多，请 ${limited.retryAfterSec} 秒后再试。`] }
  }

  if (errors.length) return { errors }

  const db = await getDb()
  const user = await getUserByEmail(db, promisifyGet, email)
  if (!user || !(await verifyPassword(password, user.password_hash))) {
    return { errors: ['邮箱或密码不正确。'] }
  }

  const token = await createSession(db, promisifyRun, user.id)
  const headers = new Headers({ Location: next.startsWith('/') ? next : '/dashboard' })
  headers.append('Set-Cookie', sessionCookieHeader(token))
  if (auth.setCookieHeaders[0]) headers.append('Set-Cookie', auth.setCookieHeaders[0])
  return new Response(null, { status: 303, headers })
}

export default function LoginPage() {
  const data = useLoaderData<{ csrfToken: string }>()
  const actionData = useActionData<{ errors?: string[] }>()
  const navigation = useNavigation()
  const [params] = useSearchParams()
  const next = params.get('next') || '/dashboard'
  const busy = navigation.state === 'submitting'

  return (
    <section className="archive-container page-shell auth-page">
      <div className="auth-card">
        <p className="eyebrow">SIGN IN / 登录</p>
        <h1>
          回到
          <br />
          <em>你的档案。</em>
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
          <input name="next" type="hidden" value={next} />
          <label className="submission-field">
            <span>邮箱</span>
            <Input aria-label="邮箱" autoComplete="email" name="email" required type="email" />
          </label>
          <label className="submission-field">
            <span>密码</span>
            <Input
              aria-label="密码"
              autoComplete="current-password"
              name="password"
              required
              type="password"
            />
          </label>
          <button className="submission-button" disabled={busy} type="submit">
            {busy ? '登录中…' : '登录'}
          </button>
        </Form>
        <p className="auth-switch">
          还没有账号？ <Link to="/register">注册创作者</Link>
        </p>
      </div>
    </section>
  )
}
