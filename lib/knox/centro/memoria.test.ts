import { test } from 'node:test'
import assert from 'node:assert/strict'
import { memo, olvidar } from './memoria.ts'

test('memo guarda la lectura y olvidar hace que la próxima vaya a la fuente', async () => {
  let lecturas = 0
  const leer = async () => ++lecturas
  assert.equal(await memo('prueba:olvidar', 60_000, leer), 1)
  assert.equal(await memo('prueba:olvidar', 60_000, leer), 1)
  olvidar('prueba:olvidar')
  assert.equal(await memo('prueba:olvidar', 60_000, leer), 2)
  assert.equal(await memo('prueba:olvidar', 60_000, leer), 2)
})
