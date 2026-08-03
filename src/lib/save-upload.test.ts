import test from 'node:test'
import assert from 'node:assert/strict'
import { resolveImageExtension, validateImageFile } from './save-upload.server'

test('resolveImageExtension accepts common image extensions', () => {
  assert.equal(resolveImageExtension('art.PNG'), '.png')
  assert.equal(resolveImageExtension('shot.jpeg'), '.jpeg')
  assert.equal(resolveImageExtension('clip.webp'), '.webp')
  assert.equal(resolveImageExtension('notes.txt'), undefined)
})

test('validateImageFile rejects missing and invalid files', () => {
  assert.deepEqual(validateImageFile(null).errors, ['请选择一张图片。'])
  const bad = new File([new Uint8Array([1, 2, 3])], 'doc.pdf', { type: 'application/pdf' })
  const result = validateImageFile(bad)
  assert.ok(result.errors.some((error) => error.includes('图片格式')))
})

test('validateImageFile accepts a png file under the size limit', () => {
  const file = new File([new Uint8Array([137, 80, 78, 71])], 'art.png', { type: 'image/png' })
  const result = validateImageFile(file)
  assert.deepEqual(result.errors, [])
  assert.equal(result.file?.name, 'art.png')
})
