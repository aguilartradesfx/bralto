import { test } from 'node:test'
import assert from 'node:assert/strict'
import { siguienteCorrida, horaCR } from './horario.ts'

test('la noche: 0 1 * * * desde el 15/11 a las 20:00 UTC', () =>
  assert.equal(siguienteCorrida('0 1 * * *', new Date('2026-11-15T20:00:00Z'))?.toISOString(), '2026-11-16T01:00:00.000Z'))
test('cada 6 h al minuto 40', () =>
  assert.equal(siguienteCorrida('40 */6 * * *', new Date('2026-11-15T07:00:00Z'))?.toISOString(), '2026-11-15T12:40:00.000Z'))
test('domingo 15:00 UTC desde un lunes', () =>
  assert.equal(siguienteCorrida('0 15 * * 0', new Date('2026-11-16T10:00:00Z'))?.toISOString(), '2026-11-22T15:00:00.000Z'))
test('cada 5 min salta al siguiente múltiplo', () =>
  assert.equal(siguienteCorrida('*/5 * * * *', new Date('2026-11-15T20:02:10Z'))?.toISOString(), '2026-11-15T20:05:00.000Z'))
test('mal escrita → null', () => assert.equal(siguienteCorrida('cada rato', new Date()), null))
test('hora de Costa Rica', () => {
  assert.equal(horaCR(new Date('2026-11-16T01:30:00Z')), '7:30 p. m.')
  assert.equal(horaCR(new Date('2026-11-15T16:00:00Z')), '10:00 a. m.')
  assert.equal(horaCR(new Date('2026-11-15T06:40:00Z')), '12:40 a. m.')
})
