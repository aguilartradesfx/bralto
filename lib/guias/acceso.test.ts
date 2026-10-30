import { test } from 'node:test'
import assert from 'node:assert/strict'
import { firmarAcceso, leerAcceso, secretoGuias } from './acceso.ts'

const S = 'secreto-de-prueba'

test('una cookie firmada se lee y devuelve el contacto', () => {
  assert.equal(leerAcceso(S, firmarAcceso(S, 'contacto-1')), 'contacto-1')
})

test('una cookie alterada, de otro secreto, vacía o sin punto no da acceso', () => {
  const buena = firmarAcceso(S, 'contacto-1')
  assert.equal(leerAcceso(S, buena.replace('contacto-1', 'contacto-2')), null)
  assert.equal(leerAcceso('otro', buena), null)
  assert.equal(leerAcceso(S, ''), null)
  assert.equal(leerAcceso(S, undefined), null)
  assert.equal(leerAcceso(S, 'sin-punto'), null)
  assert.equal(leerAcceso(S, 'contacto-1.' + 'x'.repeat(43)), null)
})

test('secretoGuias usa GUIAS_SECRET y si no, deriva uno estable de la service role', () => {
  assert.equal(secretoGuias({ GUIAS_SECRET: 'propio' }), 'propio')
  const a = secretoGuias({ SUPABASE_SERVICE_ROLE_KEY: 'llave-1' })
  assert.equal(a, secretoGuias({ SUPABASE_SERVICE_ROLE_KEY: 'llave-1' }))
  assert.notEqual(a, secretoGuias({ SUPABASE_SERVICE_ROLE_KEY: 'llave-2' }))
  assert.notEqual(a, 'llave-1')
  assert.throws(() => secretoGuias({}))
})
