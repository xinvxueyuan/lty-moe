import test from 'node:test'
import assert from 'node:assert/strict'
import {
  buildDiscussionBody,
  duplicateKey,
  normalizeAuthorId,
  normalizeAuthors,
  normalizeUrl,
  parseDiscussionBody,
} from './discussions.mjs'

const work = {
  id: 'issue-1',
  sourceIssue: 1,
  sourceIssueUrl: 'https://github.com/example/lty-moe/issues/1',
  sourceUrl: 'https://example.com/work/',
  title: '蓝色 夜航',
  creator: 'Sora Kim',
  handle: '@sora_kim',
  category: '插画',
  image: 'https://github.com/user-attachments/assets/image',
  description: 'desc',
  date: '2026.01.01',
  likes: '0',
  comments: 0,
  palette: [],
  license: 'CC BY 4.0',
  maintainers: ['@sora_kim'],
  coAuthors: [],
  aiDisclosure: '未使用生成式 AI',
  origin: '原创',
  submittedBy: 'sora-kim',
}

test('discussion body round-trips a work payload', () => {
  const parsed = parseDiscussionBody(buildDiscussionBody(work))
  assert.equal(parsed.ok, true)
  assert.equal(parsed.payload.id, 'issue-1')
  assert.equal(parsed.payload.canonicalAuthorId, 'sora-kim')
})

test('normalization produces stable strong keys', () => {
  assert.equal(normalizeAuthorId('@Sora_Kim', 'Sora Kim'), 'sora-kim')
  assert.equal(normalizeUrl('https://example.com/work/?utm_source=x'), 'https://example.com/work')
  assert.equal(duplicateKey(work), 'issue:1')
})

test('authors are grouped by canonical author id', () => {
  const authors = normalizeAuthors([work, { ...work, id: 'issue-2', creator: 'Sora K.' }])
  assert.equal(authors.length, 1)
  assert.deepEqual(authors[0].workIds, ['issue-1', 'issue-2'])
  assert.deepEqual(authors[0].aliases, ['Sora K.'])
})
