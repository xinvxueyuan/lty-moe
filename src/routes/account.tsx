import { Form, Link, useActionData, useLoaderData, useNavigation } from 'react-router'
import type { PublicUser, SessionInfo } from '../data/auth-types'
import { Input } from '../components/ui/input'
import { Textarea } from '../components/ui/textarea'
import { getDb, promisifyAll, promisifyGet, promisifyRun } from '../db/client.server'
import { issueEmailToken } from '../db/email-tokens.server'
import { updateUserProfile } from '../db/users.server'
import { useI18n } from '../i18n/i18n'
import { loadAuthContext, requireCsrf, requireUser, withAuthCookies } from '../lib/auth.server'
import { validateDisplayName } from '../lib/auth-validate'
import { appBaseUrl, sendMail } from '../lib/mail.server'
import { destroySessionById, getSessionToken, listUserSessions } from '../lib/session.server'

export async function loader({ request }: { request: Request }) {
  const user = await requireUser(request)
  const auth = await loadAuthContext(request)
  const db = await getDb()
  const sessions = await listUserSessions(db, promisifyAll, user.id, getSessionToken(request))
  return withAuthCookies(
    Response.json({ user, csrfToken: auth.csrfToken, sessions }),
    auth.setCookieHeaders,
  )
}

export async function action({ request }: { request: Request }) {
  const user = await requireUser(request)
  const formData = await request.formData()
  requireCsrf(request, formData)
  const intent = String(formData.get('intent') ?? 'profile')
  const db = await getDb()

  if (intent === 'revoke-session') {
    const sessionId = String(formData.get('sessionId') ?? '')
    await destroySessionById(db, promisifyRun, user.id, sessionId)
    return { ok: true, message: 'session-revoked' }
  }

  if (intent === 'resend-verify') {
    if (user.emailVerified) return { ok: true }
    const token = await issueEmailToken(db, promisifyRun, user.id, 'verify-email', 24 * 60)
    await sendMail({
      to: user.email,
      template: 'verify-email',
      vars: {
        name: user.displayName,
        url: `${appBaseUrl(request)}/verify-email?token=${token}`,
      },
    })
    return { ok: true, message: 'verify-sent' }
  }

  const displayName = String(formData.get('displayName') ?? '')
  const bio = String(formData.get('bio') ?? '').slice(0, 500)
  const locale = String(formData.get('locale') ?? user.locale)
  const nameError = validateDisplayName(displayName)
  if (nameError) return { errors: [nameError] }
  await updateUserProfile(db, promisifyRun, user.id, {
    displayName: displayName.replace(/\s+/g, ' ').trim(),
    bio,
    locale,
  })
  // touch user row so get uses new locale next request
  await promisifyGet(db, `SELECT id FROM users WHERE id = ?`, [user.id])
  return { ok: true }
}

export default function AccountPage() {
  const { t } = useI18n()
  const { user, csrfToken, sessions } = useLoaderData<{
    user: PublicUser
    csrfToken: string
    sessions: SessionInfo[]
  }>()
  const actionData = useActionData<{ errors?: string[]; ok?: boolean; message?: string }>()
  const navigation = useNavigation()
  const busy = navigation.state === 'submitting'

  return (
    <section className="archive-container page-shell dashboard-page">
      <div className="dashboard-header">
        <div>
          <p className="eyebrow">USER CENTER</p>
          <h1>
            {t('account.title')}
            <br />
            <em>{user.displayName}</em>
          </h1>
        </div>
        <div className="dashboard-links">
          <Link to="/dashboard">{t('nav.dashboard')}</Link>
          {user.role === 'admin' ? <Link to="/admin">{t('nav.admin')}</Link> : null}
        </div>
      </div>
      {actionData?.ok ? <p className="form-success">{t('common.save')} ✓</p> : null}
      {actionData?.errors?.length ? (
        <ul className="submission-errors" role="alert">
          {actionData.errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      ) : null}

      {!user.emailVerified ? (
        <div className="dashboard-panel">
          <p className="muted-copy">
            {t('account.verifyEmail')}：{user.email}
          </p>
          <Form method="post">
            <input name="_csrf" type="hidden" value={csrfToken} />
            <input name="intent" type="hidden" value="resend-verify" />
            <button className="submission-button" disabled={busy} type="submit">
              {t('account.resendVerify')}
            </button>
          </Form>
        </div>
      ) : null}

      <Form className="submission-form dashboard-panel" method="post">
        <input name="_csrf" type="hidden" value={csrfToken} />
        <input name="intent" type="hidden" value="profile" />
        <label className="submission-field">
          <span>邮箱</span>
          <Input disabled value={user.email} />
        </label>
        <label className="submission-field">
          <span>主页 ID</span>
          <Input disabled value={`@${user.handle}`} />
        </label>
        <label className="submission-field">
          <span>显示名称</span>
          <Input
            aria-label="显示名称"
            defaultValue={user.displayName}
            name="displayName"
            required
          />
        </label>
        <label className="submission-field">
          <span>简介</span>
          <Textarea aria-label="简介" defaultValue={user.bio} name="bio" rows={4} />
        </label>
        <label className="submission-field">
          <span>{t('account.locale')}</span>
          <select
            aria-label={t('account.locale')}
            className="submission-select"
            defaultValue={user.locale}
            name="locale"
          >
            <option value="zh-CN">中文</option>
            <option value="en">English</option>
          </select>
        </label>
        <button className="submission-button" disabled={busy} type="submit">
          {busy ? t('common.loading') : t('common.save')}
        </button>
      </Form>

      <div className="dashboard-panel">
        <h2>{t('account.sessions')}</h2>
        <p className="muted-copy">多设备可同时保持登录；可单独注销其他设备。</p>
        <ul className="work-admin-list">
          {sessions.map((session) => (
            <li key={session.id}>
              <div>
                <strong>
                  {session.label} {session.current ? `· ${t('account.current')}` : ''}
                </strong>
                <small>
                  {session.ip || '—'} · {session.userAgent.slice(0, 80) || 'unknown'} · last{' '}
                  {session.lastSeenAt}
                </small>
              </div>
              {!session.current ? (
                <Form method="post">
                  <input name="_csrf" type="hidden" value={csrfToken} />
                  <input name="intent" type="hidden" value="revoke-session" />
                  <input name="sessionId" type="hidden" value={session.id} />
                  <button type="submit">{t('account.revoke')}</button>
                </Form>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
