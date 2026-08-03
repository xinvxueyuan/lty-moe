import { Form, Link, useActionData, useLoaderData, useNavigation } from 'react-router'
import { Input } from '../components/ui/input'
import { Textarea } from '../components/ui/textarea'
import {
  allowedAiDisclosures,
  allowedCategories,
  allowedLicenses,
  allowedOrigins,
  type Work,
} from '../data/types'
import { getWorkById, updateWork } from '../db/client.server'
import { loadAuthContext, requireCsrf, requireUser, withAuthCookies } from '../lib/auth.server'
import { validateWorkForm, type WorkFormInput } from '../lib/validate-work'

export async function loader({ request, params }: { request: Request; params: { id: string } }) {
  const user = await requireUser(request)
  const work = await getWorkById(params.id, { allowUnpublished: true })
  if (!work) throw new Response('Not found', { status: 404 })
  if (work.ownerId !== user.id && user.role !== 'admin') {
    throw new Response('无权编辑', { status: 403 })
  }
  const auth = await loadAuthContext(request)
  return withAuthCookies(
    Response.json({ work, csrfToken: auth.csrfToken, user }),
    auth.setCookieHeaders,
  )
}

export async function action({ request, params }: { request: Request; params: { id: string } }) {
  const user = await requireUser(request)
  const existing = await getWorkById(params.id, { allowUnpublished: true })
  if (!existing) throw new Response('Not found', { status: 404 })
  if (existing.ownerId !== user.id && user.role !== 'admin') {
    throw new Response('无权编辑', { status: 403 })
  }

  const formData = await request.formData()
  requireCsrf(request, formData)
  const intent = String(formData.get('intent') ?? 'draft')

  if (intent === 'archive') {
    await updateWork(params.id, { status: 'archived' })
    return new Response(null, { status: 303, headers: { Location: '/dashboard' } })
  }

  const input: WorkFormInput = {
    title: String(formData.get('title') ?? ''),
    creator: String(formData.get('creator') ?? existing.creator),
    handle: String(formData.get('handle') ?? existing.handle),
    category: String(formData.get('category') ?? ''),
    description: String(formData.get('description') ?? ''),
    sourceUrl: String(formData.get('sourceUrl') ?? ''),
    license: String(formData.get('license') ?? ''),
    maintainers: String(formData.get('maintainers') ?? existing.maintainers.join(', ')),
    coAuthors: String(formData.get('coAuthors') ?? existing.coAuthors.join(', ')),
    aiDisclosure: String(formData.get('aiDisclosure') ?? ''),
    origin: String(formData.get('origin') ?? ''),
    copyright: 'on',
    tags: String(formData.get('tags') ?? (existing.tags ?? []).join(', ')),
  }
  const body = String(formData.get('body') ?? '')
  const image = String(formData.get('imageUrl') ?? existing.image).trim()
  const { errors: formErrors, work } = validateWorkForm(input)
  const errors = [...formErrors]
  if (!image) errors.push('图片 URL 不能为空。')
  if (errors.length || !work) return { errors }

  await updateWork(params.id, {
    ...work,
    image,
    body,
    tags: work.tags,
    status: intent === 'publish' ? 'published' : intent === 'draft' ? 'draft' : existing.status,
    ownerId: existing.ownerId ?? user.id,
  })
  return { ok: true }
}

export default function EditWorkPage() {
  const { work, csrfToken } = useLoaderData<{ work: Work; csrfToken: string }>()
  const actionData = useActionData<{ errors?: string[]; ok?: boolean }>()
  const navigation = useNavigation()
  const busy = navigation.state === 'submitting'

  return (
    <section className="archive-container page-shell dashboard-page">
      <div className="dashboard-header">
        <div>
          <p className="eyebrow">EDITOR / 发布后台</p>
          <h1>
            编辑
            <br />
            <em>{work.title}</em>
          </h1>
        </div>
        <div className="dashboard-links">
          <Link to="/dashboard">仪表盘</Link>
          {work.status === 'published' ? <Link to={`/works/${work.id}`}>公开页</Link> : null}
        </div>
      </div>
      {actionData?.ok ? <p className="form-success">已保存。</p> : null}
      {actionData?.errors?.length ? (
        <ul className="submission-errors" role="alert">
          {actionData.errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      ) : null}
      <Form className="editor-layout" method="post">
        <input name="_csrf" type="hidden" value={csrfToken} />
        <div className="dashboard-panel editor-main">
          <label className="submission-field">
            <span>标题</span>
            <Input aria-label="标题" defaultValue={work.title} name="title" required />
          </label>
          <label className="submission-field">
            <span>简介</span>
            <Textarea
              aria-label="简介"
              defaultValue={work.description}
              name="description"
              required
              rows={3}
            />
          </label>
          <label className="submission-field">
            <span>正文</span>
            <Textarea
              aria-label="正文"
              className="editor-body"
              defaultValue={work.body || ''}
              name="body"
              rows={16}
            />
          </label>
        </div>
        <aside className="dashboard-panel editor-side">
          <p className="status-pill">状态：{work.status}</p>
          <label className="submission-field">
            <span>图片 URL</span>
            <Input aria-label="图片 URL" defaultValue={work.image} name="imageUrl" required />
          </label>
          <label className="submission-field">
            <span>类型</span>
            <select
              aria-label="类型"
              className="submission-select"
              defaultValue={work.category}
              name="category"
              required
            >
              {allowedCategories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>
          <label className="submission-field">
            <span>标签</span>
            <Input aria-label="标签" defaultValue={(work.tags ?? []).join(', ')} name="tags" />
          </label>
          <label className="submission-field">
            <span>许可证</span>
            <select
              aria-label="许可证"
              className="submission-select"
              defaultValue={work.license}
              name="license"
              required
            >
              {allowedLicenses.map((license) => (
                <option key={license} value={license}>
                  {license}
                </option>
              ))}
            </select>
          </label>
          <label className="submission-field">
            <span>AI 声明</span>
            <select
              aria-label="AI 声明"
              className="submission-select"
              defaultValue={work.aiDisclosure}
              name="aiDisclosure"
              required
            >
              {allowedAiDisclosures.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <label className="submission-field">
            <span>来源</span>
            <select
              aria-label="来源"
              className="submission-select"
              defaultValue={work.origin}
              name="origin"
              required
            >
              {allowedOrigins.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <label className="submission-field">
            <span>原作链接</span>
            <Input
              aria-label="原作链接"
              defaultValue={work.sourceUrl ?? ''}
              name="sourceUrl"
              type="url"
            />
          </label>
          <div className="editor-actions">
            <button
              className="submission-button"
              disabled={busy}
              name="intent"
              type="submit"
              value="draft"
            >
              存草稿
            </button>
            <button
              className="submission-button submission-button-publish"
              disabled={busy}
              name="intent"
              type="submit"
              value="publish"
            >
              发布
            </button>
            <button
              className="ghost-danger"
              disabled={busy}
              name="intent"
              type="submit"
              value="archive"
            >
              归档
            </button>
          </div>
        </aside>
      </Form>
    </section>
  )
}
