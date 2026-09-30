import { test } from 'node:test'
import assert from 'node:assert/strict'
import { proposalSlugFromUrl } from './slug.ts'

test('extrae el slug de la URL pública', () => {
  assert.equal(proposalSlugFromUrl('https://bralto.io/propuestas/Ab3dE5gH9jK1'), 'Ab3dE5gH9jK1')
  assert.equal(proposalSlugFromUrl('https://www.bralto.io/propuestas/abc/'), 'abc')
  assert.equal(proposalSlugFromUrl('https://bralto.io/propuestas/abc?utm=x'), 'abc')
})

test('sin URL o URL ajena → null', () => {
  assert.equal(proposalSlugFromUrl(null), null)
  assert.equal(proposalSlugFromUrl(undefined), null)
  assert.equal(proposalSlugFromUrl(''), null)
  assert.equal(proposalSlugFromUrl('https://bralto.io/es/precios'), null)
})
