import test from 'node:test'
import assert from 'node:assert/strict'
import { slugFromText, validateWorkForm, type WorkFormInput } from './validate-work'

function validInput(overrides: Partial<WorkFormInput> = {}): WorkFormInput {
  return {
    title: '雨后的第十三分钟',
    creator: '测试创作者',
    handle: 'test_creator',
    category: '曲绘',
    description: '给天依的一张夏日曲绘。',
    sourceUrl: 'https://example.com/work',
    license: 'CC BY-NC 4.0',
    maintainers: '@tester, 编辑组',
    coAuthors: '@co_author',
    aiDisclosure: '使用 AI 辅助创作',
    origin: '原创',
    copyright: 'on',
    ...overrides,
  }
}

test('slugFromText normalizes titles', () => {
  assert.equal(slugFromText('Hello World!!'), 'hello-world')
  assert.equal(slugFromText('  Mixed_CASE 123  '), 'mixed-case-123')
  assert.equal(slugFromText('あいうえお'), '')
  assert.equal(slugFromText('a'.repeat(80)).length, 40)
})

test('validateWorkForm accepts a complete valid submission', () => {
  const result = validateWorkForm(validInput())
  assert.deepEqual(result.errors, [])
  assert.ok(result.work)
  assert.equal(result.work.title, '雨后的第十三分钟')
  assert.equal(result.work.creator, '测试创作者')
  assert.equal(result.work.handle, 'test_creator')
  assert.equal(result.work.category, '曲绘')
  assert.equal(result.work.sourceUrl, 'https://example.com/work')
  assert.deepEqual(result.work.maintainers, ['@tester', '编辑组'])
  assert.deepEqual(result.work.coAuthors, ['@co_author'])
  assert.equal(result.work.aiDisclosure, '使用 AI 辅助创作')
  assert.equal(result.work.origin, '原创')
  assert.equal(result.work.likes, '0')
  assert.equal(result.work.comments, 0)
})

test('validateWorkForm defaults maintainers to creator when empty', () => {
  const result = validateWorkForm(validInput({ maintainers: '  ' }))
  assert.deepEqual(result.errors, [])
  assert.deepEqual(result.work?.maintainers, ['测试创作者'])
})

test('validateWorkForm strips leading @ from handle', () => {
  const result = validateWorkForm(validInput({ handle: '@Mia.Park-01' }))
  assert.deepEqual(result.errors, [])
  assert.equal(result.work?.handle, 'Mia.Park-01')
})

test('validateWorkForm rejects empty title and creator', () => {
  const result = validateWorkForm(validInput({ title: '   ', creator: '' }))
  assert.ok(result.errors.some((e) => e.includes('作品标题')))
  assert.ok(result.errors.some((e) => e.includes('创作者名称')))
  assert.equal(result.work, undefined)
})

test('validateWorkForm rejects invalid handle characters', () => {
  const result = validateWorkForm(validInput({ handle: 'bad handle!' }))
  assert.ok(result.errors.some((e) => e.includes('创作者主页 ID')))
})

test('validateWorkForm rejects unknown category license ai origin', () => {
  const result = validateWorkForm(
    validInput({
      category: '不存在的类型',
      license: 'WTFPL',
      aiDisclosure: '未知',
      origin: '二次创作',
    }),
  )
  assert.ok(result.errors.some((e) => e.includes('作品类型')))
  assert.ok(result.errors.some((e) => e.includes('许可证')))
  assert.ok(result.errors.some((e) => e.includes('AI 使用声明')))
  assert.ok(result.errors.some((e) => e.includes('作品来源')))
})

test('validateWorkForm accepts tags and trims them', () => {
  const result = validateWorkForm(validInput({ tags: '洛天依, 曲绘, 洛天依' }))
  assert.deepEqual(result.errors, [])
  assert.deepEqual(result.work?.tags, ['洛天依', '曲绘'])
})

test('validateWorkForm rejects oversized tags', () => {
  const result = validateWorkForm(validInput({ tags: 'x'.repeat(21) }))
  assert.ok(result.errors.some((e) => e.includes('标签')))
})

test('validateWorkForm rejects non-https source urls', () => {
  const result = validateWorkForm(validInput({ sourceUrl: 'http://example.com/work' }))
  assert.ok(result.errors.some((e) => e.includes('HTTPS')))
})

test('validateWorkForm allows empty source url', () => {
  const result = validateWorkForm(validInput({ sourceUrl: '' }))
  assert.deepEqual(result.errors, [])
  assert.equal(result.work?.sourceUrl, null)
})

test('validateWorkForm requires copyright confirmation', () => {
  const result = validateWorkForm(validInput({ copyright: '' }))
  assert.ok(result.errors.some((e) => e.includes('版权确认')))
})

test('validateWorkForm rejects overly long description', () => {
  const result = validateWorkForm(validInput({ description: 'x'.repeat(1201) }))
  assert.ok(result.errors.some((e) => e.includes('作品简介')))
})
