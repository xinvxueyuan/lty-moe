import type { WorkStatus } from './auth-types'
import type { WorkCategory as TaxonomyWorkCategory } from './taxonomy'

export {
  allowedCategories,
  filterCategories,
  workCategories,
  type FilterCategory,
  type WorkCategory,
} from './taxonomy'

export type { WorkStatus } from './auth-types'
export type { PublicUser, UserRole } from './auth-types'

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
  category: TaxonomyWorkCategory
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
  tags?: string[]
  status?: WorkStatus
  ownerId?: string | null
  body?: string
  updatedAt?: string
}

export type Creator = {
  name: string
  handle: string
  initials: string
  tone: 'cyan' | 'pink' | 'violet' | 'amber'
  followers: string
  bio: string
}

export type Tag = {
  id: string
  name: string
  kind: 'user' | 'system'
}
