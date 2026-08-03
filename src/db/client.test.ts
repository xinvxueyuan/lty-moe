import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { Work } from '../data/types'

const tempDir = mkdtempSync(join(tmpdir(), 'lty-db-'))
const dbPath = join(tempDir, 'test.db')
process.env.DATABASE_PATH = dbPath

const { listWorks, getWorkById, insertWork } = await import('./client.server')

function sampleWork(overrides: Partial<Work> = {}): Work {
  return {
    id: 'unit-test-work',
    title: '单元测试作品',
    creator: 'Tester',
    handle: 'tester',
    category: '插画',
    image: '/uploads/unit-test.png',
    likes: '0',
    comments: 0,
    palette: ['#111111', '#222222', '#333333'],
    description: '由单元测试写入的作品。',
    date: '2026.08.04',
    sourceUrl: 'https://example.com/unit',
    license: 'CC BY 4.0',
    maintainers: ['Tester'],
    coAuthors: [],
    aiDisclosure: '未使用生成式 AI',
    origin: '原创',
    submittedBy: 'tester',
    ...overrides,
  }
}

test.after(() => {
  try {
    rmSync(tempDir, { recursive: true, force: true })
  } catch {
    // sqlite3 may still hold the file handle until process exit
  }
})

test('seeds demo works when the database is empty', async () => {
  const works = await listWorks()
  assert.equal(works.length, 6)
  const blueHour = works.find((work) => work.id === 'blue-hour')
  assert.ok(blueHour)
  assert.equal(blueHour.title, '天依蓝 / Blue Hour Studies')
  assert.equal(blueHour.creator, 'Sora Kim')
  assert.equal(blueHour.category, '绘画')
  assert.ok(Array.isArray(blueHour.palette))
  assert.ok(blueHour.palette.length >= 1)
  assert.ok(blueHour.tags?.includes('天依蓝'))
})

test('listWorks filters by category and tag', async () => {
  const byCategory = await listWorks({ category: '插画' })
  assert.ok(byCategory.length >= 1)
  assert.ok(byCategory.every((work) => work.category === '插画'))

  const byTag = await listWorks({ tag: '洛天依' })
  assert.ok(byTag.length >= 1)
  assert.ok(byTag.every((work) => work.tags?.includes('洛天依')))
})

test('getWorkById returns a seeded work and null for missing ids', async () => {
  const work = await getWorkById('blue-hour')
  assert.ok(work)
  assert.equal(work.handle, 'sora-kim')
  assert.equal(await getWorkById('does-not-exist'), null)
})

test('insertWork adds a row that listWorks and getWorkById can read', async () => {
  const before = await listWorks()
  await insertWork(sampleWork())
  const after = await listWorks()
  assert.equal(after.length, before.length + 1)

  const inserted = await getWorkById('unit-test-work')
  assert.ok(inserted)
  assert.equal(inserted.title, '单元测试作品')
  assert.equal(inserted.image, '/uploads/unit-test.png')
  assert.deepEqual(inserted.palette, ['#111111', '#222222', '#333333'])
  assert.deepEqual(inserted.maintainers, ['Tester'])
  assert.equal(inserted.sourceUrl, 'https://example.com/unit')
  assert.equal(inserted.submittedBy, 'tester')
})

test('does not re-seed when works already exist', async () => {
  const works = await listWorks()
  assert.ok(works.length >= 7)
  assert.equal(works.filter((work) => work.id === 'blue-hour').length, 1)
})
