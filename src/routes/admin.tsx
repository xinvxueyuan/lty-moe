import { Form, Link, useActionData, useLoaderData } from 'react-router'
import type { PublicUser } from '../data/auth-types'
import type { Work } from '../data/types'
import {
  adminStats,
  getDb,
  listWorks,
  promisifyAll,
  promisifyRun,
  updateWork,
} from '../db/client.server'
import { listUsers, setUserRole } from '../db/users.server'
import { loadAuthContext, requireAdmin, requireCsrf, withAuthCookies } from '../lib/auth.server'
import type { UserRole } from '../data/auth-types'

export async function loader({ request }: { request: Request }) {
  await requireAdmin(request)
  const auth = await loadAuthContext(request)
  const db = await getDb()
  const [stats, users, works] = await Promise.all([
    adminStats(),
    listUsers(db, promisifyAll),
    listWorks({ status: 'all', includeUnpublished: true }),
  ])
  return withAuthCookies(
    Response.json({ stats, users, works, csrfToken: auth.csrfToken }),
    auth.setCookieHeaders,
  )
}

export async function action({ request }: { request: Request }) {
  await requireAdmin(request)
  const formData = await request.formData()
  requireCsrf(request, formData)
  const intent = String(formData.get('intent') ?? '')
  const db = await getDb()

  if (intent === 'set-role') {
    const userId = String(formData.get('userId') ?? '')
    const role = String(formData.get('role') ?? '') as UserRole
    if (role !== 'admin' && role !== 'creator') return { errors: ['无效角色'] }
    await setUserRole(db, promisifyRun, userId, role)
    return { ok: true }
  }

  if (intent === 'set-status') {
    const workId = String(formData.get('workId') ?? '')
    const status = String(formData.get('status') ?? '')
    if (!['draft', 'published', 'archived'].includes(status)) return { errors: ['无效状态'] }
    await updateWork(workId, { status: status as Work['status'] })
    return { ok: true }
  }

  return { errors: ['未知操作'] }
}

export default function AdminPage() {
  const { stats, users, works, csrfToken } = useLoaderData<{
    stats: { users: number; works: number; drafts: number; published: number }
    users: PublicUser[]
    works: Work[]
    csrfToken: string
  }>()
  const actionData = useActionData<{ ok?: boolean; errors?: string[] }>()

  return (
    <section className="archive-container page-shell dashboard-page">
      <div className="dashboard-header">
        <div>
          <p className="eyebrow">ADMIN / 管理后台</p>
          <h1>
            档案
            <br />
            <em>运营台。</em>
          </h1>
        </div>
        <div className="dashboard-links">
          <Link to="/dashboard">创作者台</Link>
          <Link to="/account">用户中心</Link>
        </div>
      </div>
      {actionData?.ok ? <p className="form-success">已更新。</p> : null}
      {actionData?.errors?.length ? (
        <ul className="submission-errors" role="alert">
          {actionData.errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      ) : null}
      <div className="stat-grid">
        <div className="stat-card">
          <strong>{stats.users}</strong>
          <span>用户</span>
        </div>
        <div className="stat-card">
          <strong>{stats.works}</strong>
          <span>作品</span>
        </div>
        <div className="stat-card">
          <strong>{stats.published}</strong>
          <span>已发布</span>
        </div>
        <div className="stat-card">
          <strong>{stats.drafts}</strong>
          <span>草稿</span>
        </div>
      </div>
      <div className="dashboard-panel">
        <h2>用户</h2>
        <ul className="work-admin-list">
          {users.map((user) => (
            <li key={user.id}>
              <div>
                <strong>{user.displayName}</strong>
                <small>
                  @{user.handle} · {user.email} · {user.role}
                </small>
              </div>
              <Form className="inline-admin-form" method="post">
                <input name="_csrf" type="hidden" value={csrfToken} />
                <input name="intent" type="hidden" value="set-role" />
                <input name="userId" type="hidden" value={user.id} />
                <select aria-label={`角色 ${user.handle}`} defaultValue={user.role} name="role">
                  <option value="creator">creator</option>
                  <option value="admin">admin</option>
                </select>
                <button type="submit">更新角色</button>
              </Form>
            </li>
          ))}
        </ul>
      </div>
      <div className="dashboard-panel">
        <h2>作品审核 / 状态</h2>
        <ul className="work-admin-list">
          {works.map((work) => (
            <li key={work.id}>
              <div>
                <strong>{work.title}</strong>
                <small>
                  {work.status} · @{work.handle} · {work.category}
                </small>
              </div>
              <Form className="inline-admin-form" method="post">
                <input name="_csrf" type="hidden" value={csrfToken} />
                <input name="intent" type="hidden" value="set-status" />
                <input name="workId" type="hidden" value={work.id} />
                <select aria-label={`状态 ${work.id}`} defaultValue={work.status} name="status">
                  <option value="draft">draft</option>
                  <option value="published">published</option>
                  <option value="archived">archived</option>
                </select>
                <button type="submit">更新状态</button>
                <Link to={`/dashboard/works/${work.id}/edit`}>编辑</Link>
              </Form>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
