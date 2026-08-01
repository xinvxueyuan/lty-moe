import type { Config } from '@react-router/dev/config'
import submissions from './src/data/submissions.json'

const basePath = process.env.VITE_BASE_PATH || '/'

const seedWorkIds = [
  'lunar-garden',
  'soft-machines',
  'after-the-rain',
  'blue-hour',
  'small-rituals',
  'the-last-sun',
]

const submissionIds = (submissions as Array<{ id: string }>).map((submission) => submission.id)
const creatorHandles = ['sora-kim', 'yukiko_rai', 'miapark', 'nico.m', 'irismatsu', 'junovale']

export default {
  appDirectory: 'src',
  basename: basePath,
  buildDirectory: 'build',
  ssr: false,
  prerender: [
    '/',
    '/explore',
    '/following',
    '/upload',
    ...seedWorkIds.map((id) => `/works/${id}`),
    ...submissionIds.map((id) => `/works/${id}`),
    ...creatorHandles.map((handle) => `/creator/${handle}`),
  ],
} satisfies Config
