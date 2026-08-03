export const workCategories = [
  '全部',
  '插画',
  '曲绘',
  '摄影',
  '绘画',
  '概念设计',
  'PV / 动画',
  '3D',
  '3D / 动画',
  '其他',
] as const

export type WorkCategory = Exclude<(typeof workCategories)[number], '全部'>

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

export type AiDisclosure = (typeof allowedAiDisclosures)[number] | '未披露'

export type WorkOrigin = (typeof allowedOrigins)[number] | '未声明'

export type Work = {
  id: string
  title: string
  creator: string
  handle: string
  category: WorkCategory
  image: string
  likes: string
  comments: number
  palette: string[]
  description: string
  date: string
  sourceUrl?: string | null
  license: string
  maintainers: string[]
  coAuthors: string[]
  aiDisclosure: AiDisclosure
  origin: WorkOrigin
  submittedBy?: string
}

export type Creator = {
  name: string
  handle: string
  initials: string
  tone: 'cyan' | 'pink' | 'violet' | 'amber'
  followers: string
  bio: string
}

export type FilterCategory = '全部' | WorkCategory
