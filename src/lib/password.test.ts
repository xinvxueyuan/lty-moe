import test from 'node:test'
import assert from 'node:assert/strict'
import { hashPassword, verifyPassword } from './password.server'

test('hashPassword and verifyPassword round-trip', async () => {
  const hash = await hashPassword('correct horse battery')
  assert.equal(await verifyPassword('correct horse battery', hash), true)
  assert.equal(await verifyPassword('wrong password', hash), false)
})
