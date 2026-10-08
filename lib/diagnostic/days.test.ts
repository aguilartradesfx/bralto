import { test } from 'node:test'
import assert from 'node:assert/strict'
import { bookableDays, costaRicaToday, localDate, slotKey } from './days.ts'

// La página se arma en el servidor (UTC) y se usa desde cualquier zona: todo tiene que dar
// lo mismo en cada una. Node aplica el cambio de process.env.TZ en caliente.
const ZONES = ['America/Costa_Rica', 'UTC', 'Europe/Madrid', 'Asia/Tokyo', 'America/Los_Angeles']

function inEveryZone(check: (zone: string) => void) {
  const original = process.env.TZ
  try {
    for (const zone of ZONES) {
      process.env.TZ = zone
      check(zone)
    }
  } finally {
    if (original === undefined) delete process.env.TZ
    else process.env.TZ = original
  }
}

const at = (iso: string) => Date.parse(iso)

test('a las 9 p. m. de Costa Rica (en UTC ya es mañana), los días cuentan desde mañana en Costa Rica', () => {
  inEveryZone((zone) => {
    assert.deepEqual(
      bookableDays(at('2026-10-07T21:02:00-06:00')),
      ['2026-10-08', '2026-10-09', '2026-10-12', '2026-10-13', '2026-10-14'],
      zone,
    )
  })
})

test('cinco días hábiles desde mañana, sin fines de semana', () => {
  inEveryZone((zone) => {
    assert.deepEqual(
      bookableDays(at('2026-10-07T09:00:00-06:00')),
      ['2026-10-08', '2026-10-09', '2026-10-12', '2026-10-13', '2026-10-14'],
      zone,
    )
    // Un viernes en la noche: de lunes a viernes de la semana siguiente
    assert.deepEqual(
      bookableDays(at('2026-10-09T23:30:00-06:00')),
      ['2026-10-12', '2026-10-13', '2026-10-14', '2026-10-15', '2026-10-16'],
      zone,
    )
  })
})

test('hoy en Costa Rica no depende de la zona de quien ejecuta', () => {
  inEveryZone((zone) => {
    assert.equal(costaRicaToday(at('2026-10-07T21:02:00-06:00')), '2026-10-07', zone)
    assert.equal(costaRicaToday(at('2026-10-08T00:05:00-06:00')), '2026-10-08', zone)
  })
})

test('la clave del horario es el día que se ve en el calendario, en cualquier zona', () => {
  inEveryZone((zone) => {
    const day = localDate('2026-10-09')
    assert.deepEqual([day.getFullYear(), day.getMonth(), day.getDate()], [2026, 9, 9], zone)
    assert.equal(slotKey(day, '9am'), '2026-10-09-9am', zone)
    // Cada celda del calendario es la medianoche local de su día
    assert.equal(slotKey(new Date(2026, 9, 9), '1pm'), '2026-10-09-1pm', zone)
  })
})
