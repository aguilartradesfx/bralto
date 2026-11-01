import { test } from 'node:test'
import assert from 'node:assert/strict'
import { elegirArranque, type FilaArranque } from './elegir.ts'

const fila = (fecha: string, orden: number, usado = false): FilaArranque => ({
  id: `${fecha}-${orden}`,
  fecha,
  orden,
  secciones: ['Saludo', 'Frase'],
  inicios: [0, 3.2],
  usado_en: usado ? '2026-11-01T14:00:00Z' : null,
})

test('usa el primero sin usar de hoy, en orden', () => {
  const filas = [fila('2026-11-01', 2), fila('2026-11-01', 1, true), fila('2026-11-01', 3)]
  assert.equal(elegirArranque(filas, '2026-11-01')?.id, '2026-11-01-2')
})

test('si hoy ya se usaron todos, usa uno sin usar del día más reciente de antes', () => {
  const filas = [fila('2026-11-01', 1, true), fila('2026-10-30', 4), fila('2026-10-31', 3), fila('2026-10-31', 2)]
  assert.equal(elegirArranque(filas, '2026-11-01')?.id, '2026-10-31-2')
})

test('nunca usa los que se prepararon para mañana', () => {
  assert.equal(elegirArranque([fila('2026-11-02', 1)], '2026-11-01'), null)
})

test('si no queda ninguno sin usar, no hay arranque', () => {
  assert.equal(elegirArranque([fila('2026-11-01', 1, true)], '2026-11-01'), null)
  assert.equal(elegirArranque([], '2026-11-01'), null)
})

test('devuelve lo que necesita la pantalla: el id, lo que dice y cuándo empieza cada parte', () => {
  assert.deepEqual(elegirArranque([fila('2026-11-01', 1)], '2026-11-01'), {
    id: '2026-11-01-1',
    fecha: '2026-11-01',
    orden: 1,
    secciones: ['Saludo', 'Frase'],
    inicios: [0, 3.2],
    usado_en: null,
  })
})
