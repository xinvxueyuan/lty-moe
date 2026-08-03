export const workCategories = [
  '插画',
  '曲绘',
  'PV / 动画',
  '3D',
  '摄影',
  '绘画',
  '概念设计',
  '其他',
] as const

export type WorkCategory = (typeof workCategories)[number]

export const allowedCategories: WorkCategory[] = [...workCategories]

export const filterCategories = ['全部', ...workCategories] as const

export type FilterCategory = (typeof filterCategories)[number]

/** Map legacy / free-form category labels onto the unified taxonomy. */
export const categoryAliases: Record<string, WorkCategory> = {
  '3D / 动画': '3D',
  '3d': '3D',
  'PV/动画': 'PV / 动画',
  pv: 'PV / 动画',
  illustration: '插画',
  music: '曲绘',
  photo: '摄影',
  painting: '绘画',
  concept: '概念设计',
  other: '其他',
}

export function normalizeCategory(value: string): WorkCategory | null {
  const trimmed = value.trim()
  if ((workCategories as readonly string[]).includes(trimmed)) {
    return trimmed as WorkCategory
  }
  const aliased = categoryAliases[trimmed] ?? categoryAliases[trimmed.toLowerCase()]
  return aliased ?? null
}

export const maxTagsPerWork = 12
export const maxTagLength = 20

export const systemTagNames = ['洛天依', '同人', 'Vocaloid'] as const

export function parseTagNames(raw: string): string[] {
  const seen = new Set<string>()
  const tags: string[] = []
  for (const part of raw.split(/\r?\n|,/)) {
    const name = part
      .replace(/^[-*#]\s*/, '')
      .replace(/\s+/g, ' ')
      .trim()
    if (!name || name.length > maxTagLength) continue
    const key = name.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    tags.push(name)
    if (tags.length >= maxTagsPerWork) break
  }
  return tags
}

function fallbackTagId(name: string): string {
  const encoded =
    typeof Buffer !== 'undefined'
      ? Buffer.from(name).toString('base64url')
      : btoa(unescape(encodeURIComponent(name)))
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=+$/g, '')
  return `t-${encoded.slice(0, 16)}`
}

export function slugifyTag(name: string, max = 40): string {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\p{L}\p{N}_.-]+/gu, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, max)
  return slug || fallbackTagId(name)
}
