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
import { consumeEmailToken } from '../db/email-tokens.server'
import { setPassword } from '../db/users.server'
import { loadAuthContext, withAuthCookies } from '../lib/auth.server'
import { validatePassword } from '../lib/auth-validate'

export async function loader({ request }: { request: Request }) {
  const auth = await loadAuthContext(request)
  const token = new URL(request.url).searchParams.get('token') || ''
  return withAuthCookies(Response.json({ csrfToken: auth.csrfToken, token }), auth.setCookieHeaders)
}

export async function action({ request }: { request: Request }) {
  const formData = await request.formData()
  const auth = await loadAuthContext(request)
  if (String(formData.get('_csrf') ?? '') !== auth.csrfToken) {
    return { errors: ['安全校验失败'] }
  }
  const token = String(formData.get('token') ?? '')
  const password = String(formData.get('password') ?? '')
  const passwordError = validatePassword(password)
  if (passwordError) return { errors: [passwordError] }

  const db = await getDb()
  const userId = await consumeEmailToken(db, promisifyGet, promisifyRun, token, 'reset-password')
  if (!userId) return { errors: ['链接无效或已过期。'] }
  await setPassword(db, promisifyRun, userId, password)
  return new Response(null, { status: 303, headers: { Location: '/login' } })
}

export default function ResetPasswordPage() {
  const { csrfToken, token } = useLoaderData<{ csrfToken: string; token: string }>()
  const actionData = useActionData<{ errors?: string[] }>()
  const navigation = useNavigation()
  const [params] = useSearchParams()
  const busy = navigation.state === 'submitting'
  const value = token || params.get('token') || ''

  return (
    <section className="archive-container page-shell auth-page">
      <div className="auth-card">
        <p className="eyebrow">NEW PASSWORD</p>
        <h1>
          设置
          <br />
          <em>新密码。</em>
        </h1>
        {actionData?.errors?.length ? (
          <ul className="submission-errors" role="alert">
            {actionData.errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        ) : null}
        <Form className="submission-form" method="post">
          <input name="_csrf" type="hidden" value={csrfToken} />
          <input name="token" type="hidden" value={value} />
          <label className="submission-field">
            <span>新密码</span>
            <Input aria-label="新密码" name="password" required type="password" />
          </label>
          <button className="submission-button" disabled={busy || !value} type="submit">
            {busy ? '保存中…' : '更新密码'}
          </button>
        </Form>
        <p className="auth-switch">
          <Link to="/login">返回登录</Link>
        </p>
      </div>
    </section>
  )
}
