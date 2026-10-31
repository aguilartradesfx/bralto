import { test } from 'node:test'
import assert from 'node:assert/strict'
import { choca, horaCr, horariosLibres, horariosPosibles, inicioYFin, rangoDe, type Ocupado } from './reglas.ts'

const cr = (s: string) => Date.parse(`${s}-06:00`)
const rato = (desde: string, hasta: string): Ocupado => ({ inicio: cr(desde), fin: cr(hasta) })

// El servidor corre en UTC y la página se hidrata en cualquier zona: todo tiene que dar lo mismo
function enCadaZona(revisar: (zona: string) => void) {
  const original = process.env.TZ
  try {
    for (const zona of ['America/Costa_Rica', 'UTC', 'Europe/Madrid', 'Asia/Tokyo', 'America/Los_Angeles']) {
      process.env.TZ = zona
      revisar(zona)
    }
  } finally {
    if (original === undefined) delete process.env.TZ
    else process.env.TZ = original
  }
}

test('ofrece las cuatro horas fijas en los cinco días hábiles desde mañana', () => {
  const posibles = horariosPosibles(cr('2026-11-04T10:00:00')) // miércoles
  assert.equal(posibles.length, 20)
  assert.deepEqual(posibles.slice(0, 4), ['2026-11-05-9am', '2026-11-05-1pm', '2026-11-05-3pm', '2026-11-05-5pm'])
  assert.equal(posibles.at(-1), '2026-11-11-5pm')
  assert.ok(!posibles.some((s) => s.startsWith('2026-11-07') || s.startsWith('2026-11-08')), 'sin fin de semana')
})

test('un viernes en la noche ofrece de lunes a viernes de la semana siguiente', () => {
  const posibles = horariosPosibles(cr('2026-10-30T19:56:00'))
  assert.equal(posibles[0], '2026-11-02-9am')
  assert.equal(posibles.at(-1), '2026-11-06-5pm')
})

test('12 horas de anticipación: después de las 9 p. m. ya no se ofrece la de las 9 de mañana', () => {
  assert.equal(horariosPosibles(cr('2026-11-04T21:00:00'))[0], '2026-11-05-9am')
  assert.equal(horariosPosibles(cr('2026-11-04T21:01:00'))[0], '2026-11-05-1pm')
})

test('da lo mismo en cualquier zona', () => {
  const esperado = horariosPosibles(cr('2026-11-04T23:30:00'))
  enCadaZona((zona) => assert.deepEqual(horariosPosibles(cr('2026-11-04T23:30:00')), esperado, zona))
})

test('un evento choca con la llamada y con los 10 minutos de antes', () => {
  const slot = '2026-11-06-9am'
  assert.equal(choca(slot, [rato('2026-11-06T08:30:00', '2026-11-06T09:30:00')]), true)
  assert.equal(choca(slot, [rato('2026-11-06T08:00:00', '2026-11-06T08:51:00')]), true, 'termina dentro del margen')
  assert.equal(choca(slot, [rato('2026-11-06T09:29:00', '2026-11-06T09:31:00')]), true)
  assert.equal(choca(slot, [rato('2026-11-05T00:00:00', '2026-11-07T00:00:00')]), true, 'un día entero ocupado')
})

test('lo que termina antes del margen o empieza al terminar la llamada no choca', () => {
  const slot = '2026-11-06-9am'
  assert.equal(choca(slot, [rato('2026-11-06T08:00:00', '2026-11-06T08:50:00')]), false)
  assert.equal(choca(slot, [rato('2026-11-06T09:30:00', '2026-11-06T10:30:00')]), false)
  assert.equal(choca(slot, []), false)
})

test('los horarios libres quitan lo ocupado de todos los calendarios', () => {
  const ahora = cr('2026-10-30T19:56:00')
  const libres = horariosLibres(ahora, [
    rato('2026-11-06T08:30:00', '2026-11-06T09:30:00'), // de la cuenta de la empresa
    rato('2026-11-02T12:00:00', '2026-11-02T13:15:00'), // de la personal
  ])
  assert.equal(libres.length, 18)
  assert.ok(!libres.includes('2026-11-06-9am'))
  assert.ok(!libres.includes('2026-11-02-1pm'))
  assert.ok(libres.includes('2026-11-02-9am'))
})

test('el rango para preguntar va del margen del primero al final del último', () => {
  const rango = rangoDe(['2026-11-02-9am', '2026-11-06-5pm'])
  assert.deepEqual(rango, { inicio: cr('2026-11-02T08:50:00'), fin: cr('2026-11-06T17:30:00') })
  assert.equal(rangoDe([]), null)
})

test('la llamada dura 30 minutos', () => {
  assert.deepEqual(inicioYFin('2026-11-06-3pm'), { inicio: cr('2026-11-06T15:00:00'), fin: cr('2026-11-06T15:30:00') })
})

test('la hora de Costa Rica se escribe con su desfase, en cualquier zona', () => {
  enCadaZona((zona) => {
    assert.equal(horaCr(cr('2026-11-06T09:00:00')), '2026-11-06T09:00:00-06:00', zona)
    assert.equal(horaCr(cr('2026-11-06T23:30:00')), '2026-11-06T23:30:00-06:00', zona)
  })
})
