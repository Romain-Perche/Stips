import { test } from 'node:test'
import assert from 'node:assert/strict'
import { jeton, jetonValide } from './jetons.ts'

const secret = 's'.repeat(32)
const id = '0b8a2c1e-5f3d-4a6b-9c7e-1d2f3a4b5c6d'

test('un jeton ne vaut que pour son usage et sa ligne', () => {
  const j = jeton(secret, 'validation', id)
  assert.ok(jetonValide(secret, 'validation', id, j))
  assert.ok(!jetonValide(secret, 'validation', id.replace('0b8a', '0b8b'), j))
  assert.ok(!jetonValide(secret, 'autre', id, j))
  assert.ok(!jetonValide('t'.repeat(32), 'validation', id, j))
})

test('un jeton absent, tronqué ou non textuel est refusé sans lever', () => {
  const j = jeton(secret, 'validation', id)
  assert.ok(!jetonValide(secret, 'validation', id, undefined))
  assert.ok(!jetonValide(secret, 'validation', id, j.slice(1)))
  assert.ok(!jetonValide(secret, 'validation', id, ['x']))
})
