import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizeCategory, parseTagNames, slugifyTag, workCategories } from './taxonomy'

test('workCategories is the single source of truth list', () => {
  assert.ok(workCategories.includes('插画'))
  assert.ok(workCategories.includes('摄影'))
  assert.ok(workCategories.includes('3D'))
  assert.equal(workCategories.includes('3D / 动画' as never), false)
})

test('normalizeCategory maps aliases', () => {
  assert.equal(normalizeCategory('3D / 动画'), '3D')
  assert.equal(normalizeCategory('插画'), '插画')
  assert.equal(normalizeCategory('nope'), null)
})

test('parseTagNames dedupes and caps tags', () => {
  assert.deepEqual(parseTagNames('洛天依, 曲绘, 洛天依'), ['洛天依', '曲绘'])
  assert.equal(parseTagNames(Array.from({ length: 20 }, (_, i) => `t${i}`).join(',')).length, 12)
})

test('slugifyTag supports chinese names', () => {
  assert.equal(slugifyTag('天依蓝'), '天依蓝')
  assert.ok(slugifyTag('Hello World').includes('hello'))
})
