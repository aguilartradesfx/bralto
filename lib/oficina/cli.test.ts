import { test } from 'node:test'
import assert from 'node:assert/strict'
import { leerArgs, validarAgentes } from './cli.ts'

const minimo = { id: 'drax', nombre: 'Drax', oficio: 'Redes', area: 'contenido', puesto: 3, donde: 'servidor' }

test('estado', () => assert.deepEqual(leerArgs(['estado']), { orden: 'estado' }))
test('pasa con --para', () =>
  assert.deepEqual(leerArgs(['drax', 'pasa', 'Te paso 2 reels', '--para', 'plexi']), {
    orden: 'marcar',
    marca: { agente: 'drax', tipo: 'pasa', texto: 'Te paso 2 reels', para: 'plexi' },
  }))
test('--ref llena ref_tabla y ref_id', () => {
  const r = leerArgs(['drax', 'publica', 'Salió', '--ref', 'redes_publicaciones:abc'])
  assert.ok('marca' in r)
  assert.equal(r.marca.ref_tabla, 'redes_publicaciones')
  assert.equal(r.marca.ref_id, 'abc')
})
test('--dura 90', () => {
  const r = leerArgs(['drax', 'termina', 'Listo', '--dura', '90'])
  assert.ok('marca' in r)
  assert.equal(r.marca.dura_seg, 90)
})
test('errores de argumentos', () => {
  for (const a of [
    ['drax', 'nada', 'x'], ['drax'], ['drax', 'pasa'], ['drax', 'pasa', ''], [],
    ['drax', 'pasa', 'x', '--raro', '1'], ['drax', 'pasa', 'x', '--para'],
    ['drax', 'pasa', 'x', '--dura', '-1'], ['drax', 'pasa', 'x', '--dura', '1.5'],
    ['drax', 'pasa', 'x', '--ref', 'sin-dos-puntos'], ['drax', 'pasa', 'x', '--ref', ':id'],
  ]) assert.ok('error' in leerArgs(a), JSON.stringify(a))
})
test('validarAgentes rechaza donde inválido', () => {
  const r = validarAgentes([{ ...minimo, donde: 'luna' }])
  assert.ok('error' in r)
  assert.match(r.error, /donde/)
})
test('validarAgentes rechaza puesto repetido e id repetido', () => {
  assert.ok('error' in validarAgentes([minimo, { ...minimo, id: 'otro' }]))
  assert.ok('error' in validarAgentes([minimo, { ...minimo, puesto: 4 }]))
  assert.ok('error' in validarAgentes({}))
  assert.ok('error' in validarAgentes([{ ...minimo, puesto: 24 }]))
  assert.ok('error' in validarAgentes([{ ...minimo, estado_fijo: 'x' }]))
})
test('validarAgentes llena los valores por defecto', () => {
  const r = validarAgentes([minimo])
  assert.ok('ok' in r)
  assert.deepEqual(r.ok[0], {
    ...minimo, aspecto: {}, personalidad: '', frase: '', horario: null, cada_minutos: null, ruta: null,
    estado_fijo: null, despierto_siempre: false, dura_min: 10, ultima_revision: null,
  })
})
