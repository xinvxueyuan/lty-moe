import test from 'node:test'
import assert from 'node:assert/strict'
import { parseIssueBody } from './parse-submission.mjs'

const validBody = `### 作品标题 / Work title

天依蓝的夏天

### 创作者名称 / Creator name

测试创作者

### 创作者主页 ID / Creator handle

@test_creator

### 作品类型 / Category

曲绘

### 作品图片 / Artwork image

![art](https://github.com/user-attachments/assets/abc-123)

### 作品简介 / Description

给天依的一张夏日曲绘。

### 原作链接 / Source link

https://example.com/work

### 版权确认 / Copyright confirmation

- [x] 我确认这是我的作品，或我拥有发布授权。
`

test('parses a valid Issue Form submission', () => {
  const result = parseIssueBody(validBody, { issueNumber: 12, issueUrl: 'https://github.com/xinvxueyuan/lty-moe/issues/12', submittedBy: 'tester' })
  assert.equal(result.ok, true)
  assert.equal(result.submission.id, 'issue-12')
  assert.equal(result.submission.image, 'https://github.com/user-attachments/assets/abc-123')
  assert.equal(result.submission.category, '曲绘')
})

test('rejects a non-GitHub image attachment', () => {
  const result = parseIssueBody(validBody.replace('https://github.com/user-attachments/assets/abc-123', 'http://example.com/art.png'), { issueNumber: 13 })
  assert.equal(result.ok, false)
  assert.match(result.errors.join(' '), /github\.com\/user-attachments/)
})

test('rejects missing copyright confirmation', () => {
  const result = parseIssueBody(validBody.replace('- [x] 我确认这是我的作品，或我拥有发布授权。', '- [ ] 我确认这是我的作品，或我拥有发布授权。'), { issueNumber: 14 })
  assert.equal(result.ok, false)
  assert.match(result.errors.join(' '), /版权确认/)
})
