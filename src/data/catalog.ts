import submissions from './submissions.json'
import type { Creator, Submission, Work } from './types'
import { seedWorks } from './works'

type RawSubmission = Omit<
  Submission,
  'license' | 'maintainers' | 'coAuthors' | 'aiDisclosure' | 'origin'
> &
  Partial<Pick<Submission, 'license' | 'maintainers' | 'coAuthors' | 'aiDisclosure' | 'origin'>>

const submissionWorks = (submissions as RawSubmission[]).map((submission) => ({
  license: '未声明',
  maintainers: [],
  coAuthors: [],
  aiDisclosure: '未披露' as const,
  origin: '未声明' as const,
  ...submission,
}))

export const works: Work[] = [...seedWorks, ...submissionWorks]

export const featuredCreators: Creator[] = [
  {
    name: 'Sora Kim',
    handle: 'sora-kim',
    initials: 'SK',
    tone: 'cyan',
    followers: '18.4k',
    bio: '用冷色和留白记录天依声音里的夜晚。',
  },
  {
    name: 'Yukiko Arai',
    handle: 'yukiko_rai',
    initials: 'YA',
    tone: 'pink',
    followers: '12.1k',
    bio: '画花、月亮，还有一切适合在耳机里发生的事。',
  },
  {
    name: 'Mia Park',
    handle: 'miapark',
    initials: 'MP',
    tone: 'violet',
    followers: '9.8k',
    bio: '把声音拆成柔软的界面和可触摸的形状。',
  },
  {
    name: 'Nico Moretti',
    handle: 'nico.m',
    initials: 'NM',
    tone: 'amber',
    followers: '7.3k',
    bio: '在天气和城市之间，寻找一帧蓝色。',
  },
]

export function getCreator(handle: string): Creator {
  return (
    featuredCreators.find((creator) => creator.handle === handle) ?? {
      name: handle.replace(/[._-]/g, ' '),
      handle,
      initials: handle.slice(0, 2).toUpperCase(),
      tone: 'cyan',
      followers: '—',
      bio: '一位把天依放进自己作品里的创作者。',
    }
  )
}

export function getCreatorWorks(handle: string): Work[] {
  const aliases: Record<string, string[]> = {
    'sora-kim': ['blue-hour', 'the-last-sun'],
    yukiko_rai: ['lunar-garden', 'small-rituals'],
    miapark: ['soft-machines'],
  }
  const ids = aliases[handle]
  return works.filter((work) => work.handle === handle || ids?.includes(work.id))
}
