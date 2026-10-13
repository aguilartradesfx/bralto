import { test } from 'node:test'
import assert from 'node:assert/strict'
import { addDays, costaRicaToday, daysBetween, diasTexto, formatFecha, formatStamp, isMonday, isValidDate, weekEnd, weekStart } from './fechas.ts'

test('costaRicaToday: el día cambia a las 6:00 UTC', () => {
  assert.equal(costaRicaToday(new Date('2026-10-13T05:59:00Z')), '2026-10-12')
  assert.equal(costaRicaToday(new Date('2026-10-13T06:00:00Z')), '2026-10-13')
})

test('domingo 11 p. m. en Costa Rica sigue siendo la semana que termina', () => {
  const today = costaRicaToday(new Date('2026-10-19T05:00:00Z'))
  assert.equal(today, '2026-10-18')
  assert.equal(weekStart(today), '2026-10-12')
})

test('weekStart y weekEnd: de lunes a domingo, también al cruzar de mes y de año', () => {
  assert.equal(weekStart('2026-10-12'), '2026-10-12')
  assert.equal(weekStart('2026-10-13'), '2026-10-12')
  assert.equal(weekStart('2026-10-18'), '2026-10-12')
  assert.equal(weekEnd('2026-10-13'), '2026-10-18')
  assert.equal(weekStart('2026-11-01'), '2026-10-26')
  assert.equal(weekEnd('2026-12-30'), '2027-01-03')
})

test('isValidDate rechaza formatos y días que no existen', () => {
  assert.equal(isValidDate('2026-10-16'), true)
  assert.equal(isValidDate('2026-02-30'), false)
  assert.equal(isValidDate('16/10/2026'), false)
  assert.equal(isValidDate('2026-10-16T00:00'), false)
})

test('isMonday', () => {
  assert.equal(isMonday('2026-10-12'), true)
  assert.equal(isMonday('2026-10-13'), false)
  assert.equal(isMonday('no'), false)
})

test('addDays y daysBetween', () => {
  assert.equal(addDays('2026-10-31', 1), '2026-11-01')
  assert.equal(daysBetween('2026-10-13', '2026-10-19'), 6)
  assert.equal(daysBetween('2026-10-13', '2026-10-13'), 0)
})

test('formatFecha, formatStamp (hora CR, también con microsegundos de Postgres) y diasTexto', () => {
  assert.equal(formatFecha('2026-10-16'), '16 oct')
  assert.equal(formatFecha('2026-12-01'), '1 dic')
  assert.equal(formatStamp('2026-10-13T20:05:00Z'), '13 oct, 14:05')
  assert.equal(formatStamp('2026-10-14T03:30:00.123456+00:00'), '13 oct, 21:30')
  assert.equal(diasTexto(0), 'hoy')
  assert.equal(diasTexto(1), 'mañana')
  assert.equal(diasTexto(6), 'en 6 días')
})
