import { randomBytes } from 'node:crypto'
import { Form, Link, useActionData, useLoaderData, useNavigation } from 'react-router'
import { Input } from '../components/ui/input'
import { Textarea } from '../components/ui/textarea'
import {
  allowedAiDisclosures,
  allowedCategories,
  allowedLicenses,
  allowedOrigins,
} from '../data/types'
import { insertWork } from '../db/client.server'
import { loadAuthContext, requireCsrf, requireUser, withAuthCookies } from '../lib/auth.server'
import { slugFromText, validateWorkForm, type WorkFormInput } from '../lib/validate-work'

export async function loader({ request }: { request: Request }) {
  await requireUser(request)
  const auth = await loadAuthContext(request)
  return withAuthCookies(Response.json({ csrfToken: auth.csrfToken }), auth.setCookieHeaders)
}

export async function action({ request }: { request: Request }) {
  const user = await requireUser(request)
  const formData = await request.formData()
  requireCsrf(request, formData)
  const intent = String(formData.get('intent') ?? 'draft')
  const input: WorkFormInput = {
    title: String(formData.get('title') ?? ''),
    creator: String(formData.get('creator') ?? user.displayName),
    handle: String(formData.get('handle') ?? user.handle),
    category: String(formData.get('category') ?? ''),
    description: String(formData.get('description') ?? ''),
    sourceUrl: String(formData.get('sourceUrl') ?? ''),
    license: String(formData.get('license') ?? ''),
    maintainers: String(formData.get('maintainers') ?? user.displayName),
    coAuthors: String(formData.get('coAuthors') ?? ''),
    aiDisclosure: String(formData.get('aiDisclosure') ?? ''),
    origin: String(formData.get('origin') ?? ''),
    copyright: 'on',
    tags: String(formData.get('tags') ?? ''),
  }
  const body = String(formData.get('body') ?? '')
  const image = String(formData.get('imageUrl') ?? '').trim()
  const { errors: formErrors, work } = validateWorkForm(input)
  const errors = [...formErrors]
  if (!image.startsWith('/uploads/') && !image.startsWith('http')) {
    errors.push('请提供作品图片 URL（可先用图床 API 上传）。')
  }
  if (errors.length || !work) return { errors }

  const id = `${slugFromText(work.title) || 'untitled'}-${randomBytes(4).toString('hex')}`
  await insertWork({
    ...work,
    id,
    image,
    body,
    status: intent === 'publish' ? 'published' : 'draft',
    ownerId: user.id,
    submittedBy: user.handle,
  })
  return new Response(null, {
    status: 303,
    headers: { Location: `/dashboard/works/${id}/edit` },
  })
}

export default function NewWorkPage() {
  const { csrfToken } = useLoaderData<{ csrfToken: string }>()
  const actionData = useActionData<{ errors?: string[] }>()
  const navigation = useNavigation()
  const busy = navigation.state === 'submitting'

  return (
    <section className="archive-container page-shell dashboard-page">
      <div className="dashboard-header">
        <div>
          <p className="eyebrow">EDITOR / 在线编辑器</p>
          <h1>
            新建
            <br />
            <em>作品档案。</em>
          </h1>
        </div>
        <Link to="/dashboard">← 返回仪表盘</Link>
      </div>
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
            <Input aria-label="标题" name="title" required />
          </label>
          <label className="submission-field">
            <span>简介</span>
            <Textarea aria-label="简介" name="description" required rows={3} />
          </label>
          <label className="submission-field">
            <span>正文（Markdown / 纯文本）</span>
            <Textarea
              aria-label="正文"
              className="editor-body"
              name="body"
              placeholder="在这里写作品说明、创作手记、歌词摘录…"
              rows={16}
            />
          </label>
        </div>
        <aside className="dashboard-panel editor-side">
          <label className="submission-field">
            <span>图片 URL</span>
            <Input
              aria-label="图片 URL"
              name="imageUrl"
              placeholder="/uploads/… 或 https://…"
              required
            />
          </label>
          <label className="submission-field">
            <span>类型</span>
            <select aria-label="类型" className="submission-select" name="category" required>
              {allowedCategories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>
          <label className="submission-field">
            <span>标签</span>
            <Input aria-label="标签" name="tags" placeholder="洛天依, 曲绘" />
          </label>
          <label className="submission-field">
            <span>许可证</span>
            <select aria-label="许可证" className="submission-select" name="license" required>
              {allowedLicenses.map((license) => (
                <option key={license} value={license}>
                  {license}
                </option>
              ))}
            </select>
          </label>
          <label className="submission-field">
            <span>AI 声明</span>
            <select aria-label="AI 声明" className="submission-select" name="aiDisclosure" required>
              {allowedAiDisclosures.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <label className="submission-field">
            <span>来源</span>
            <select aria-label="来源" className="submission-select" name="origin" required>
              {allowedOrigins.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <label className="submission-field">
            <span>原作链接</span>
            <Input aria-label="原作链接" name="sourceUrl" type="url" />
          </label>
          <div className="editor-actions">
            <button
              className="submission-button"
              disabled={busy}
              name="intent"
              type="submit"
              value="draft"
            >
              保存草稿
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
          </div>
          <p className="muted-copy">
            图片可先用 <code>POST /api/images</code> 上传，再粘贴返回的 URL。
          </p>
        </aside>
      </Form>
    </section>
  )
}
