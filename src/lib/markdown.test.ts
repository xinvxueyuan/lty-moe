import test from 'node:test'
import assert from 'node:assert/strict'
import { renderMarkdown } from './markdown'

test('renderMarkdown escapes raw html', () => {
  const html = renderMarkdown('<script>alert(1)</script>')
  assert.equal(html.includes('<script>'), false)
  assert.ok(html.includes('&lt;script&gt;'))
})

test('renderMarkdown supports basic formatting', () => {
  const html = renderMarkdown('## Title\n\n**bold** and *em*\n\n- one\n- two')
  assert.ok(html.includes('<h2>'))
  assert.ok(html.includes('<strong>bold</strong>'))
  assert.ok(html.includes('<em>em</em>'))
  assert.ok(html.includes('<ul>'))
})
