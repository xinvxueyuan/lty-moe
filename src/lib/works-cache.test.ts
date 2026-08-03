import test from 'node:test'
import assert from 'node:assert/strict'
import type { Work } from '../data/types'
import {
  getCachedWork,
  getCachedWorks,
  invalidateWorksCache,
  setCachedWork,
  setCachedWorks,
} from './works-cache'

function sample(id: string): Work {
  return {
    id,
    title: `Title ${id}`,
    creator: 'Tester',
    handle: 'tester',
    category: '插画',
    image: `/uploads/${id}.png`,
    likes: '0',
    comments: 0,
    palette: ['#111'],
    description: 'desc',
    date: '2026.08.04',
    license: 'CC BY 4.0',
    maintainers: ['Tester'],
    coAuthors: [],
    aiDisclosure: '未使用生成式 AI',
    origin: '原创',
  }
}

test.afterEach(() => {
  invalidateWorksCache()
})

test('setCachedWorks stores list and individual works', () => {
  const works = [sample('a'), sample('b')]
  setCachedWorks(works)
  assert.deepEqual(getCachedWorks(), works)
  assert.equal(getCachedWork('a')?.title, 'Title a')
  assert.equal(getCachedWork('b')?.id, 'b')
})

test('setCachedWork stores a single work', () => {
  setCachedWork(sample('solo'))
  assert.equal(getCachedWork('solo')?.creator, 'Tester')
  assert.equal(getCachedWorks(), null)
})

test('invalidateWorksCache clears all entries', () => {
  setCachedWorks([sample('x')])
  invalidateWorksCache()
  assert.equal(getCachedWorks(), null)
  assert.equal(getCachedWork('x'), null)
})

test('expired entries are treated as misses', () => {
  setCachedWorks([sample('old')], 1)
  const start = Date.now()
  while (Date.now() - start < 5) {
    // wait for short TTL
  }
  assert.equal(getCachedWorks(), null)
  assert.equal(getCachedWork('old'), null)
})
