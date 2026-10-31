import { test } from 'node:test'
import assert from 'node:assert/strict'
import { correoDeConfirmacion, cuandoEs, eventoDelDiagnostico, idDeEvento } from './cita.ts'

// Datos inventados
const reserva = {
  slot: '2026-11-06-9am',
  firstName: 'Ana',
  lastName: 'Rojas',
  phone: '+50688881234',
  email: 'ana@empresa-ejemplo.com',
  locale: 'es' as const,
  answers: { size: '2 a 5 personas', revenue: '$15,001 – $30,000 USD', challenge: 'Responder clientes a tiempo', industry: 'Educación', timeline: 'En el próximo mes' },
}
const ref = 'BRD-261106-K7F3Q9XZ'
const MEET = 'https://meet.google.com/abc-defg-hij'
const plano = (s: string) => s.replace(/\s/g, ' ')

test('el id del evento es fijo para cada pago y cumple con lo que pide Google', () => {
  const id = idDeEvento(ref)
  assert.match(id, /^[a-v0-9]{5,1024}$/)
  assert.equal(id, idDeEvento(ref))
  assert.notEqual(id, idDeEvento('BRD-261106-K7F3Q9XY'))
  assert.match(idDeEvento('cs_live_a1B2'), /^[a-v0-9]+$/, 'también la referencia de Stripe')
})

test('el evento: 30 minutos en hora de Costa Rica, con Meet y la persona invitada', () => {
  const e = eventoDelDiagnostico(reserva, ref)
  assert.equal(e.summary, 'Diagnóstico Bralto · Ana Rojas')
  assert.deepEqual(e.start, { dateTime: '2026-11-06T09:00:00-06:00', timeZone: 'America/Costa_Rica' })
  assert.deepEqual(e.end, { dateTime: '2026-11-06T09:30:00-06:00', timeZone: 'America/Costa_Rica' })
  assert.deepEqual(e.attendees, [{ email: 'ana@empresa-ejemplo.com', displayName: 'Ana Rojas' }])
  assert.deepEqual(e.conferenceData, { createRequest: { requestId: ref, conferenceSolutionKey: { type: 'hangoutsMeet' } } })
  assert.equal(e.id, idDeEvento(ref))
  assert.deepEqual(e.extendedProperties, { private: { orden: ref, origen: 'sitio' } })
})

test('la descripción que ve la persona es simple: sin sus respuestas ni datos internos', () => {
  const e = eventoDelDiagnostico(reserva, ref)
  for (const valor of [...Object.values(reserva.answers), reserva.phone, ref]) assert.ok(!e.description?.includes(valor), valor)
  assert.match(e.description ?? '', /cs@bralto\.io/)
  assert.match(eventoDelDiagnostico({ ...reserva, locale: 'en' }, ref).summary, /^Bralto diagnostic call · /)
})

test('el correo lleva la fecha, la hora de Costa Rica y el enlace de Meet', () => {
  const c = correoDeConfirmacion({ idioma: 'es', nombre: 'Ana', inicio: Date.parse('2026-11-06T09:00:00-06:00'), meet: MEET })
  assert.equal(c.asunto, 'Diagnóstico confirmado | Bralto')
  assert.ok(c.html.includes(`href="${MEET}"`))
  assert.ok(c.texto.includes(MEET))
  assert.match(plano(c.texto), /viernes, 6 de noviembre de 2026, 9:00 a\. m\. \(hora de Costa Rica\)/)
  assert.match(c.html, /Ana, su diagnóstico está agendado\./)
})

test('el correo en inglés', () => {
  const c = correoDeConfirmacion({ idioma: 'en', nombre: 'Ana', inicio: Date.parse('2026-11-06T09:00:00-06:00'), meet: MEET })
  assert.equal(c.asunto, 'Diagnostic call confirmed | Bralto')
  assert.match(plano(c.texto), /Friday, November 6, 2026 at 9:00 AM \(Costa Rica time\)/)
  assert.ok(c.html.includes(MEET))
})

test('el correo nunca dice que no es reembolsable', () => {
  for (const idioma of ['es', 'en'] as const) {
    const c = correoDeConfirmacion({ idioma, nombre: 'Ana', inicio: Date.parse('2026-11-06T09:00:00-06:00'), meet: MEET })
    assert.doesNotMatch(c.html + c.texto, /reembols|refund/i)
  }
})

test('un nombre con HTML no se cuela en el correo', () => {
  const c = correoDeConfirmacion({ idioma: 'es', nombre: '<b>Ana</b>', inicio: Date.parse('2026-11-06T09:00:00-06:00'), meet: MEET })
  assert.ok(!c.html.includes('<b>Ana</b>'))
  assert.ok(c.html.includes('&lt;b&gt;Ana&lt;/b&gt;'))
})

test('la fecha se escribe en hora de Costa Rica aunque el servidor esté en otra zona', () => {
  const original = process.env.TZ
  try {
    process.env.TZ = 'Asia/Tokyo'
    assert.match(plano(cuandoEs(Date.parse('2026-11-06T17:00:00-06:00'), 'es')), /viernes, 6 de noviembre de 2026, 5:00 p\. m\./)
  } finally {
    if (original === undefined) delete process.env.TZ
    else process.env.TZ = original
  }
})
