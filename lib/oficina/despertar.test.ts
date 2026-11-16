import { test } from 'node:test'
import assert from 'node:assert/strict'
import { aCorrerAlDespertar, reprogramar } from './despertar.ts'

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
test('con margen de 3 h mueve uno 1 h antes de desde, nunca antes de ahora; uno 4 h antes no', () => {
  const ahora = new Date('2026-11-16T18:00:00Z')
  const r = reprogramar([pub('a', '2026-11-16T15:00:00Z'), pub('b', '2026-11-16T12:00:00Z')], new Date('2026-11-16T16:00:00Z'), ahora, 3 * 60 * MIN)
  assert.equal(r.length, 1)
  assert.equal(r[0].id, 'a')
  assert.ok(new Date(r[0].publicar_en).getTime() >= ahora.getTime())
})
test('dentro de la ventana conserva la hora desplazada', () => {
  const r = reprogramar([pub('a', '2026-11-16T16:15:00Z')], new Date('2026-11-16T16:00:00Z'), new Date('2026-11-16T17:00:00Z'))
  assert.deepEqual(r, [{ id: 'a', publicar_en: '2026-11-16T17:15:00.000Z' }])
})

test('aCorrerAlDespertar: salta lo que corre en menos de una hora y lo frecuente', () => {
  const ahora = new Date('2026-11-15T15:30:00Z') // 9:30 CR
  const ags = [
    { id: 'pronto', ruta: '/a', cada_minutos: null, horario: '0 16 * * *' }, // 10:00 CR, en 30 min
    { id: 'lejos', ruta: '/b', cada_minutos: null, horario: '0 18 * * *' }, // 12:00 CR, en 2.5 h
    { id: 'tarde', ruta: '/c', cada_minutos: null, horario: '0 0 * * *' },
    { id: 'hora', ruta: '/d', cada_minutos: 60, horario: '0 * * * *' },
    { id: 'sinruta', ruta: null, cada_minutos: null, horario: '0 0 * * *' },
  ]
  assert.deepEqual(aCorrerAlDespertar(ags, ahora).map((a) => a.id), ['lejos', 'tarde'])
})
