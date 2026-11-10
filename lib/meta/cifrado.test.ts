import { test } from 'node:test'
import assert from 'node:assert/strict'
import { randomBytes } from 'node:crypto'
import { cifrar, descifrar } from './cifrado.ts'

const CLAVE = randomBytes(32).toString('base64')

test('cifrar y descifrar: devuelve el texto original y no lo deja a la vista', () => {
  const sello = cifrar('token-de-una-pagina', CLAVE)
  assert.equal(descifrar(sello, CLAVE), 'token-de-una-pagina')
  assert.equal(sello.includes('token-de-una-pagina'), false)
})

test('cifrar: el mismo texto nunca sale igual dos veces', () => {
  assert.notEqual(cifrar('igual', CLAVE), cifrar('igual', CLAVE))
})

test('descifrar: un sello alterado no se acepta', () => {
  const [version, iv, etiqueta, datos] = cifrar('secreto', CLAVE).split('.')
  const otroDato = Buffer.from(datos, 'base64url')
  otroDato[0] ^= 1
  assert.throws(() => descifrar([version, iv, etiqueta, otroDato.toString('base64url')].join('.'), CLAVE))
})

test('descifrar: con otra clave no se puede leer', () => {
  assert.throws(() => descifrar(cifrar('secreto', CLAVE), randomBytes(32).toString('base64')))
})

test('descifrar: lo que no es un sello se rechaza', () => {
  assert.throws(() => descifrar('texto-cualquiera', CLAVE), /sello/)
})

test('cifrar: una clave que no mide 32 bytes no sirve', () => {
  assert.throws(() => cifrar('secreto', randomBytes(16).toString('base64')), /32 bytes/)
  assert.throws(() => cifrar('secreto', ''), /32 bytes/)
})
