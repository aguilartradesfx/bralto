import { test } from 'node:test'
import assert from 'node:assert/strict'
import { LEGAL_REVIEWED, legalPagesVisible } from './legal.ts'

test('los textos legales siguen pendientes de revisión', () => {
  assert.equal(LEGAL_REVIEWED, false)
})

test('sin revisión legal: solo donde se ven los bloques pendientes (desarrollo y previews)', () => {
  assert.equal(legalPagesVisible({ reviewed: false, pendingVisible: false }), false)
  assert.equal(legalPagesVisible({ reviewed: false, pendingVisible: true }), true)
})

test('con la revisión aprobada se publican en todas partes', () => {
  assert.equal(legalPagesVisible({ reviewed: true, pendingVisible: false }), true)
})
