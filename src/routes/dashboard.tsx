import { Link, useLoaderData } from 'react-router'
import { listWorks } from '../db/client.server'
import { requireUser } from '../lib/auth.server'
import type { Work } from '../data/types'

export async function loader({ request }: { request: Request }) {
  const user = await requireUser(request)
  const works = await listWorks({ ownerId: user.id, status: 'all', includeUnpublished: true })
  return { user, works }
}

export default function DashboardPage() {
  const { user, works } = useLoaderData<{
    user: { displayName: string; handle: string; role: string }
    works: Work[]
  }>()
  const drafts = works.filter((work) => work.status === 'draft')
  const published = works.filter((work) => work.status === 'published')

  return (
    <section className="archive-container page-shell dashboard-page">
      <div className="dashboard-header">
        <div>
          <p className="eyebrow">CREATOR DASHBOARD / 创作者</p>
          <h1>
            创作台
            <br />
            <em>@{user.handle}</em>
          </h1>
        </div>
        <div className="dashboard-links">
          <Link className="dashboard-primary" to="/dashboard/works/new">
            新建作品
          </Link>
          <Link to="/account">用户中心</Link>
          {user.role === 'admin' ? <Link to="/admin">管理后台</Link> : null}
        </div>
      </div>
      <div className="stat-grid">
        <div className="stat-card">
          <strong>{works.length}</strong>
          <span>全部作品</span>
        </div>
        <div className="stat-card">
          <strong>{published.length}</strong>
          <span>已发布</span>
        </div>
        <div className="stat-card">
          <strong>{drafts.length}</strong>
          <span>草稿</span>
        </div>
      </div>
      <div className="dashboard-panel">
        <div className="dashboard-panel-head">
          <h2>我的作品</h2>
          <Link to="/dashboard/works/new">在线编辑器 →</Link>
        </div>
        {works.length === 0 ? (
          <p className="muted-copy">还没有作品。从在线编辑器写第一份草稿吧。</p>
        ) : (
          <ul className="work-admin-list">
            {works.map((work) => (
              <li key={work.id}>
                <div>
                  <strong>{work.title}</strong>
                  <small>
                    {work.status} · {work.category} · {work.updatedAt?.slice(0, 10) || work.date}
                  </small>
                </div>
                <div className="work-admin-actions">
                  <Link to={`/dashboard/works/${work.id}/edit`}>编辑</Link>
                  {work.status === 'published' ? <Link to={`/works/${work.id}`}>查看</Link> : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
