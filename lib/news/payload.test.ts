import { test } from 'node:test'
import assert from 'node:assert/strict'
import { decodeImage, parsePublish, parseValidate } from './payload.ts'

const draft = { titulo: 't', resumen: 'r', cuerpo: 'c', imagen_alt: 'a' }
const ok = {
  es: draft,
  en: draft,
  fuente_url: 'https://x.com/a',
  fuente_nombre: 'X',
  fuente_texto: 'texto',
  imagen_base64: 'aGVsbG8=',
  estado: 'oculta',
}

test('parsePublish acepta el pedido completo', () => {
  assert.equal(parsePublish(ok).ok, true)
})

test('parsePublish dice qué falta', () => {
  const r = parsePublish({ ...ok, en: { titulo: 't' }, estado: 'borrador' })
  assert.equal(r.ok, false)
  if (!r.ok) {
    const all = r.problems.join('\n')
    assert.match(all, /en\.cuerpo/)
    assert.match(all, /estado/)
  }
})

test('parsePublish rechaza lo que no es objeto', () => {
  assert.equal(parsePublish(null).ok, false)
})

test('parseValidate', () => {
  assert.equal(parseValidate({ idioma: 'es', borrador: draft, fuente_url: 'u', fuente_nombre: 'n', fuente_texto: 't' }).ok, true)
  assert.equal(parseValidate({ idioma: 'pt', borrador: draft }).ok, false)
})

test('decodeImage acepta base64 con o sin prefijo data:', () => {
  assert.equal(decodeImage('aGVsbG8=').toString(), 'hello')
  assert.equal(decodeImage('data:image/png;base64,aGVsbG8=').toString(), 'hello')
})
