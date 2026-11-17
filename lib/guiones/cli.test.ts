import { test } from 'node:test'
import assert from 'node:assert/strict'
import { diaDeRuta, esDia, leerArgsCargar, salidaDeCarga } from './cli.ts'

const ID = '3f1c2a7e-1111-4a1a-9a9a-000000000001'

test('esDia: solo fechas de verdad en AAAA-MM-DD', () => {
  for (const d of ['2026-11-17', '2024-02-29', '2026-01-01']) assert.equal(esDia(d), true, d)
  for (const d of ['2026-02-30', '2025-02-29', '2026-13-01', '2026-11-7', '26-11-17', '2026/11/17', 'hoy', '']) assert.equal(esDia(d), false, d)
})

test('diaDeRuta: el día sale de la carpeta de publicaciones', () => {
  assert.equal(diaDeRuta('/srv/redes/publicaciones/2026-11-17/guion/guion.json'), '2026-11-17')
  assert.equal(diaDeRuta('publicaciones/2026-11-17/guion/guion.json'), '2026-11-17')
  assert.equal(diaDeRuta('C:\\redes\\publicaciones\\2026-11-18\\guion\\guion.json'), '2026-11-18')
})

test('diaDeRuta: si no hay «publicaciones», la última carpeta con fecha', () => {
  assert.equal(diaDeRuta('/tmp/2026-11-01/pruebas/2026-11-19/guion.json'), '2026-11-19')
  assert.equal(diaDeRuta('/tmp/publicaciones/borradores/2026-11-20/guion.json'), '2026-11-20')
})

test('diaDeRuta: sin una carpeta con fecha válida no adivina', () => {
  assert.equal(diaDeRuta('/tmp/guion.json'), null)
  assert.equal(diaDeRuta('/tmp/publicaciones/camara-2026-11-10/guion.json'), null)
  assert.equal(diaDeRuta('/tmp/publicaciones/2026-02-30/guion/guion.json'), null)
  assert.equal(diaDeRuta('/tmp/guiones/2026-11-17.json'), null)
})

test('leerArgsCargar: la ruta sola, o con --dia y --carpeta', () => {
  assert.deepEqual(leerArgsCargar(['g.json']), { ruta: 'g.json', dia: null, carpeta: null })
  assert.deepEqual(leerArgsCargar(['g.json', '--dia', '2026-11-17', '--carpeta', '/srv/x']), { ruta: 'g.json', dia: '2026-11-17', carpeta: '/srv/x' })
  assert.deepEqual(leerArgsCargar(['--dia=2026-11-17', 'g.json']), { ruta: 'g.json', dia: '2026-11-17', carpeta: null })
})

test('leerArgsCargar: lo mal escrito se explica', () => {
  assert.deepEqual(leerArgsCargar([]), { error: 'Falta la ruta del guion.json' })
  assert.deepEqual(leerArgsCargar(['g.json', '--dia']), { error: 'Falta el valor de --dia' })
  assert.deepEqual(leerArgsCargar(['g.json', '--dia', '--carpeta', 'x']), { error: 'Falta el valor de --dia' })
  assert.deepEqual(leerArgsCargar(['g.json', '--dia', '17-11-2026']), { error: '--dia tiene que ser una fecha AAAA-MM-DD (vino «17-11-2026»)' })
  assert.deepEqual(leerArgsCargar(['g.json', '--carpeta', '  ']), { error: '--carpeta está vacía' })
  assert.deepEqual(leerArgsCargar(['g.json', '--titulo', 'x']), { error: 'Opción desconocida: --titulo' })
  assert.deepEqual(leerArgsCargar(['a.json', 'b.json']), { error: 'Sobra «b.json»: va un solo guion.json' })
})

test('salidaDeCarga: resumen, id y el enlace del panel', () => {
  assert.deepEqual(salidaDeCarga({ id: ID, nuevo: true, titulo: 'Ordena tus pedidos', dia: '2026-11-17', estado: 'listo', lineas: 9, ganchos: 5 }), [
    'Guion nuevo: «Ordena tus pedidos» para el 2026-11-17 (9 líneas y 5 ganchos)',
    `id: ${ID}`,
    `https://admin.bralto.io/guiones#${ID}`,
  ])
  const otra = salidaDeCarga({ id: ID, nuevo: false, titulo: 'Ordena tus pedidos', dia: '2026-11-17', estado: 'subido', lineas: 1, ganchos: 5 })
  assert.equal(otra[0], 'Guion actualizado: «Ordena tus pedidos» para el 2026-11-17 (1 línea y 5 ganchos). Sigue en «subido»')
})
