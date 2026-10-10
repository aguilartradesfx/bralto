import { test } from 'node:test'
import assert from 'node:assert/strict'
import { LEGAL_REVIEWED, legalPagesVisible } from './legal.ts'
import { PRIVACY } from '../app/[locale]/privacidad/content.ts'
import { TERMS } from '../app/[locale]/terminos/content.ts'
import type { LegalDoc } from '../components/home/legal-page.tsx'

// Todo el texto visible de un documento, en orden
const textOf = (doc: LegalDoc) =>
  [doc.title, doc.intro, ...doc.sections.flatMap((s) => [s.heading, ...s.body.flat()])].join('\n')

test('los textos legales están revisados y se publican', () => {
  assert.equal(LEGAL_REVIEWED, true)
})

test('publicados, no queda ningún dato entre corchetes por completar', () => {
  for (const doc of [PRIVACY, TERMS]) {
    assert.deepEqual(textOf(doc).match(/\[[^\]]*\]/g) ?? [], [], doc.title)
  }
})

test('los términos dicen qué pasa con los reembolsos sin la frase «no reembolsable»', () => {
  const terms = textOf(TERMS)
  assert.match(terms, /Reembolsos/)
  assert.doesNotMatch(terms, /no reembolsable|si no, no/i)
})

test('sin revisión legal: solo donde se ven los bloques pendientes (desarrollo y previews)', () => {
  assert.equal(legalPagesVisible({ reviewed: false, pendingVisible: false }), false)
  assert.equal(legalPagesVisible({ reviewed: false, pendingVisible: true }), true)
})

test('con la revisión aprobada se publican en todas partes', () => {
  assert.equal(legalPagesVisible({ reviewed: true, pendingVisible: false }), true)
})
