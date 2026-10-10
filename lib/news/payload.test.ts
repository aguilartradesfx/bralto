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

test('parsePublish: tipo artículo sin fuente y con fecha opcional', () => {
  const { fuente_url, fuente_nombre, fuente_texto, ...sinFuente } = ok
  const r = parsePublish({ ...sinFuente, tipo: 'articulo', publicada_en: '2026-10-03T12:00:00Z' })
  assert.equal(r.ok, true)
  if (r.ok) {
    assert.equal(r.value.tipo, 'articulo')
    assert.equal(r.value.publicada_en, '2026-10-03T12:00:00Z')
  }
})

test('parsePublish: sin tipo es una noticia; un tipo desconocido no pasa', () => {
  const r = parsePublish(ok)
  assert.equal(r.ok && r.value.tipo, 'noticia')
  assert.equal(parsePublish({ ...ok, tipo: 'opinion' }).ok, false)
})

test('parseValidate acepta el tipo artículo sin fuente', () => {
  assert.equal(parseValidate({ idioma: 'es', tipo: 'articulo', borrador: draft }).ok, true)
})
