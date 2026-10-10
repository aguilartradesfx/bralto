import { test } from 'node:test'
import assert from 'node:assert/strict'
import { formatSlotDay, formatSlotTime, localSlotTime, slotStart, TIME_SLOT_IDS } from './slots.ts'

// Quien agenda puede estar en cualquier zona y la página se arma en el servidor (UTC):
// todo tiene que dar lo mismo en cada una. Node aplica el cambio de process.env.TZ en caliente.
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

// ICU y los navegadores separan "9:00" de "a. m." con espacios de distinto tipo
const plain = (s: string | null) => (s === null ? null : s.replace(/\s/g, ' '))

test('los horarios del sitio son los cuatro que GHL tiene curados', () => {
  assert.deepEqual([...TIME_SLOT_IDS], ['9am', '1pm', '3pm', '5pm'])
})

test('cada horario empieza a su hora de Costa Rica (UTC-6), en cualquier zona', () => {
  inEveryZone((zone) => {
    assert.equal(slotStart('2026-10-08-9am'), Date.parse('2026-10-08T09:00:00-06:00'), zone)
    assert.equal(slotStart('2026-10-08-1pm'), Date.parse('2026-10-08T13:00:00-06:00'), zone)
    assert.equal(slotStart('2026-10-09-5pm'), Date.parse('2026-10-09T17:00:00-06:00'), zone)
  })
})

test('una clave de horario mal formada falla en vez de inventar una hora', () => {
  assert.throws(() => slotStart('2026-10-08-9'))
})

test('la hora se muestra en la de Costa Rica, en el idioma de la página', () => {
  inEveryZone((zone) => {
    const start = slotStart('2026-10-08-9am')
    assert.equal(plain(formatSlotTime(start, 'es')), '9:00 a. m.', zone)
    assert.equal(plain(formatSlotTime(start, 'en')), '9:00 AM', zone)
  })
})

test('si quien agenda está en otra zona, da también su hora local', () => {
  const start = slotStart('2026-10-08-9am')
  assert.equal(plain(localSlotTime(start, 'es', 'Europe/Madrid')), '5:00 p. m.')
  assert.equal(plain(localSlotTime(start, 'en', 'America/New_York')), '11:00 AM')
})

test('si su zona tiene la misma hora que Costa Rica (o no se sabe), no la repite', () => {
  const start = slotStart('2026-10-08-9am')
  assert.equal(localSlotTime(start, 'es', 'America/Costa_Rica'), null)
  assert.equal(localSlotTime(start, 'es', 'America/Mexico_City'), null)
  assert.equal(localSlotTime(start, 'es', undefined), null)
  assert.equal(localSlotTime(start, 'es', 'Marte/Olimpo'), null)
})

test('el día elegido se escribe completo, como lo marca el calendario', () => {
  inEveryZone((zone) => {
    const day = new Date(2026, 9, 8) // medianoche local, como las celdas (localDate)
    assert.equal(plain(formatSlotDay(day, 'es')), 'jueves, 8 de octubre', zone)
    assert.equal(plain(formatSlotDay(day, 'en')), 'Thursday, October 8', zone)
  })
})
