import { test } from 'node:test'
import assert from 'node:assert/strict'
import { HORAS_TERTULIA, ORDEN_TURNOS, TURNOS, esTurno, finDeTurno, tramoDeTurno, turnoDe } from './turnos.ts'

// Lunes 16/11/2026 en Costa Rica (UTC−6): «h:m» de Costa Rica → la fecha en UTC
const cr = (h: number, m = 0) => new Date(Date.UTC(2026, 10, 16, h + 6, m))

test('turnoDe: la mañana hasta las 12:29, el mediodía de 12:30 a 3:59 p. m. y la tarde desde las 4:00 p. m.', () => {
  assert.equal(turnoDe(cr(7)), 'manana')
  assert.equal(turnoDe(cr(8, 30)), 'manana') // cuando corre la de la mañana
  assert.equal(turnoDe(cr(8, 38)), 'manana') // y ocho minutos después, si Claude tardó
  assert.equal(turnoDe(cr(12, 29)), 'manana')
  assert.equal(turnoDe(cr(12, 30)), 'mediodia')
  assert.equal(turnoDe(cr(15, 59)), 'mediodia')
  assert.equal(turnoDe(cr(16)), 'tarde')
  assert.equal(turnoDe(cr(18, 59)), 'tarde')
})

test('turnoDe fuera de hora (para probar a mano): el turno más cercano', () => {
  assert.equal(turnoDe(cr(6)), 'manana')
  assert.equal(turnoDe(cr(0, 30)), 'manana')
  assert.equal(turnoDe(cr(19, 30)), 'tarde')
  assert.equal(turnoDe(cr(23, 59)), 'tarde')
})

test('finDeTurno: sus líneas salen hasta las 12:30, las 4:00 p. m. y las 6:30 p. m. del mismo día de Costa Rica', () => {
  assert.equal(finDeTurno(cr(8, 30), 'manana').toISOString(), '2026-11-16T18:30:00.000Z')
  assert.equal(finDeTurno(cr(12, 30), 'mediodia').toISOString(), '2026-11-16T22:00:00.000Z')
  assert.equal(finDeTurno(cr(16), 'tarde').toISOString(), '2026-11-17T00:30:00.000Z')
  // a las 11:30 p. m. de Costa Rica todavía es el 16 (en UTC ya es el 17)
  assert.equal(finDeTurno(cr(23, 30), 'tarde').toISOString(), '2026-11-17T00:30:00.000Z')
})

test('cada turno corre cuando termina el anterior, y en su propio turno', () => {
  for (let i = 0; i < ORDEN_TURNOS.length; i++) {
    const t = ORDEN_TURNOS[i]
    const [h, m] = TURNOS[t].corre
    assert.equal(turnoDe(cr(h, m)), t, t)
    if (i > 0) assert.deepEqual(TURNOS[ORDEN_TURNOS[i - 1]].hasta, TURNOS[t].corre, t)
  }
  assert.match(HORAS_TERTULIA, /8:30 a\. m\..*12:30 p\. m\..*4:00 p\. m\./)
})

test('esTurno y cómo se dice cada uno', () => {
  for (const t of ['manana', 'mediodia', 'tarde']) assert.ok(esTurno(t), t)
  for (const t of ['mañana', 'noche', '', null, 3]) assert.equal(esTurno(t), false, String(t))
  assert.deepEqual(ORDEN_TURNOS.map((t) => TURNOS[t].de), ['de la mañana', 'del mediodía', 'de la tarde'])
})

test('tramoDeTurno: la parte del día de cada turno, la misma de turnoDe (hasta no entra)', () => {
  const tramo = (t: Parameters<typeof tramoDeTurno>[1]) => {
    const { desde, hasta } = tramoDeTurno(cr(10), t)
    return [desde.toISOString(), hasta.toISOString()]
  }
  assert.deepEqual(tramo('manana'), ['2026-11-16T06:00:00.000Z', '2026-11-16T18:30:00.000Z'])
  assert.deepEqual(tramo('mediodia'), ['2026-11-16T18:30:00.000Z', '2026-11-16T22:00:00.000Z'])
  assert.deepEqual(tramo('tarde'), ['2026-11-16T22:00:00.000Z', '2026-11-17T06:00:00.000Z'])
  for (const t of ORDEN_TURNOS) {
    const { desde, hasta } = tramoDeTurno(cr(10), t)
    assert.equal(turnoDe(desde), t, t)
    assert.equal(turnoDe(new Date(hasta.getTime() - 60_000)), t, t)
  }
})
