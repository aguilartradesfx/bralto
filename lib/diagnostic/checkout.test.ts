import { test } from 'node:test'
import assert from 'node:assert/strict'
import { bookingFromMetadata, buildDiagnosticCheckout, parseDiagnosticRequest } from './diagnostic.ts'

const validBody = {
  slot: '2026-10-08-3pm',
  sessionId: 'b8f6c2d4-1111-4a2b-9c3d-123456789abc',
  nombre: '  Ana ',
  apellido: 'Rojas',
  countryCode: '+506',
  telefono: '8888-1234',
  email: 'ana@empresa.com',
  answers: {
    size: '6 a 20 personas',
    revenue: '$15,001 – $30,000 USD',
    challenge: 'Organizar procesos internos',
    industry: 'Servicios profesionales',
    timeline: 'En el próximo mes',
  },
  locale: 'es',
}

test('solicitud válida: normaliza nombre y teléfono', () => {
  const r = parseDiagnosticRequest(validBody)
  assert.equal(r.ok, true)
  if (!r.ok) return
  assert.equal(r.data.firstName, 'Ana')
  assert.equal(r.data.phone, '+50688881234')
  assert.equal(r.data.locale, 'es')
})

test('rechaza correo inválido, horario fuera de los curados y respuestas faltantes', () => {
  const cases: Array<[string, Record<string, unknown>]> = [
    ['correo', { ...validBody, email: 'ana@' }],
    ['horario mal formado', { ...validBody, slot: '2026-10-08-4pm' }],
    ['horario inventado', { ...validBody, slot: 'mañana' }],
    ['sin sesión', { ...validBody, sessionId: '' }],
    ['respuesta faltante', { ...validBody, answers: { ...validBody.answers, timeline: '' } }],
    ['nombre vacío', { ...validBody, nombre: '   ' }],
  ]
  for (const [name, body] of cases) {
    assert.equal(parseDiagnosticRequest(body).ok, false, name)
  }
  assert.equal(parseDiagnosticRequest(null).ok, false, 'cuerpo nulo')
})

test('la sesión de Stripe cobra $97 USD una sola vez y vuelve al sitio en el idioma del visitante', () => {
  const r = parseDiagnosticRequest({ ...validBody, locale: 'en' })
  assert.equal(r.ok, true)
  if (!r.ok) return
  const p = buildDiagnosticCheckout(r.data, { origin: 'https://bralto.io', nowSeconds: 1_000_000 })
  assert.equal(p.mode, 'payment')
  assert.equal(p['line_items[0][price_data][currency]'], 'usd')
  assert.equal(p['line_items[0][price_data][unit_amount]'], 9700)
  assert.equal(p['line_items[0][quantity]'], 1)
  assert.equal(p.success_url, 'https://bralto.io/en/confirmacion?session_id={CHECKOUT_SESSION_ID}')
  assert.equal(p.cancel_url, 'https://bralto.io/en/agendar?pago=cancelado')
  assert.equal(p.locale, 'en')
  assert.equal(p.customer_email, 'ana@empresa.com')
  // El horario queda retenido lo mismo que dura la sesión de pago (Stripe exige 30 min o más)
  assert.equal(p.expires_at, 1_000_000 + 31 * 60)
  assert.ok(String(p['custom_text[submit][message]']).length > 20, 'los términos se muestran al pagar')
})

test('los datos del horario viajan en los metadatos y se recuperan intactos', () => {
  const r = parseDiagnosticRequest(validBody)
  assert.equal(r.ok, true)
  if (!r.ok) return
  const p = buildDiagnosticCheckout(r.data, { origin: 'https://bralto.io', nowSeconds: 0 })
  const metadata: Record<string, string> = {}
  for (const [k, v] of Object.entries(p)) {
    const m = k.match(/^metadata\[(.+)\]$/)
    if (m) metadata[m[1]] = String(v)
  }
  // Stripe corta los valores de metadatos en 500 caracteres
  for (const [k, v] of Object.entries(metadata)) assert.ok(v.length <= 500, k)
  assert.equal(metadata.product_kind, 'diagnostic')
  assert.deepEqual(bookingFromMetadata(metadata), {
    slot: '2026-10-08-3pm',
    firstName: 'Ana',
    lastName: 'Rojas',
    phone: '+50688881234',
    email: 'ana@empresa.com',
    locale: 'es',
    answers: validBody.answers,
  })
})

test('metadatos de otro producto o incompletos no son un diagnóstico', () => {
  assert.equal(bookingFromMetadata({ product_kind: 'bralto_essentials', slot: '2026-10-08-3pm' }), null)
  assert.equal(bookingFromMetadata({ product_kind: 'diagnostic' }), null)
  assert.equal(bookingFromMetadata(null), null)
})
