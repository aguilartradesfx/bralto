import { test } from 'node:test'
import assert from 'node:assert/strict'
import { MENSAJES, errorDelPaso, pasoConError } from './campos.ts'

test('cada paso de la ventana revisa su campo antes de seguir', () => {
  assert.equal(errorDelPaso(1, '  '), MENSAJES.nombre)
  assert.equal(errorDelPaso(1, 'A'), MENSAJES.nombre)
  assert.equal(errorDelPaso(1, ' Ana  María '), null)
  assert.equal(errorDelPaso(1, 'x'.repeat(81)), MENSAJES.nombre)
  assert.equal(errorDelPaso(2, '8888 8888'), MENSAJES.whatsapp)
  assert.equal(errorDelPaso(2, '+506 8888-8888'), null)
  assert.equal(errorDelPaso(2, '00506 8888 8888'), null)
})

test('si el servidor devuelve errores, la ventana vuelve al primer paso que tenga uno', () => {
  assert.equal(pasoConError(undefined), null)
  assert.equal(pasoConError({}), null)
  assert.equal(pasoConError({ correo: 'x', acepta: 'y' }), 3)
  assert.equal(pasoConError({ acepta: 'x' }), 3)
  assert.equal(pasoConError({ whatsapp: 'x', correo: 'y' }), 2)
  assert.equal(pasoConError({ acepta: 'x', nombre: 'y' }), 1)
})
