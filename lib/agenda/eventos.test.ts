import { test } from 'node:test'
import assert from 'node:assert/strict'
import { citasDeEventos } from './eventos.ts'
import type { EventoGoogle } from './google.ts'

// Eventos inventados
const ev = (id: string, hora: string, extra: Partial<EventoGoogle> = {}): EventoGoogle => ({
  id,
  status: 'confirmed',
  eventType: 'default',
  summary: `Evento ${id}`,
  start: { dateTime: hora },
  ...extra,
})

test('junta los dos calendarios en orden y con la hora en UTC', () => {
  const empresa = [ev('b', '2026-11-03T15:00:00-06:00')]
  const personal = [ev('a', '2026-11-03T09:00:00-06:00')]
  assert.deepEqual(citasDeEventos([empresa, personal]), [
    { titulo: 'Evento a', inicio: '2026-11-03T15:00:00.000Z' },
    { titulo: 'Evento b', inicio: '2026-11-03T21:00:00.000Z' },
  ])
})

test('la misma cita invitada a las dos cuentas cuenta una vez', () => {
  const comun = { iCalUID: 'uid-1@google.com' }
  const citas = citasDeEventos([[ev('x1', '2026-11-03T10:00:00-06:00', comun)], [ev('x2', '2026-11-03T10:00:00-06:00', comun)]])
  assert.equal(citas.length, 1)
})

test('una serie que se repite cuenta cada día', () => {
  const serie = { iCalUID: 'serie@google.com' }
  const citas = citasDeEventos([[ev('s1', '2026-11-03T10:00:00-06:00', serie), ev('s2', '2026-11-04T10:00:00-06:00', serie)]])
  assert.equal(citas.length, 2)
})

test('deja fuera lo de todo el día, lo cancelado, lo rechazado y los bloques automáticos', () => {
  const citas = citasDeEventos([
    [
      { id: 'dia', status: 'confirmed', summary: 'Feriado', start: { date: '2026-11-03' } },
      ev('cancelada', '2026-11-03T10:00:00-06:00', { status: 'cancelled' }),
      ev('rechazada', '2026-11-03T11:00:00-06:00', { attendees: [{ email: 'persona.prueba@ejemplo.com', self: true, responseStatus: 'declined' }] }),
      ev('oficina', '2026-11-03T12:00:00-06:00', { eventType: 'outOfOffice' }),
      ev('foco', '2026-11-03T13:00:00-06:00', { eventType: 'focusTime' }),
      ev('lugar', '2026-11-03T14:00:00-06:00', { eventType: 'workingLocation' }),
      ev('vuelo', '2026-11-03T16:00:00-06:00', { eventType: 'fromGmail' }),
      ev('sin-tipo', '2026-11-03T17:00:00-06:00', { eventType: undefined }),
    ],
  ])
  assert.deepEqual(
    citas.map((c) => c.titulo),
    ['Evento vuelo', 'Evento sin-tipo'],
  )
})

test('sin título dice «Cita»', () => {
  assert.equal(citasDeEventos([[ev('x', '2026-11-03T10:00:00-06:00', { summary: '  ' })]])[0].titulo, 'Cita')
})
