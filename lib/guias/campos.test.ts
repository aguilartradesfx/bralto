import { test } from 'node:test'
import assert from 'node:assert/strict'
import { MENSAJES, errorDelNombre, nombreValido, pasoConError } from './campos.ts'

test('el nombre tiene que ser completo: nombre y apellido', () => {
  assert.equal(nombreValido('Alejandro'), false)
  assert.equal(nombreValido('Alejandro A.'), false) // una inicial no cuenta como apellido
  assert.equal(nombreValido('Ana 123'), false)
  assert.equal(nombreValido('Alejandro Aguilar'), true)
  assert.equal(nombreValido('José de la Cruz'), true)
  assert.equal(nombreValido('Li Na'), true)
  assert.equal(nombreValido('María José Núñez'), true)
  assert.equal(nombreValido(`Ana ${'x'.repeat(80)}`), false)
})

test('el paso del nombre lo revisa limpio y con el mensaje de nombre completo', () => {
  assert.equal(errorDelNombre('  '), MENSAJES.nombre)
  assert.equal(errorDelNombre(' Alejandro '), MENSAJES.nombre)
  assert.equal(errorDelNombre(' Ana   María  Pérez '), null)
  assert.match(MENSAJES.nombre, /apellido/)
})

test('si el servidor devuelve errores, la ventana vuelve al primer paso que tenga uno', () => {
  assert.equal(pasoConError(undefined), null)
  assert.equal(pasoConError({}), null)
  assert.equal(pasoConError({ correo: 'x', acepta: 'y' }), 3)
  assert.equal(pasoConError({ acepta: 'x' }), 3)
  assert.equal(pasoConError({ whatsapp: 'x', correo: 'y' }), 2)
  assert.equal(pasoConError({ acepta: 'x', nombre: 'y' }), 1)
})
