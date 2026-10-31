import { test } from 'node:test'
import assert from 'node:assert/strict'
import { colones, compacto, decimal, diaCorto, diaYHora, dolares, entero, fechaCabecera, hace, minutosYSegundos, nombreDia, porcentaje, reloj, tituloDeDia, tituloDia } from './formato.ts'

test('los miles van con punto y los decimales con coma', () => {
  assert.equal(entero(4445), '4.445')
  assert.equal(entero(2418.4), '2.418')
  assert.equal(entero(37), '37')
  assert.equal(entero(1234567), '1.234.567')
  assert.equal(entero(-12), '-12')
  assert.equal(decimal(1.5), '1,5')
  assert.equal(decimal(3), '3')
  assert.equal(decimal(2.96), '3')
  assert.equal(decimal(1234.25, 2), '1.234,25')
})

test('los números grandes se acortan como se dicen', () => {
  assert.equal(compacto(9870), '9.870')
  assert.equal(compacto(18_412), '18,4 mil')
  assert.equal(compacto(120_000), '120 mil')
  assert.equal(compacto(999_990), '1 M')
  assert.equal(compacto(1_240_000), '1,2 M')
})

test('el dólar en colones', () => {
  assert.equal(colones(455.44), '₡455,44')
  assert.equal(colones(503.4), '₡503,40')
  assert.equal(colones(1503.456), '₡1.503,46')
})

test('el reloj y la fecha son los de Costa Rica', () => {
  // 23:42:08 UTC del 30 = 17:42:08 en Costa Rica
  assert.deepEqual(reloj(new Date('2026-10-30T23:42:08Z')), { hora: '17:42', segundos: ':08' })
  // 03:00 UTC del 31 todavía es el 30 en Costa Rica
  assert.equal(fechaCabecera(new Date('2026-10-31T03:00:00Z')), 'Vie 30 oct 2026')
  assert.equal(tituloDia(new Date('2026-10-31T03:00:00Z')), 'Viernes 30')
  assert.equal(fechaCabecera(new Date('2026-10-28T15:00:00Z')), 'Mié 28 oct 2026')
  assert.equal(diaCorto('2026-10-01'), '1 oct')
  assert.equal(diaYHora('2026-10-28T16:00:00Z'), '28 oct · 10:00')
})

test('hace cuánto, corto', () => {
  const ahora = new Date('2026-10-30T23:42:00Z')
  assert.equal(hace('2026-10-30T23:41:40Z', ahora), 'ahora')
  assert.equal(hace('2026-10-30T23:40:00Z', ahora), '2 min')
  assert.equal(hace('2026-10-30T22:30:00Z', ahora), '1 h')
  assert.equal(hace('2026-10-27T20:00:00Z', ahora), '3 d')
  assert.equal(hace('no es fecha', ahora), 'ahora')
})

test('plata, porcentajes y nombres de los días', () => {
  assert.equal(dolares(1500), '$1.500')
  assert.equal(porcentaje(21, 48), '44%')
  assert.equal(porcentaje(3, 0), null)
  assert.equal(tituloDeDia('2026-10-30'), 'Viernes 30')
  assert.equal(nombreDia('2026-10-30', '2026-10-30'), 'Hoy')
  assert.equal(nombreDia('2026-10-31', '2026-10-30'), 'Mañana')
  assert.equal(nombreDia('2026-11-01', '2026-10-30'), 'Dom 1 nov')
})

test('el tiempo del audio', () => {
  assert.equal(minutosYSegundos(41.7), '00:41')
  assert.equal(minutosYSegundos(69), '01:09')
  assert.equal(minutosYSegundos(Number.NaN), '00:00')
})
