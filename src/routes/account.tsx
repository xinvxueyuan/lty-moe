import { Form, Link, useActionData, useLoaderData, useNavigation } from 'react-router'
import { Input } from '../components/ui/input'
import { Textarea } from '../components/ui/textarea'
import { getDb, promisifyRun } from '../db/client.server'
import { updateUserProfile } from '../db/users.server'
import { loadAuthContext, requireCsrf, requireUser, withAuthCookies } from '../lib/auth.server'
import { validateDisplayName } from '../lib/auth-validate'

export async function loader({ request }: { request: Request }) {
  const user = await requireUser(request)
  const auth = await loadAuthContext(request)
  return withAuthCookies(Response.json({ user, csrfToken: auth.csrfToken }), auth.setCookieHeaders)
}

export async function action({ request }: { request: Request }) {
  const user = await requireUser(request)
  const formData = await request.formData()
  requireCsrf(request, formData)
  const displayName = String(formData.get('displayName') ?? '')
  const bio = String(formData.get('bio') ?? '').slice(0, 500)
  const nameError = validateDisplayName(displayName)
  if (nameError) return { errors: [nameError] }
  const db = await getDb()
  await updateUserProfile(db, promisifyRun, user.id, {
    displayName: displayName.replace(/\s+/g, ' ').trim(),
    bio,
  })
  return { ok: true }
}

export default function AccountPage() {
  const { user, csrfToken } = useLoaderData<{
    user: {
      email: string
      handle: string
      displayName: string
      bio: string
      role: string
    }
    csrfToken: string
  }>()
  const actionData = useActionData<{ errors?: string[]; ok?: boolean }>()
  const navigation = useNavigation()
  const busy = navigation.state === 'submitting'

  return (
    <section className="archive-container page-shell dashboard-page">
      <div className="dashboard-header">
        <div>
          <p className="eyebrow">USER CENTER / 用户中心</p>
          <h1>
            你好，
            <em>{user.displayName}</em>
          </h1>
        </div>
        <div className="dashboard-links">
          <Link to="/dashboard">创作者仪表盘</Link>
          {user.role === 'admin' ? <Link to="/admin">管理后台</Link> : null}
        </div>
      </div>
      {actionData?.ok ? <p className="form-success">资料已保存。</p> : null}
      {actionData?.errors?.length ? (
        <ul className="submission-errors" role="alert">
          {actionData.errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      ) : null}
      <Form className="submission-form dashboard-panel" method="post">
        <input name="_csrf" type="hidden" value={csrfToken} />
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
        <button className="submission-button" disabled={busy} type="submit">
          {busy ? '保存中…' : '保存资料'}
        </button>
      </Form>
    </section>
  )
}
