import { test } from 'node:test'
import assert from 'node:assert/strict'
import { reprogramar } from './despertar.ts'

// Costa Rica = UTC-6: 18:00 CR = 00:00 UTC del día siguiente.
const MIN = 60_000
const pub = (id: string, iso: string, prueba = false) => ({ id, publicar_en: iso, prueba })

test('post de las 18:00 CR, dormidos 17:00 → 23:00 CR: al otro día 10:00 CR', () => {
  const r = reprogramar([pub('a', '2026-11-16T00:00:00Z')], new Date('2026-11-15T23:00:00Z'), new Date('2026-11-16T05:00:00Z'))
  assert.deepEqual(r, [{ id: 'a', publicar_en: '2026-11-16T16:00:00.000Z' }])
})
test('prueba de las 21:00 CR, dormidos 20:30 → 21:30 CR: al otro día 08:00 CR', () => {
  const r = reprogramar([pub('a', '2026-11-16T03:00:00Z', true)], new Date('2026-11-16T02:30:00Z'), new Date('2026-11-16T03:30:00Z'))
  assert.deepEqual(r, [{ id: 'a', publicar_en: '2026-11-16T14:00:00.000Z' }])
})
test('dos posts a las 10:00 CR: el segundo a las 10:30', () => {
  const r = reprogramar(
    [pub('b', '2026-11-16T07:00:00Z'), pub('a', '2026-11-16T06:00:00Z')],
    new Date('2026-11-16T05:00:00Z'), new Date('2026-11-16T08:00:00Z'))
  assert.deepEqual(r, [
    { id: 'a', publicar_en: '2026-11-16T16:00:00.000Z' },
    { id: 'b', publicar_en: '2026-11-16T16:30:00.000Z' },
  ])
})
test('un post una hora antes de desde no se toca', () =>
  assert.deepEqual(reprogramar([pub('a', '2026-11-16T15:00:00Z')], new Date('2026-11-16T16:00:00Z'), new Date('2026-11-16T18:00:00Z')), []))
test('con margen de 10 min mueve uno 5 min antes de desde, nunca antes de ahora; uno 1 h antes no', () => {
  const ahora = new Date('2026-11-16T18:00:00Z')
  const r = reprogramar([pub('a', '2026-11-16T15:55:00Z'), pub('b', '2026-11-16T15:00:00Z')], new Date('2026-11-16T16:00:00Z'), ahora, 10 * MIN)
  assert.equal(r.length, 1)
  assert.equal(r[0].id, 'a')
  assert.ok(new Date(r[0].publicar_en).getTime() >= ahora.getTime())
})
test('dentro de la ventana conserva la hora desplazada', () => {
  const r = reprogramar([pub('a', '2026-11-16T16:15:00Z')], new Date('2026-11-16T16:00:00Z'), new Date('2026-11-16T17:00:00Z'))
  assert.deepEqual(r, [{ id: 'a', publicar_en: '2026-11-16T17:15:00.000Z' }])
})
