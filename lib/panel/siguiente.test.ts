import { test } from 'node:test'
import assert from 'node:assert/strict'
import { conAncla, rutaDeLogin, siguienteSeguro } from './siguiente.ts'

const ID = '3f1c2a7e-1111-4a1a-9a9a-000000000001'

test('siguienteSeguro: rutas del mismo sitio, con su consulta y su #ancla', () => {
  for (const ok of ['/guiones', `/guiones#${ID}`, '/guiones?f=listos', '/crm/mensajes?filtro=por_responder', '/', '/ideas?f=yo#x']) {
    assert.equal(siguienteSeguro(ok), ok, ok)
  }
})

test('siguienteSeguro: nada que pueda llevar a otro sitio ni volver al login', () => {
  for (const malo of [
    '//evil.example',
    '//evil.example/guiones',
    '/\\evil.example',
    '/\\/evil.example',
    'https://evil.example',
    'http:/evil.example',
    'javascript:alert(1)',
    'guiones',
    '',
    ' /guiones',
    '/guiones\n',
    '/gui\tones',
    '/guiones\\x',
    '/login',
    '/login?next=/guiones',
    `/${'a'.repeat(2100)}`,
    null,
    undefined,
    42,
  ]) {
    assert.equal(siguienteSeguro(malo), null, String(malo))
  }
})

test('rutaDeLogin: lleva a /login con el enlace que pidió (el # lo guarda el navegador solo)', () => {
  assert.equal(rutaDeLogin('/guiones'), '/login?next=%2Fguiones')
  assert.equal(rutaDeLogin('/guiones', '?f=listos'), '/login?next=%2Fguiones%3Ff%3Dlistos')
  // el inicio de siempre no hace falta decirlo
  assert.equal(rutaDeLogin('/admin'), '/login')
  assert.equal(rutaDeLogin('/'), '/login')
  // algo raro: login a secas
  assert.equal(rutaDeLogin('//evil.example'), '/login')
})

test('conAncla: le suma el #ancla del enlace (el que el navegador guardó al pasar por /login)', () => {
  assert.equal(conAncla('/guiones', `#${ID}`), `/guiones#${ID}`)
  assert.equal(conAncla('/guiones', ''), '/guiones')
  assert.equal(conAncla(`/guiones#viejo`, `#${ID}`), `/guiones#${ID}`)
  assert.equal(conAncla('/guiones', '#con espacio'), '/guiones')
})
