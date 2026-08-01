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

export type AiDisclosure = '未使用生成式 AI' | '使用 AI 辅助创作' | '主要由 AI 生成' | '未披露'

export type WorkOrigin = '原创' | '转载' | '未声明'

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
  canonicalAuthorId?: string
  discussionNumber?: number
  discussionId?: string
  discussionUrl?: string
}

export type Submission = Work & {
  sourceIssue: number
  sourceIssueUrl: string
  sourceUrl: string | null
  submittedBy: string
}

export type Author = {
  id: string
  displayName: string
  handles: string[]
  aliases: string[]
  workIds: string[]
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
