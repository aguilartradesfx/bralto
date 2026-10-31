import { test } from 'node:test'
import assert from 'node:assert/strict'
import { CONSULTA_GMAIL, remitente, resumirCorreos } from './correos.ts'

test('el remitente es el nombre, sin el correo ni las comillas', () => {
  assert.equal(remitente('Ana Prueba <ana@ejemplo.test>'), 'Ana Prueba')
  assert.equal(remitente('"Meta for Business" <aviso@ejemplo.test>'), 'Meta for Business')
  assert.equal(remitente('solo@ejemplo.test'), 'solo@ejemplo.test')
  assert.equal(remitente(''), 'Alguien')
})

test('la consulta trae lo sin leer de un día y deja fuera promociones, redes y foros', () => {
  assert.match(CONSULTA_GMAIL, /is:unread/)
  assert.match(CONSULTA_GMAIL, /newer_than:1d/)
  for (const c of ['promotions', 'social', 'forums']) assert.match(CONSULTA_GMAIL, new RegExp(`-category:${c}`))
})

test('junta las dos cuentas, los más nuevos primero, con textos cortos y un tope', () => {
  const r = resumirCorreos([
    {
      cuenta: 'personal@ejemplo.test',
      total: 30,
      mensajes: [
        { de: 'Ana Prueba <ana@ejemplo.test>', asunto: 'Propuesta', resumen: 'x'.repeat(400), en: '2026-10-30T15:00:00.000Z' },
        { de: 'Banco <b@ejemplo.test>', asunto: 'Pago recibido', resumen: 'Recibimos su pago', en: '2026-10-30T18:00:00.000Z' },
      ],
    },
    {
      cuenta: 'empresa@ejemplo.test',
      total: 1,
      mensajes: [{ de: 'Cliente Prueba <c@ejemplo.test>', asunto: 'Reunión', resumen: '¿Nos vemos el lunes?', en: '2026-10-30T16:00:00.000Z' }],
    },
  ])
  assert.deepEqual(r.cuentas, ['personal@ejemplo.test', 'empresa@ejemplo.test'])
  assert.equal(r.sinLeer, 31)
  assert.deepEqual(
    r.recientes.map((c) => c.asunto),
    ['Pago recibido', 'Reunión', 'Propuesta'],
  )
  assert.equal(r.recientes[1].cuenta, 'empresa@ejemplo.test')
  assert.equal(r.recientes[1].de, 'Cliente Prueba')
  assert.equal(r.recientes[2].resumen.length, 160)
  const muchos = resumirCorreos([
    { cuenta: 'a@ejemplo.test', total: 40, mensajes: Array.from({ length: 40 }, (_, i) => ({ de: 'X', asunto: `${i}`, resumen: '', en: new Date(Date.UTC(2026, 9, 30, 0, i)).toISOString() })) },
  ])
  assert.equal(muchos.recientes.length, 25)
})
