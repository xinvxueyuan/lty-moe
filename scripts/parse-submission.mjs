const fields = {
  workId: '作品 ID / Work ID',
  title: '作品标题 / Work title',
  creator: '创作者名称 / Creator name',
  handle: '创作者主页 ID / Creator handle',
  category: '作品类型 / Category',
  image: '作品图片 / Artwork image',
  description: '作品简介 / Description',
  sourceUrl: '原作链接 / Source link',
  license: '许可证 / License',
  maintainers: '维护者 / Maintainers',
  coAuthors: '共同作者 / Co-authors',
  aiDisclosure: 'AI 使用声明 / AI disclosure',
  origin: '作品来源 / Origin',
  copyright: '版权确认 / Copyright confirmation',
}

export const allowedCategories = ['插画', '曲绘', 'PV / 动画', '3D', '其他']
export const allowedLicenses = [
  'All rights reserved / 保留所有权利',
  'CC BY 4.0',
  'CC BY-NC 4.0',
  'CC BY-NC-SA 4.0',
  '其他（请在作品简介中说明）',
]
export const allowedAiDisclosures = ['未使用生成式 AI', '使用 AI 辅助创作', '主要由 AI 生成']
export const allowedOrigins = ['原创', '转载']
const keepCurrent = '不修改 / Keep current'

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

function valuesFromBody(body) {
  return Object.fromEntries(
    Object.entries(fields).map(([key, heading]) => [key, section(body || '', heading)]),
  )
}

function listValue(value) {
  return value
    .split(/\r?\n|,/)
    .map((item) => item.replace(/^[-*]\s*/, '').trim())
    .filter(Boolean)
    .slice(0, 12)
}

function metadataFromValues(values, submittedBy) {
  return {
    license: values.license.trim() || '未声明',
    maintainers: listValue(values.maintainers).length
      ? listValue(values.maintainers)
      : submittedBy
        ? [`@${submittedBy}`]
        : [],
    coAuthors: listValue(values.coAuthors),
    aiDisclosure: allowedAiDisclosures.includes(values.aiDisclosure.trim())
      ? values.aiDisclosure.trim()
      : '未披露',
  }
}

function imageIsAllowed(image) {
  const imageUrl = new URL(image)
  return (
    imageUrl.protocol === 'https:' &&
    imageUrl.hostname === 'github.com' &&
    imageUrl.pathname.startsWith('/user-attachments/assets/')
  )
}

function validateMetadata(values, errors) {
  if (values.license && !allowedLicenses.includes(values.license.trim())) {
    errors.push(`许可证必须是：${allowedLicenses.join('、')}。`)
  }
  if (values.aiDisclosure && !allowedAiDisclosures.includes(values.aiDisclosure.trim())) {
    errors.push(`AI 使用声明必须是：${allowedAiDisclosures.join('、')}。`)
  }
  if (listValue(values.maintainers).length > 12) errors.push('维护者最多填写 12 位。')
  if (listValue(values.coAuthors).length > 12) errors.push('共同作者最多填写 12 位。')
  if (values.origin && !allowedOrigins.includes(values.origin.trim())) {
    errors.push(`作品来源必须是：${allowedOrigins.join('、')}。`)
  }
}

export function parseIssueBody(body, { issueNumber, issueUrl, submittedBy, date } = {}) {
  const values = valuesFromBody(body)
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
  if (handle && !/^[a-zA-Z0-9_.-]{1,40}$/.test(handle))
    errors.push('创作者主页 ID 只能包含字母、数字、下划线、点和短横线。')
  if (!allowedCategories.includes(category))
    errors.push(`作品类型必须是：${allowedCategories.join('、')}。`)
  if (!image) errors.push('请在作品图片字段中拖拽一张 GitHub Issue 附件图片。')
  if (image && !imageIsAllowed(image))
    errors.push('作品图片必须来自 github.com/user-attachments/assets。')
  if (!description || description.length > 1200)
    errors.push('作品简介不能为空且不能超过 1200 个字符。')
  if (values.sourceUrl && !sourceUrl) errors.push('原作链接必须是有效的 HTTPS 链接。')
  validateMetadata(values, errors)
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
      handle:
        handle ||
        creator
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')
          .slice(0, 40),
      category,
      image,
      description,
      sourceUrl: sourceUrl || null,
      submittedBy: submittedBy || '',
      date: date || new Date().toISOString().slice(0, 10).replaceAll('-', '.'),
      likes: '0',
      comments: 0,
      palette: ['#73d9e0', '#ff70aa', '#182124'],
      ...metadataFromValues(values, submittedBy),
      origin: values.origin.trim() || '未声明',
    },
  }
}

