import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildInitParams, orderFromWebhook, parseConsult, parseTokenExpiry } from './tilopay.ts'
import type { PaymentOrder } from './types.ts'

const order: PaymentOrder = {
  orderNumber: 'BRD-261007-K7F3Q9XZ',
  money: { amount: 97, currency: 'USD' },
  description: 'Diagnóstico Bralto · 30 minutos',
  customer: { firstName: 'Ana', lastName: 'Rojas', email: 'ana@empresa.com', phone: '+50688881234' },
  locale: 'es',
  returnUrl: 'https://www.bralto.io/es/confirmacion/BRD-261007-K7F3Q9XZ',
}

// ── Init del SDK ────────────────────────────────────────────────────────────────

test('Init: el monto va en unidades enteras de la moneda, no en céntimos', () => {
  const p = buildInitParams(order, { token: 'tok' })
  assert.equal(p.amount, 97)
  assert.equal(p.currency, 'USD')
})

test('Init: lleva los campos obligatorios con los valores que cobran y no guardan la tarjeta', () => {
  const p = buildInitParams(order, { token: 'tok' })
  assert.equal(p.token, 'tok')
  assert.equal(p.orderNumber, order.orderNumber)
  assert.equal(p.language, 'es')
  assert.equal(p.capture, 1)
  assert.equal(p.subscription, 0)
  assert.equal(p.hashVersion, 'V2')
  assert.equal(p.redirect, order.returnUrl)
  assert.equal(p.billToEmail, 'ana@empresa.com')
  assert.equal(p.billToFirstName, 'Ana')
  assert.equal(p.billToLastName, 'Rojas')
  assert.ok(p.billToAddress.length > 0, 'billToAddress es obligatorio')
})

test('Init: el país sale del código telefónico y el idioma del sitio', () => {
  assert.equal(buildInitParams(order, { token: 't' }).billToCountry, 'CR')
  const us = buildInitParams({ ...order, locale: 'en', customer: { ...order.customer, phone: '+13055550000' } }, { token: 't' })
  assert.equal(us.billToCountry, 'US')
  assert.equal(us.language, 'en')
})

// ── consult ─────────────────────────────────────────────────────────────────────

const approved = (over: Record<string, unknown> = {}) => ({
  type: '200',
  message: '',
  response: [
    {
      id_tilopay: 734312,
      orderNumber: order.orderNumber,
      amount: '97.00',
      currency: 'USD',
      code: '1',
      response: 'Transacción aprobada',
      auth: '123456',
      environment: 'Test',
      type: 'Payment',
      ...over,
    },
  ],
})

test('consult aprobado: lee la clave response, el monto (cadena) y el ambiente', () => {
  const s = parseConsult(approved(), order.orderNumber)
  assert.deepEqual(s, {
    state: 'approved',
    money: { amount: 97, currency: 'USD' },
    environment: 'TEST',
    reference: '123456',
  })
  const prod = parseConsult(approved({ environment: 'Production' }), order.orderNumber)
  assert.equal(prod.state === 'approved' && prod.environment, 'PROD')
})

test('consult real: el orderNumber vuelve con el prefijo del comercio y sigue siendo la misma orden', () => {
  // Respuesta real de la cuenta en modo de pruebas (2026-10-07), sin datos personales
  const real = {
    type: '200',
    message: 'success',
    response: [
      {
        id_tilopay: 6032366,
        orderNumber: 'PFC030684-BRD-261007-JBMHB4C0',
        amount: '97.00',
        currency: 'USD',
        merchantId: '88802749',
        paymentLabel: 'Tarjeta de Crédito o Débito',
        code: '1',
        response: 'Transaction is approved',
        payment_details: null,
        auth: '123456',
        commission: '4.12',
        net_to_liquidate: '85.08',
        capture: 'Capture',
        card: '',
        last: '',
        environment: 'Test',
        type: 'Payment',
        date: '2026-10-07 15:34:32',
      },
    ],
  }
  assert.deepEqual(parseConsult(real, 'BRD-261007-JBMHB4C0'), {
    state: 'approved',
    money: { amount: 97, currency: 'USD' },
    environment: 'TEST',
    reference: '123456',
  })
  // Pero una orden que solo termina parecido no es la misma
  assert.equal(parseConsult(real, '261007-JBMHB4C0').state, 'not_found')
})

test('consult sin transacción: "Does not exist" es no encontrada', () => {
  assert.deepEqual(parseConsult({ type: '200', message: 'Does not exist', response: [] }, order.orderNumber), {
    state: 'not_found',
  })
})

test('consult con los datos bajo "data" no se toma como "no existe": es desconocido', () => {
  const s = parseConsult({ type: '200', data: approved().response }, order.orderNumber)
  assert.equal(s.state, 'unknown')
})

test('consult rechazado: devuelve el motivo del emisor', () => {
  const s = parseConsult(approved({ code: '0', response: 'Fondos insuficientes' }), order.orderNumber)
  assert.deepEqual(s, { state: 'declined', reason: 'Fondos insuficientes' })
})

test('consult ignora transacciones de otra orden', () => {
  const s = parseConsult(approved({ orderNumber: 'OTRA-ORDEN' }), order.orderNumber)
  assert.equal(s.state, 'not_found')
})

test('consult con un reembolso aprobado no cuenta como pago', () => {
  const json = approved()
  json.response.push({ ...json.response[0], type: 'Refund', id_tilopay: 734400 })
  const s = parseConsult(json, order.orderNumber)
  assert.deepEqual(s, { state: 'declined', reason: 'refunded' })
})

test('consult con un cuerpo de error (sin response) es desconocido', () => {
  assert.equal(parseConsult({ type: '401', message: 'Unauthenticated' }, order.orderNumber).state, 'unknown')
  assert.equal(parseConsult('<html>', order.orderNumber).state, 'unknown')
})

// ── tokens y webhook ────────────────────────────────────────────────────────────

test('vigencia del token: segundos (login del API) o fecha exacta (loginSdk, hora de Costa Rica)', () => {
  const now = Date.UTC(2026, 9, 7, 21, 18, 37)
  assert.equal(parseTokenExpiry(86400, now), now + 86_400_000)
  assert.equal(parseTokenExpiry('2026-10-07 16:18:37', now), Date.UTC(2026, 9, 7, 22, 18, 37))
  // Formato desconocido: vence pronto en vez de confiar
  assert.equal(parseTokenExpiry('mañana', now), now + 5 * 60_000)
})

test('webhook: encuentra el número de orden en las formas habituales del cuerpo', () => {
  assert.equal(orderFromWebhook({ orderNumber: 'BRD-1' }), 'BRD-1')
  assert.equal(orderFromWebhook({ order: 'BRD-2' }), 'BRD-2')
  assert.equal(orderFromWebhook({ order_number: 'BRD-3' }), 'BRD-3')
  assert.equal(orderFromWebhook({ data: { orderNumber: 'BRD-4' } }), 'BRD-4')
  assert.equal(orderFromWebhook({ nada: 1 }), null)
  assert.equal(orderFromWebhook(null), null)
  assert.equal(orderFromWebhook({ orderNumber: 'con espacios y <script>' }), null)
})
