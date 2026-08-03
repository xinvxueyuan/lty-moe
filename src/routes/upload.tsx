import { ArrowUpRight, ImagePlus, Info, LoaderCircle } from 'lucide-react'
import { mkdirSync } from 'node:fs'
import { writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { Link, useActionData, useNavigation } from 'react-router'
import { Input } from '../components/ui/input'
import { Textarea } from '../components/ui/textarea'
import {
  allowedAiDisclosures,
  allowedCategories,
  allowedLicenses,
  allowedOrigins,
} from '../data/types'
import { insertWork } from '../db/client.server'
import { slugFromText, validateWorkForm, type WorkFormInput } from '../lib/validate-work'

const imageExtensions = ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.avif']
const maxImageBytes = 10 * 1024 * 1024

function saveUpload(file: File, id: string): Promise<string> {
  const extension = imageExtensions.find((ext) => file.name.toLowerCase().endsWith(ext)) ?? '.png'
  const uploadsDir = process.env.UPLOADS_DIR || resolve(process.cwd(), 'uploads')
  mkdirSync(uploadsDir, { recursive: true })
  const filename = `${id}-${Date.now().toString(36)}${extension}`
  return file
    .arrayBuffer()
    .then((buffer) =>
      writeFile(join(uploadsDir, filename), Buffer.from(buffer)).then(() => `/uploads/${filename}`),
    )
}

export async function action({ request }: { request: Request }) {
  const formData = await request.formData()
  const read = (name: string) => String(formData.get(name) ?? '')
  const input: WorkFormInput = {
    title: read('title'),
    creator: read('creator'),
    handle: read('handle'),
    category: read('category'),
    description: read('description'),
    sourceUrl: read('sourceUrl'),
    license: read('license'),
    maintainers: read('maintainers'),
    coAuthors: read('coAuthors'),
    aiDisclosure: read('aiDisclosure'),
    origin: read('origin'),
    copyright: read('copyright'),
  }

  const file = formData.get('image')
  const hasFile = file instanceof File && file.size > 0
  const extension = hasFile
    ? imageExtensions.find((ext) => file.name.toLowerCase().endsWith(ext))
    : undefined

  const errors: string[] = []
  const { errors: formErrors, work } = validateWorkForm(input)
  errors.push(...formErrors)
  if (!hasFile) errors.push('请选择一张作品图片。')
  if (hasFile && !extension) errors.push('图片格式必须是 PNG、JPG、WebP、GIF 或 AVIF。')
  if (hasFile && file.size > maxImageBytes) errors.push('图片大小不能超过 10MB。')

  if (errors.length || !work || !hasFile) {
    return { errors }
  }

  const id = `${slugFromText(work.title) || 'untitled'}-${Date.now().toString(36)}`
  const image = await saveUpload(file, id)
  await insertWork({ ...work, id, image })
  return new Response(null, {
    status: 303,
    headers: { Location: `/works/${id}` },
  })
}

export default function Upload() {
  const navigation = useNavigation()
  const actionData = useActionData<{ errors?: string[] }>()
  const isSubmitting = navigation.state === 'submitting'

  return (
    <section className="archive-container page-shell upload-page">
      <div className="upload-layout">
        <div className="upload-intro">
          <p className="eyebrow">NEW FILE / SUBMISSION</p>
          <h1>
            让你的天依同人
            <br />
            <em>被听见。</em>
          </h1>
          <p>把曲绘、插画、PV、3D 或任何与你的歌声有关的作品送进档案。提交后会自动发布到展厅。</p>
          <Link className="back-home-link" to="/">
            ← 回到首页
          </Link>
        </div>
        <div className="submission-panel">
          <div className="submission-panel-top">
            <span className="upload-icon">
              <ImagePlus size={23} />
            </span>
            <span className="submission-code">FORM / 01</span>
          </div>
          <h2>投稿档案</h2>
          <p>填写作品信息并上传图片，几秒后就会出现在展厅里。</p>
          {actionData?.errors?.length ? (
            <ul className="submission-errors" role="alert">
              {actionData.errors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          ) : null}
          <form className="submission-form" encType="multipart/form-data" method="post">
            <label className="submission-field">
              <span>作品标题 / Title</span>
              <Input
                aria-label="作品标题"
                name="title"
                placeholder="例如：雨后的第十三分钟"
                required
              />
            </label>
            <label className="submission-field">
              <span>创作者名称 / Creator</span>
              <Input aria-label="创作者名称" name="creator" placeholder="你的署名" required />
            </label>
            <label className="submission-field">
              <span>创作者主页 ID / Handle</span>
              <Input
                aria-label="创作者主页 ID"
                name="handle"
                placeholder="例如：miao_official"
                required
              />
            </label>
            <label className="submission-field">
              <span>作品类型 / Category</span>
              <select aria-label="作品类型" className="submission-select" name="category" required>
                {allowedCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>
            <label className="submission-field">
              <span>作品图片 / Artwork</span>
              <Input
                accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
                aria-label="作品图片"
                name="image"
                required
                type="file"
              />
            </label>
            <label className="submission-field">
              <span>作品简介 / Description</span>
              <Textarea
                aria-label="作品简介"
                name="description"
                placeholder="说说这件作品的故事……"
                required
                rows={4}
              />
            </label>
            <label className="submission-field">
              <span>原作链接 / Source（可选）</span>
              <Input aria-label="原作链接" name="sourceUrl" placeholder="https://…" type="url" />
            </label>
            <label className="submission-field">
              <span>维护者 / Maintainers（可选）</span>
              <Input
                aria-label="维护者"
                name="maintainers"
                placeholder="每行或逗号分隔，最多 12 位"
              />
            </label>
            <label className="submission-field">
              <span>共同作者 / Co-authors（可选）</span>
              <Input
                aria-label="共同作者"
                name="coAuthors"
                placeholder="每行或逗号分隔，最多 12 位"
              />
            </label>
            <label className="submission-field">
              <span>许可证 / License</span>
              <select aria-label="许可证" className="submission-select" name="license" required>
                {allowedLicenses.map((license) => (
                  <option key={license} value={license}>
                    {license}
                  </option>
                ))}
              </select>
            </label>
            <label className="submission-field">
              <span>AI 使用声明 / AI Disclosure</span>
              <select
                aria-label="AI 使用声明"
                className="submission-select"
                name="aiDisclosure"
                required
              >
                {allowedAiDisclosures.map((disclosure) => (
                  <option key={disclosure} value={disclosure}>
                    {disclosure}
                  </option>
                ))}
              </select>
            </label>
            <label className="submission-field">
              <span>作品来源 / Origin</span>
              <select aria-label="作品来源" className="submission-select" name="origin" required>
                {allowedOrigins.map((origin) => (
                  <option key={origin} value={origin}>
                    {origin}
                  </option>
                ))}
              </select>
            </label>
            <label className="submission-check">
              <input aria-label="版权确认" name="copyright" required type="checkbox" />
              <span>我确认拥有该作品的发布权。</span>
            </label>
            <button
              className="submission-button inline-flex h-12 w-full items-center justify-center gap-2 bg-[var(--pink)] px-5 text-sm font-medium text-[var(--ink)] hover:bg-[#ff9cc2]"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? (
                <>
                  <LoaderCircle className="animate-spin" size={17} /> 正在提交……
                </>
              ) : (
                <>
                  <ImagePlus size={17} /> 提交作品 <ArrowUpRight size={16} />
                </>
              )}
            </button>
          </form>
          <small className="submission-footnote">提交后会自动发布，无需等待审核</small>
          <div className="submission-note">
            <Info size={16} />
            <span>请确认你拥有作品发布权。图片会安全地上传到本档案站。</span>
          </div>
        </div>
      </div>
    </section>
  )
}
