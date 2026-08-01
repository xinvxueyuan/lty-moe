import test from 'node:test'
import assert from 'node:assert/strict'
import { parseIssueBody, parseUpdateIssueBody } from './parse-submission.mjs'

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

### 许可证 / License

CC BY-NC 4.0

### 维护者 / Maintainers

@tester

### 共同作者 / Co-authors

@co_author

### AI 使用声明 / AI disclosure

使用 AI 辅助创作

### 作品来源 / Origin

原创

### 版权确认 / Copyright confirmation

- [x] 我确认这是我的作品，或我拥有发布授权。
`

test('parses a valid Issue Form submission', () => {
  const result = parseIssueBody(validBody, {
    issueNumber: 12,
    issueUrl: 'https://github.com/xinvxueyuan/lty-moe/issues/12',
    submittedBy: 'tester',
  })
  assert.equal(result.ok, true)
  assert.equal(result.submission.id, 'issue-12')
  assert.equal(result.submission.image, 'https://github.com/user-attachments/assets/abc-123')
  assert.equal(result.submission.category, '曲绘')
  assert.equal(result.submission.license, 'CC BY-NC 4.0')
  assert.deepEqual(result.submission.maintainers, ['@tester'])
  assert.deepEqual(result.submission.coAuthors, ['@co_author'])
  assert.equal(result.submission.aiDisclosure, '使用 AI 辅助创作')
  assert.equal(result.submission.origin, '原创')
})

test('rejects a non-GitHub image attachment', () => {
  const result = parseIssueBody(
    validBody.replace(
      'https://github.com/user-attachments/assets/abc-123',
      'http://example.com/art.png',
    ),
    { issueNumber: 13 },
  )
  assert.equal(result.ok, false)
  assert.match(result.errors.join(' '), /github\.com\/user-attachments/)
})

test('rejects missing copyright confirmation', () => {
  const result = parseIssueBody(
    validBody.replace(
      '- [x] 我确认这是我的作品，或我拥有发布授权。',
      '- [ ] 我确认这是我的作品，或我拥有发布授权。',
    ),
    { issueNumber: 14 },
  )
  assert.equal(result.ok, false)
  assert.match(result.errors.join(' '), /版权确认/)
})

test('parses an update Issue body with partial changes', () => {
  const result = parseUpdateIssueBody(
    `### 作品 ID / Work ID

issue-12

### 作品标题 / Work title

更新后的标题

### 作品类型 / Category

不修改 / Keep current

### 许可证 / License

CC BY 4.0

### AI 使用声明 / AI disclosure

未使用生成式 AI

### 作品来源 / Origin

转载

### 版权确认 / Copyright confirmation

- [x] 我确认这是我的作品，或我拥有将其发布到天依档案的授权。
`,
    { issueNumber: 20 },
  )
  assert.equal(result.ok, true)
  assert.deepEqual(result.update.changes, {
    title: '更新后的标题',
    license: 'CC BY 4.0',
    aiDisclosure: '未使用生成式 AI',
    origin: '转载',
  })
})
