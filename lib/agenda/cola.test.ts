import { test } from 'node:test'
import assert from 'node:assert/strict'
import { AVISAR_CADA_MS, nuevaPendiente, queHacer, trasElAviso, trasFallar, yaHabiaFallado } from './cola.ts'

// Datos inventados
const reserva = {
  slot: '2026-11-06-9am',
  firstName: 'Ana',
  lastName: 'Rojas',
  phone: '+50688881234',
  email: 'ana@empresa-ejemplo.com',
  locale: 'es' as const,
  answers: { size: 'a', revenue: 'b', challenge: 'c', industry: 'd', timeline: 'e' },
}
const ref = 'BRD-261102-K7F3Q9XZ'
const pagoEn = Date.parse('2026-11-02T10:00:00-06:00')

test('recién pagada entra a la cola sin intentos fallidos', () => {
  const p = nuevaPendiente(ref, reserva, pagoEn)
  assert.deepEqual(p, { ref, booking: reserva, creadoEn: pagoEn, intentos: 0 })
  assert.equal(yaHabiaFallado(p), false)
})

test('si Google falla en el pago, cuenta el intento, guarda el error y anota el aviso', () => {
  const p = trasElAviso(nuevaPendiente(ref, reserva, pagoEn), ref, reserva, pagoEn + 5_000, 'invalid_grant')
  assert.equal(p.creadoEn, pagoEn, 'conserva cuándo entró')
  assert.equal(p.intentos, 1)
  assert.equal(p.avisadoEn, pagoEn + 5_000)
  assert.equal(p.error, 'invalid_grant')
  assert.equal(yaHabiaFallado(p), true)
  assert.equal(trasElAviso(null, ref, reserva, pagoEn, 'x').creadoEn, pagoEn, 'sin la entrada previa (Redis falló)')
})

test('se reintenta hasta que empieza la llamada; después ya no', () => {
  const p = nuevaPendiente(ref, reserva, pagoEn)
  assert.equal(queHacer(p, Date.parse('2026-11-06T08:59:00-06:00')), 'reintentar')
  assert.equal(queHacer(p, Date.parse('2026-11-06T09:00:00-06:00')), 'vencida')
})

test('un reintento que falla avisa la primera vez y después cada 2 horas', () => {
  // Se cortó a la mitad (nunca se avisó): el primer fallo del barrido avisa
  const cortada = trasFallar(nuevaPendiente(ref, reserva, pagoEn), pagoEn + 10 * 60_000, 'timeout')
  assert.equal(cortada.aviso, 'primero')
  assert.equal(cortada.pendiente.intentos, 1)

  const avisada = trasElAviso(null, ref, reserva, pagoEn, 'invalid_grant')
  const pronto = trasFallar(avisada, pagoEn + 10 * 60_000, 'invalid_grant')
  assert.equal(pronto.aviso, null)
  assert.equal(pronto.pendiente.avisadoEn, pagoEn, 'no se mueve si no se avisó')
  assert.equal(pronto.pendiente.intentos, 2)

  const tarde = trasFallar(pronto.pendiente, pagoEn + AVISAR_CADA_MS, 'invalid_grant')
  assert.equal(tarde.aviso, 'recordatorio')
  assert.equal(tarde.pendiente.avisadoEn, pagoEn + AVISAR_CADA_MS)
})
