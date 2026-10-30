import { test } from 'node:test'
import assert from 'node:assert/strict'
import { diaCr, fechaHablada, horaHablada, inicioDelDia, saludo, sumarDias } from './fechas.ts'

test('el día es el de Costa Rica aunque en UTC ya sea mañana', () => {
  assert.equal(diaCr(new Date('2026-10-31T03:00:00Z')), '2026-10-30')
  assert.equal(diaCr(new Date('2026-10-31T06:00:00Z')), '2026-10-31')
})

test('el día empieza a las 6:00 UTC y se suman días sin saltos', () => {
  assert.equal(inicioDelDia('2026-10-30').toISOString(), '2026-10-30T06:00:00.000Z')
  assert.equal(sumarDias('2026-10-31', 1), '2026-11-01')
  assert.equal(sumarDias('2026-12-31', 1), '2027-01-01')
})

test('dice la hora como se dice en voz alta', () => {
  assert.equal(horaHablada(new Date('2026-10-31T00:00:00Z')), 'las 6 de la tarde')
  assert.equal(horaHablada(new Date('2026-10-30T19:00:00Z')), 'la 1 de la tarde')
  assert.equal(horaHablada(new Date('2026-10-30T18:00:00Z')), 'las 12 del mediodía')
  assert.equal(horaHablada(new Date('2026-10-30T16:30:00Z')), 'las 10 y media de la mañana')
  assert.equal(horaHablada(new Date('2026-10-31T03:15:00Z')), 'las 9 y cuarto de la noche')
})

test('saluda según la hora de Costa Rica', () => {
  assert.equal(saludo(new Date('2026-10-30T12:00:00Z')), 'Buenos días')
  assert.equal(saludo(new Date('2026-10-30T19:30:00Z')), 'Buenas tardes')
  assert.equal(saludo(new Date('2026-10-31T02:00:00Z')), 'Buenas noches')
})

test('la fecha va sin coma', () => {
  assert.equal(fechaHablada(new Date('2026-10-30T15:00:00Z')), 'viernes 30 de octubre')
})
