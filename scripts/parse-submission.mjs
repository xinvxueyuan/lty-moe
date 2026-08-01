const fields = {
  title: '作品标题 / Work title',
  creator: '创作者名称 / Creator name',
  handle: '创作者主页 ID / Creator handle',
  category: '作品类型 / Category',
  image: '作品图片 / Artwork image',
  description: '作品简介 / Description',
  sourceUrl: '原作链接 / Source link',
  copyright: '版权确认 / Copyright confirmation',
}

export const allowedCategories = ['插画', '曲绘', 'PV / 动画', '3D', '其他']

function section(body, heading) {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const header = new RegExp(`^###\\s+${escaped}\\s*$`, 'im').exec(body)
  if (!header) return ''
  const remainder = body.slice(header.index + header[0].length)
  const nextHeader = /^###\s+/im.exec(remainder)
  return (nextHeader ? remainder.slice(0, nextHeader.index) : remainder).trim()
}

function firstUrl(value) {
  return value.match(/https?:\/\/[^\s)]+/i)?.[0]?.replace(/[.,]+$/, '') || ''
}

function optionalHttpsUrl(value) {
  if (!value) return ''
  try {
    const url = new URL(value)
    return url.protocol === 'https:' ? url.toString() : ''
  } catch {
    return ''
  }
}

export function parseIssueBody(body, { issueNumber, issueUrl, submittedBy, date } = {}) {
  const values = Object.fromEntries(Object.entries(fields).map(([key, heading]) => [key, section(body || '', heading)]))
  const errors = []
  const title = values.title.replace(/\s+/g, ' ').trim()
  const creator = values.creator.replace(/\s+/g, ' ').trim()
  const handle = values.handle.replace(/^@/, '').replace(/\s+/g, '').trim()
  const category = values.category.trim()
  const image = firstUrl(values.image)
  const description = values.description.trim()
  const sourceUrl = optionalHttpsUrl(values.sourceUrl.trim())

  if (!title || title.length > 120) errors.push('作品标题不能为空且不能超过 120 个字符。')
  if (!creator || creator.length > 80) errors.push('创作者名称不能为空且不能超过 80 个字符。')
  if (handle && !/^[a-zA-Z0-9_.-]{1,40}$/.test(handle)) errors.push('创作者主页 ID 只能包含字母、数字、下划线、点和短横线。')
  if (!allowedCategories.includes(category)) errors.push(`作品类型必须是：${allowedCategories.join('、')}。`)
  if (!image) errors.push('请在作品图片字段中拖拽一张 GitHub Issue 附件图片。')
  if (image) {
    const imageUrl = new URL(image)
    if (imageUrl.protocol !== 'https:' || imageUrl.hostname !== 'github.com' || !imageUrl.pathname.startsWith('/user-attachments/assets/')) {
      errors.push('作品图片必须来自 github.com/user-attachments/assets。')
    }
  }
  if (!description || description.length > 1200) errors.push('作品简介不能为空且不能超过 1200 个字符。')
  if (values.sourceUrl && !sourceUrl) errors.push('原作链接必须是有效的 HTTPS 链接。')
  if (!/\[[xX]\]/.test(values.copyright)) errors.push('请勾选版权确认。')

  if (errors.length) return { ok: false, errors }

  return {
    ok: true,
    submission: {
      id: `issue-${issueNumber}`,
      sourceIssue: Number(issueNumber),
      sourceIssueUrl: issueUrl || '',
      title,
      creator,
      handle: handle || creator.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40),
      category,
      image,
      description,
      sourceUrl: sourceUrl || null,
      submittedBy: submittedBy || '',
      date: date || new Date().toISOString().slice(0, 10).replaceAll('-', '.'),
      likes: '0',
      comments: 0,
      palette: ['#73d9e0', '#ff70aa', '#182124'],
    },
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = parseIssueBody(process.env.ISSUE_BODY || '', {
    issueNumber: process.env.ISSUE_NUMBER || '0',
    issueUrl: process.env.ISSUE_URL || '',
    submittedBy: process.env.SUBMITTED_BY || '',
  })
  console.log(JSON.stringify(result, null, 2))
  if (!result.ok) process.exitCode = 1
}
