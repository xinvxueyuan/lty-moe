import { Form, Link, useActionData, useLoaderData, useNavigation } from 'react-router'
import { Input } from '../components/ui/input'
import { getDb, promisifyGet, promisifyRun } from '../db/client.server'
import { issueEmailToken } from '../db/email-tokens.server'
import { getUserByEmail } from '../db/users.server'
import { loadAuthContext, withAuthCookies } from '../lib/auth.server'
import { validateEmail } from '../lib/auth-validate'
import { appBaseUrl, sendMail } from '../lib/mail.server'
import { rateLimit } from '../lib/rate-limit.server'

export async function loader({ request }: { request: Request }) {
  const auth = await loadAuthContext(request)
  return withAuthCookies(Response.json({ csrfToken: auth.csrfToken }), auth.setCookieHeaders)
}

export async function action({ request }: { request: Request }) {
  const formData = await request.formData()
  const auth = await loadAuthContext(request)
  if (String(formData.get('_csrf') ?? '') !== auth.csrfToken) {
    return { errors: ['安全校验失败'] }
  }
  const email = String(formData.get('email') ?? '')
  const emailError = validateEmail(email)
  if (emailError) return { errors: [emailError] }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local'
  const limited = rateLimit(`forgot:${ip}`, 5, 60 * 60_000)
  if (!limited.ok) return { errors: ['请求过多，请稍后再试。'] }

  const db = await getDb()
  const user = await getUserByEmail(db, promisifyGet, email)
  // Always return ok to avoid account enumeration
  if (user?.password_hash) {
    const token = await issueEmailToken(db, promisifyRun, user.id, 'reset-password', 60)
    await sendMail({
      to: user.email,
      template: 'reset-password',
      vars: {
        name: user.display_name,
        url: `${appBaseUrl(request)}/reset-password?token=${token}`,
      },
    })
  }
  return { ok: true }
}

export default function ForgotPasswordPage() {
  const { csrfToken } = useLoaderData<{ csrfToken: string }>()
  const actionData = useActionData<{ ok?: boolean; errors?: string[] }>()
  const navigation = useNavigation()
  const busy = navigation.state === 'submitting'

  return (
    <section className="archive-container page-shell auth-page">
      <div className="auth-card">
        <p className="eyebrow">RESET / 重置密码</p>
        <h1>
          找回
          <br />
          <em>访问权。</em>
        </h1>
        {actionData?.ok ? (
          <p className="form-success">若邮箱存在，重置链接已发送（开发环境见 logs/mail）。</p>
        ) : null}
        {actionData?.errors?.length ? (
          <ul className="submission-errors" role="alert">
            {actionData.errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        ) : null}
        <Form className="submission-form" method="post">
          <input name="_csrf" type="hidden" value={csrfToken} />
          <label className="submission-field">
            <span>注册邮箱</span>
            <Input aria-label="邮箱" name="email" required type="email" />
          </label>
          <button className="submission-button" disabled={busy} type="submit">
            {busy ? '发送中…' : '发送重置邮件'}
          </button>
        </Form>
        <p className="auth-switch">
          <Link to="/login">返回登录</Link>
        </p>
      </div>
    </section>
  )
}
