import {
  allowedAiDisclosures,
  allowedCategories,
  allowedLicenses,
  allowedOrigins,
} from '../data/types'
import { maxTagLength, maxTagsPerWork, parseTagNames, type WorkCategory } from '../data/taxonomy'
import type { Work } from '../data/types'

export type WorkFormInput = {
  title: string
  creator: string
  handle: string
  category: string
  description: string
  sourceUrl: string
  license: string
  maintainers: string
  coAuthors: string
  aiDisclosure: string
  origin: string
  copyright: string
  tags?: string
}

export function slugFromText(text: string, max = 40): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, max)
}

function listValue(value: string): string[] {
  return value
    .split(/\r?\n|,/)
    .map((item) => item.replace(/^[-*]\s*/, '').trim())
    .filter(Boolean)
    .slice(0, 12)
}

function optionalHttpsUrl(value: string): string {
  if (!value) return ''
  try {
    const url = new URL(value)
    return url.protocol === 'https:' ? url.toString() : ''
  } catch {
    return ''
  }
}

export function validateWorkForm(input: WorkFormInput): {
  errors: string[]
  work?: Omit<Work, 'id' | 'image'>
} {
  const errors: string[] = []
  const title = input.title.replace(/\s+/g, ' ').trim()
  const creator = input.creator.replace(/\s+/g, ' ').trim()
  const handle = input.handle.replace(/^@/, '').replace(/\s+/g, '').trim()
  const category = input.category.trim() as WorkCategory
  const description = input.description.trim()
  const sourceUrl = optionalHttpsUrl(input.sourceUrl.trim())
  const license = input.license.trim()
  const aiDisclosure = input.aiDisclosure.trim()
  const origin = input.origin.trim()
  const rawTags = input.tags ?? ''
  const tags = parseTagNames(rawTags)
  const oversizedTag = rawTags
    .split(/\r?\n|,/)
    .map((item) => item.replace(/^[-*#]\s*/, '').trim())
    .find((item) => item.length > maxTagLength)

  if (!title || title.length > 120) errors.push('作品标题不能为空且不能超过 120 个字符。')
  if (!creator || creator.length > 80) errors.push('创作者名称不能为空且不能超过 80 个字符。')
  if (!handle || !/^[a-zA-Z0-9_.-]{1,40}$/.test(handle))
    errors.push('创作者主页 ID 只能包含字母、数字、下划线、点和短横线。')
  if (!allowedCategories.includes(category))
    errors.push(`作品类型必须是：${allowedCategories.join('、')}。`)
  if (!description || description.length > 1200)
    errors.push('作品简介不能为空且不能超过 1200 个字符。')
  if (input.sourceUrl.trim() && !sourceUrl) errors.push('原作链接必须是有效的 HTTPS 链接。')
  if (!allowedLicenses.includes(license))
    errors.push(`许可证必须是：${allowedLicenses.join('、')}。`)
  if (!allowedAiDisclosures.includes(aiDisclosure))
    errors.push(`AI 使用声明必须是：${allowedAiDisclosures.join('、')}。`)
  if (!allowedOrigins.includes(origin))
    errors.push(`作品来源必须是：${allowedOrigins.join('、')}。`)
  if (!input.copyright || input.copyright !== 'on') errors.push('请勾选版权确认。')
  if (oversizedTag) errors.push(`单个标签不能超过 ${maxTagLength} 个字符。`)
  if (parseTagNames(rawTags).length === 0 && rawTags.trim()) {
    // all parts invalid already covered; keep silent
  }
  const rawParts = rawTags
    .split(/\r?\n|,/)
    .map((item) => item.replace(/^[-*#]\s*/, '').trim())
    .filter(Boolean)
  if (rawParts.length > maxTagsPerWork) {
    errors.push(`标签最多 ${maxTagsPerWork} 个。`)
  }

  if (errors.length) return { errors }

  return {
    errors,
    work: {
      title,
      creator,
      handle,
      category,
      description,
      sourceUrl: sourceUrl || null,
      license,
      maintainers: listValue(input.maintainers).length ? listValue(input.maintainers) : [creator],
      coAuthors: listValue(input.coAuthors),
      aiDisclosure: aiDisclosure as Work['aiDisclosure'],
      origin: origin as Work['origin'],
      likes: '0',
      comments: 0,
      palette: ['#73d9e0', '#ff70aa', '#182124'],
      date: new Date().toISOString().slice(0, 10).replaceAll('-', '.'),
      tags,
    },
  }
}