export function parseUpdateIssueBody(body, { issueNumber, issueUrl, submittedBy, date } = {}) {
  const values = valuesFromBody(body)
  const errors = []
  const workId = values.workId.trim()
  const changes = {}
  const title = values.title.replace(/\s+/g, ' ').trim()
  const creator = values.creator.replace(/\s+/g, ' ').trim()
  const handle = values.handle.replace(/^@/, '').replace(/\s+/g, '').trim()
  const category = values.category.trim()
  const image = firstUrl(values.image)
  const description = values.description.trim()
  const sourceValue = values.sourceUrl.trim()

  if (!workId || !/^[a-zA-Z0-9_.-]{1,80}$/.test(workId)) {
    errors.push('作品 ID 不能为空，且只能包含字母、数字、下划线、点和短横线。')
  }
  if (title) {
    if (title.length > 120) errors.push('作品标题不能超过 120 个字符。')
    else changes.title = title
  }
  if (creator) {
    if (creator.length > 80) errors.push('创作者名称不能超过 80 个字符。')
    else changes.creator = creator
  }
  if (handle) {
    if (!/^[a-zA-Z0-9_.-]{1,40}$/.test(handle)) {
      errors.push('创作者主页 ID 只能包含字母、数字、下划线、点和短横线。')
    } else changes.handle = handle
  }
  if (category && category !== keepCurrent) {
    if (!allowedCategories.includes(category))
      errors.push(`作品类型必须是：${allowedCategories.join('、')}。`)
    else changes.category = category
  }
  if (image) {
    if (!imageIsAllowed(image)) errors.push('作品图片必须来自 github.com/user-attachments/assets。')
    else changes.image = image
  }
  if (description) {
    if (description.length > 1200) errors.push('作品简介不能超过 1200 个字符。')
    else changes.description = description
  }
  if (sourceValue) {
    if (sourceValue === '清空 / Clear') changes.sourceUrl = null
    else {
      const sourceUrl = optionalHttpsUrl(sourceValue)
      if (!sourceUrl) errors.push('原作链接必须是有效的 HTTPS 链接。')
      else changes.sourceUrl = sourceUrl
    }
  }
  if (values.license.trim() && values.license.trim() !== keepCurrent) {
    if (!allowedLicenses.includes(values.license.trim()))
      errors.push(`许可证必须是：${allowedLicenses.join('、')}。`)
    else changes.license = values.license.trim()
  }
  if (values.maintainers.trim() && values.maintainers.trim() !== keepCurrent) {
    changes.maintainers =
      values.maintainers.trim() === '清空 / Clear' ? [] : listValue(values.maintainers)
  }
  if (values.coAuthors.trim() && values.coAuthors.trim() !== keepCurrent) {
    changes.coAuthors =
      values.coAuthors.trim() === '清空 / Clear' ? [] : listValue(values.coAuthors)
  }
  if (values.aiDisclosure.trim() && values.aiDisclosure.trim() !== keepCurrent) {
    if (!allowedAiDisclosures.includes(values.aiDisclosure.trim())) {
      errors.push(`AI 使用声明必须是：${allowedAiDisclosures.join('、')}。`)
    } else changes.aiDisclosure = values.aiDisclosure.trim()
  }
  if (values.origin.trim() && values.origin.trim() !== keepCurrent) {
    if (!allowedOrigins.includes(values.origin.trim())) {
      errors.push(`作品来源必须是：${allowedOrigins.join('、')}。`)
    } else changes.origin = values.origin.trim()
  }
  if (!Object.keys(changes).length) errors.push('至少填写一项需要更新的内容。')
  if (!/\[[xX]\]/.test(values.copyright)) errors.push('请勾选版权确认。')

  if (errors.length) return { ok: false, errors }
  return {
    ok: true,
    update: {
      id: workId,
      changes,
      issueNumber: Number(issueNumber),
      issueUrl: issueUrl || '',
      submittedBy: submittedBy || '',
      date: date || new Date().toISOString().slice(0, 10).replaceAll('-', '.'),
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
