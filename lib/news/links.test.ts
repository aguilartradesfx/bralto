import { test } from 'node:test'
import assert from 'node:assert/strict'
import { escapeHtml, isNewsAction, signNewsToken, verifyNewsToken } from './links.ts'

const S = 'secreto-de-prueba'

test('un token sirve solo para su nota y su acción', () => {
  const t = signNewsToken(S, 'id-1', 'ocultar')
  assert.equal(verifyNewsToken(S, 'id-1', 'ocultar', t), true)
  assert.equal(verifyNewsToken(S, 'id-1', 'publicar', t), false)
  assert.equal(verifyNewsToken(S, 'id-2', 'ocultar', t), false)
  assert.equal(verifyNewsToken('otro', 'id-1', 'ocultar', t), false)
  assert.equal(verifyNewsToken(S, 'id-1', 'ocultar', t.slice(0, -1)), false)
  assert.equal(verifyNewsToken(S, 'id-1', 'ocultar', ''), false)
})

test('sin secreto no se firma ni se verifica', () => {
  assert.throws(() => signNewsToken('', 'id-1', 'ver'))
  assert.equal(verifyNewsToken('', 'id-1', 'ver', 'x'), false)
})

test('isNewsAction', () => {
  assert.equal(isNewsAction('ocultar'), true)
  assert.equal(isNewsAction('borrar'), false)
})

test('escapeHtml', () => {
  assert.equal(escapeHtml(`<b>"Hola" & 'chau'</b>`), '&lt;b&gt;&quot;Hola&quot; &amp; &#39;chau&#39;&lt;/b&gt;')
})
