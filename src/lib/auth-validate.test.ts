import test from 'node:test'
import assert from 'node:assert/strict'
import {
  validateDisplayName,
  validateEmail,
  validateHandle,
  validatePassword,
} from './auth-validate'

test('validateEmail', () => {
  assert.equal(validateEmail('a@b.com'), null)
  assert.ok(validateEmail('bad'))
})

test('validateHandle', () => {
  assert.equal(validateHandle('sora_kim'), null)
  assert.ok(validateHandle('ab'))
})

test('validatePassword', () => {
  assert.equal(validatePassword('12345678'), null)
  assert.ok(validatePassword('short'))
})

test('validateDisplayName', () => {
  assert.equal(validateDisplayName('Sora'), null)
  assert.ok(validateDisplayName(''))
})
