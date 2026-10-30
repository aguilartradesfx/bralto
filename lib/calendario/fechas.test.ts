import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  agruparPorDia,
  aLocalCR,
  diaCR,
  horaCR,
  hoyCR,
  leerMes,
  localCRaUtc,
  mesDe,
  moverMes,
  nombreDia,
  nombreMes,
  rangoUtc,
  semanasDelMes,
  sumarDias,
} from './fechas.ts'

test('el día y la hora de Costa Rica: el día cambia a las 6:00 UTC', () => {
  assert.equal(hoyCR(new Date('2026-10-31T05:59:00Z')), '2026-10-30')
  assert.equal(hoyCR(new Date('2026-10-31T06:00:00Z')), '2026-10-31')
  // Como lo devuelve Postgres, también con microsegundos
  assert.equal(diaCR('2026-10-31T00:00:00+00:00'), '2026-10-30')
  assert.equal(horaCR('2026-10-31T00:00:00+00:00'), '18:00')
  assert.equal(horaCR('2026-10-30T16:00:00.123456+00:00'), '10:00')
  assert.equal(mesDe('2026-10-30'), '2026-10')
})

test('de UTC a la hora local de Costa Rica (el valor del campo de fecha y hora) y de vuelta', () => {
  assert.equal(aLocalCR('2026-10-31T00:00:00+00:00'), '2026-10-30T18:00')
  assert.equal(localCRaUtc('2026-10-30T18:00'), '2026-10-31T00:00:00.000Z')
  assert.equal(localCRaUtc('2026-10-30T23:30'), '2026-10-31T05:30:00.000Z')
  assert.equal(localCRaUtc('2027-01-01T00:15'), '2027-01-01T06:15:00.000Z')
  for (const iso of ['2026-10-30T16:00:00.000Z', '2026-11-01T05:59:00.000Z', '2026-12-31T23:00:00.000Z']) {
    assert.equal(localCRaUtc(aLocalCR(iso)), iso)
  }
})

test('localCRaUtc rechaza lo que no es una fecha con hora', () => {
  for (const malo of ['', '2026-10-30', '2026-10-30 18:00', '2026-02-30T10:00', '2026-10-30T24:00', '2026-10-30T18:60', 'mañana', null, 42]) {
    assert.equal(localCRaUtc(malo), null, String(malo))
  }
  // Con segundos también sirve: algunos navegadores los mandan
  assert.equal(localCRaUtc('2026-10-30T18:00:00'), '2026-10-31T00:00:00.000Z')
})

test('semanasDelMes: de lunes a domingo, con días del mes de al lado para completar', () => {
  // El 1 de octubre de 2026 es jueves y el 31, sábado
  const oct = semanasDelMes('2026-10')
  assert.equal(oct.length, 5)
  assert.deepEqual(oct[0], ['2026-09-28', '2026-09-29', '2026-09-30', '2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04'])
  assert.deepEqual(oct[4], ['2026-10-26', '2026-10-27', '2026-10-28', '2026-10-29', '2026-10-30', '2026-10-31', '2026-11-01'])
  // Febrero de 2027 empieza en lunes y termina en domingo: 4 semanas justas
  const feb = semanasDelMes('2027-02')
  assert.equal(feb.length, 4)
  assert.equal(feb[0][0], '2027-02-01')
  assert.equal(feb[3][6], '2027-02-28')
  // Agosto de 2026 empieza en sábado: 6 semanas
  const ago = semanasDelMes('2026-08')
  assert.equal(ago.length, 6)
  assert.equal(ago[0][0], '2026-07-27')
  assert.equal(ago[5][6], '2026-09-06')
  for (const semana of [...oct, ...feb, ...ago]) {
    assert.equal(semana.length, 7)
    for (let i = 1; i < 7; i++) assert.equal(semana[i], sumarDias(semana[i - 1], 1))
  }
})

test('leerMes: el mes de la URL o, si no sirve, el de hoy en Costa Rica', () => {
  const ahora = new Date('2026-11-01T03:00:00Z') // sábado 31 de octubre, 9 p. m. en Costa Rica
  assert.equal(leerMes(undefined, ahora), '2026-10')
  assert.equal(leerMes('2026-11', ahora), '2026-11')
  assert.equal(leerMes('2027-01', ahora), '2027-01')
  for (const malo of ['2026-13', '2026-00', '2026-1', '26-11', '0000-01', 'noviembre', '', ['2026-11'], '2026-11-01']) {
    assert.equal(leerMes(malo, ahora), '2026-10', String(malo))
  }
})

test('moverMes cruza el año', () => {
  assert.equal(moverMes('2026-10', 1), '2026-11')
  assert.equal(moverMes('2026-10', -1), '2026-09')
  assert.equal(moverMes('2026-12', 1), '2027-01')
  assert.equal(moverMes('2026-01', -1), '2025-12')
})

test('rangoUtc: de las 00:00 del primer día a las 00:00 del día después del último, en Costa Rica', () => {
  assert.deepEqual(rangoUtc('2026-09-28', '2026-11-01'), { desde: '2026-09-28T06:00:00.000Z', hasta: '2026-11-02T06:00:00.000Z' })
  assert.deepEqual(rangoUtc('2026-10-31', '2026-10-31'), { desde: '2026-10-31T06:00:00.000Z', hasta: '2026-11-01T06:00:00.000Z' })
})

test('agruparPorDia: cada publicación va en su día de Costa Rica, en orden de hora', () => {
  const p = (id: string, publicar_en: string) => ({ id, publicar_en })
  const dias = agruparPorDia([
    p('noche', '2026-10-31T05:30:00+00:00'), // viernes 30, 23:30 en Costa Rica (ya es 31 en UTC)
    p('temprano', '2026-10-30T16:00:00+00:00'), // viernes 30, 10:00
    p('medianoche', '2026-10-31T06:00:00+00:00'), // sábado 31, 00:00
    p('tarde', '2026-10-31T00:00:00+00:00'), // viernes 30, 18:00
  ])
  assert.deepEqual([...dias.keys()], ['2026-10-30', '2026-10-31'])
  assert.deepEqual(dias.get('2026-10-30')?.map((x) => x.id), ['temprano', 'tarde', 'noche'])
  assert.deepEqual(dias.get('2026-10-31')?.map((x) => x.id), ['medianoche'])
  assert.equal(agruparPorDia([]).size, 0)
})

test('nombres en español del mes y del día', () => {
  assert.equal(nombreMes('2026-10'), 'Octubre 2026')
  assert.equal(nombreMes('2027-01'), 'Enero 2027')
  assert.equal(nombreDia('2026-10-30'), 'Viernes 30 de octubre')
  assert.equal(nombreDia('2026-11-01'), 'Domingo 1 de noviembre')
})
