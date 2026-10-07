import { z } from 'zod'
import type { Money, PaymentEnvironment, PaymentStatus } from '../payments/types'

// Diagnóstico de 30 minutos: $97 USD. Si contrata el servicio, se descuenta del
// proyecto; si no, no se reembolsa (términos de Alejandro, 2026-10-05). Desde 2026-10-07
// los textos visibles solo mencionan el descuento, a pedido de Alejandro.
// En unidades enteras de la moneda (lo que espera Tilopay): 97, no 9700.
export const DIAGNOSTIC_PRICE: Money = { amount: 97, currency: 'USD' }
// Solo para el flujo de Stripe (desconectado), que sí usa céntimos
export const DIAGNOSTIC_PRICE_CENTS = 9700
// Stripe exige que una sesión de Checkout dure 30 minutos o más; el horario queda
// retenido ese mismo tiempo mientras la persona paga.
export const CHECKOUT_TTL_SECONDS = 31 * 60

const TERMS = {
  es: 'Pago único de $97 USD por el diagnóstico de 30 minutos. Si decide avanzar con el proyecto, le descontamos los $97 completos.',
  en: 'One-time payment of $97 USD for the 30-minute diagnostic session. If you move forward with the project, we credit the full $97 toward it.',
} as const

export const DIAGNOSTIC_PRODUCT = {
  es: { name: 'Diagnóstico Bralto · 30 minutos', description: 'Sesión de diagnóstico con el equipo de Bralto.' },
  en: { name: 'Bralto diagnostic · 30 minutes', description: 'Diagnostic session with the Bralto team.' },
} as const

const ANSWER_IDS = ['size', 'revenue', 'challenge', 'industry', 'timeline'] as const
type AnswerId = (typeof ANSWER_IDS)[number]

export type DiagnosticBooking = {
  slot: string
  firstName: string
  lastName: string
  phone: string
  email: string
  locale: 'es' | 'en'
  answers: Record<AnswerId, string>
}

export type DiagnosticRequest = DiagnosticBooking & { sessionId: string }

// Solo los horarios curados del sitio (deben coincidir con TIME_SLOTS de /agendar)
const SLOT = /^\d{4}-\d{2}-\d{2}-(9am|1pm|3pm|5pm)$/
const text = (max: number) => z.string().trim().min(1).max(max)
const answer = text(80) // corto a propósito: todas las respuestas entran en un metadato de Stripe

const RequestSchema = z.object({
  slot: z.string().regex(SLOT),
  sessionId: z.string().min(8).max(100),
  nombre: text(80),
  apellido: text(80),
  countryCode: z.string().regex(/^\+\d{1,4}$/),
  telefono: z.string().regex(/^[\d\s().-]{4,20}$/),
  email: z.string().trim().toLowerCase().pipe(z.email()),
  answers: z.object(Object.fromEntries(ANSWER_IDS.map((id) => [id, answer])) as Record<AnswerId, typeof answer>),
  locale: z.enum(['es', 'en']).default('es'),
})

export function parseDiagnosticRequest(
  body: unknown,
): { ok: true; data: DiagnosticRequest } | { ok: false; error: string } {
  const r = RequestSchema.safeParse(body)
  if (!r.success) return { ok: false, error: r.error.issues.map((i) => i.path.join('.')).join(', ') || 'invalid' }
  const d = r.data
  return {
    ok: true,
    data: {
      slot: d.slot,
      sessionId: d.sessionId,
      firstName: d.nombre,
      lastName: d.apellido,
      phone: `${d.countryCode}${d.telefono.replace(/\D/g, '')}`,
      email: d.email,
      locale: d.locale,
      answers: d.answers,
    },
  }
}

// Parámetros de POST /v1/checkout/sessions (notación con corchetes de Stripe)
export function buildDiagnosticCheckout(
  req: DiagnosticRequest,
  opts: { origin: string; nowSeconds: number },
): Record<string, string | number> {
  const product = DIAGNOSTIC_PRODUCT[req.locale]
  const metadata: Record<string, string> = {
    product_kind: 'diagnostic',
    slot: req.slot,
    first_name: req.firstName,
    last_name: req.lastName,
    phone: req.phone,
    email: req.email,
    locale: req.locale,
    answers: JSON.stringify(req.answers),
  }

  const params: Record<string, string | number> = {
    mode: 'payment',
    'line_items[0][quantity]': 1,
    'line_items[0][price_data][currency]': 'usd',
    'line_items[0][price_data][unit_amount]': DIAGNOSTIC_PRICE_CENTS,
    'line_items[0][price_data][product_data][name]': product.name,
    'line_items[0][price_data][product_data][description]': product.description,
    // Siempre en dólares (decisión de Alejandro): sin conversión a la moneda local
    'adaptive_pricing[enabled]': 'false',
    customer_email: req.email,
    client_reference_id: req.slot,
    locale: req.locale,
    expires_at: opts.nowSeconds + CHECKOUT_TTL_SECONDS,
    success_url: `${opts.origin}/${req.locale}/confirmacion?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${opts.origin}/${req.locale}/agendar?pago=cancelado`,
    'custom_text[submit][message]': TERMS[req.locale],
    'payment_intent_data[description]': `${product.name} · ${req.slot}`,
    'payment_intent_data[metadata][product_kind]': 'diagnostic',
    'payment_intent_data[metadata][slot]': req.slot,
  }
  for (const [k, v] of Object.entries(metadata)) params[`metadata[${k}]`] = v
  return params
}

export function bookingFromMetadata(metadata: Record<string, string> | null | undefined): DiagnosticBooking | null {
  if (!metadata || metadata.product_kind !== 'diagnostic') return null
  if (!SLOT.test(metadata.slot ?? '') || !metadata.email) return null
  let answers: Record<AnswerId, string>
  try {
    answers = JSON.parse(metadata.answers ?? '{}')
  } catch {
    answers = {} as Record<AnswerId, string>
  }
  return {
    slot: metadata.slot,
    firstName: metadata.first_name ?? '',
    lastName: metadata.last_name ?? '',
    phone: metadata.phone ?? '',
    email: metadata.email,
    locale: metadata.locale === 'en' ? 'en' : 'es',
    answers,
  }
}

// ── Confirmación ───────────────────────────────────────────────────────────────
// Confirma un diagnóstico pagado. La llaman la página de éxito y el webhook de Stripe:
// lo que llegue primero confirma y el otro no repite nada (claim con SET NX).

export type CheckoutSessionLike = {
  id: string
  payment_status: string
  livemode: boolean
  metadata?: Record<string, string> | null
}

export type FinalizeDeps = {
  getSession: (id: string) => Promise<CheckoutSessionLike>
  // true solo para el primero que reclama la clave
  claim: (key: string) => Promise<boolean>
  // true si el horario quedó ocupado por este pago; false si ya estaba ocupado
  bookSlot: (setKey: string, slot: string) => Promise<boolean>
  releaseLock: (slot: string) => Promise<void>
  saveBooking: (booking: DiagnosticBooking) => Promise<void>
  pushToCalendar: (booking: DiagnosticBooking) => Promise<void>
  log?: (message: string, err?: unknown) => void
}

export type FinalizeResult =
  | { status: 'confirmed' | 'already' | 'conflict'; booking: DiagnosticBooking; live: boolean }
  | { status: 'unpaid' | 'invalid' }

// Los pagos de prueba usan su propio registro: nunca ocupan horarios reales
const keys = (live: boolean, sessionId: string) => {
  const prefix = live ? 'bralto:' : 'bralto:test:'
  return { booked: `${prefix}booked_slots`, claim: `${prefix}diag:done:${sessionId}` }
}

export async function finalizeDiagnostic(checkoutSessionId: string, deps: FinalizeDeps): Promise<FinalizeResult> {
  const log = deps.log ?? (() => {})
  const session = await deps.getSession(checkoutSessionId)
  const booking = bookingFromMetadata(session.metadata)
  if (!booking) return { status: 'invalid' }
  if (session.payment_status !== 'paid') return { status: 'unpaid' }

  const live = session.livemode
  const k = keys(live, session.id)
  if (!(await deps.claim(k.claim))) return { status: 'already', booking, live }

  const booked = await deps.bookSlot(k.booked, booking.slot)
  await deps.releaseLock(booking.slot)

  if (live) {
    try {
      await deps.saveBooking(booking)
    } catch (err) {
      log(`[diagnostic] no se guardó la reserva ${session.id}`, err)
    }
  }

  if (!booked) {
    log(`[diagnostic] CONFLICTO: pago ${session.id} recibido pero el horario ${booking.slot} ya estaba ocupado (${booking.email})`)
    return { status: 'conflict', booking, live }
  }

  if (live) {
    try {
      await deps.pushToCalendar(booking)
    } catch (err) {
      log(`[diagnostic] no se creó la cita en el calendario para ${session.id}`, err)
    }
  }

  return { status: 'confirmed', booking, live }
}

// ── Órdenes de la pasarela (Tilopay) ───────────────────────────────────────────
// La orden se guarda antes de cobrar; la confirman la página de retorno, el webhook y el
// barrido de conciliación, siempre contra el API de la pasarela (nunca con el payload).

/** Orden pendiente guardada en Redis antes de abrir el pago */
export type StoredOrder = {
  orderNumber: string
  kind: 'diagnostic'
  provider: string
  money: Money
  booking: DiagnosticBooking
  sessionId: string
  createdAt: number
  status: 'pending' | 'paid' | 'failed' | 'mismatch' | 'expired'
}

export type OrderDeps = Omit<FinalizeDeps, 'getSession'> & {
  getOrder: (orderNumber: string) => Promise<StoredOrder | null>
  getStatus: (orderNumber: string) => Promise<PaymentStatus>
  /** Modo que espera este despliegue: un pago en otro modo no agenda */
  expected: PaymentEnvironment
  markOrder: (orderNumber: string, status: 'paid' | 'failed' | 'mismatch') => Promise<void>
}

export type OrderResult =
  | { status: 'confirmed' | 'already' | 'conflict'; booking: DiagnosticBooking; live: boolean }
  | { status: 'unpaid' | 'invalid' | 'mismatch' | 'error' }

const cents = (m: Money) => Math.round(m.amount * 100)

export async function finalizeOrder(orderNumber: string, deps: OrderDeps): Promise<OrderResult> {
  const log = deps.log ?? (() => {})
  const order = await deps.getOrder(orderNumber)
  if (!order || order.kind !== 'diagnostic') return { status: 'invalid' }

  const status = await deps.getStatus(orderNumber)
  if (status.state === 'unknown') return { status: 'error' }
  if (status.state === 'not_found') return { status: 'unpaid' }
  if (status.state === 'declined') {
    await deps.markOrder(orderNumber, 'failed')
    return { status: 'unpaid' }
  }

  if (status.environment !== deps.expected) {
    log(`[diagnostic] PAGO EN MODO ${status.environment} con el sitio esperando ${deps.expected}: orden ${orderNumber} sin agendar`)
    await deps.markOrder(orderNumber, 'mismatch')
    return { status: 'mismatch' }
  }
  if (cents(status.money) !== cents(order.money) || status.money.currency !== order.money.currency) {
    log(
      `[diagnostic] MONTO DISTINTO en ${orderNumber}: pagó ${status.money.amount} ${status.money.currency}, la orden era ${order.money.amount} ${order.money.currency}`,
    )
    await deps.markOrder(orderNumber, 'mismatch')
    return { status: 'mismatch' }
  }

  const live = status.environment === 'PROD'
  const booking = order.booking
  const k = keys(live, orderNumber)
  if (!(await deps.claim(k.claim))) return { status: 'already', booking, live }

  const booked = await deps.bookSlot(k.booked, booking.slot)
  await deps.releaseLock(booking.slot)
  await deps.markOrder(orderNumber, 'paid')

  if (live) {
    try {
      await deps.saveBooking(booking)
    } catch (err) {
      log(`[diagnostic] no se guardó la reserva ${orderNumber}`, err)
    }
  }

  if (!booked) {
    log(`[diagnostic] CONFLICTO: pago ${orderNumber} recibido pero el horario ${booking.slot} ya estaba ocupado (${booking.email})`)
    return { status: 'conflict', booking, live }
  }

  if (live) {
    try {
      await deps.pushToCalendar(booking)
    } catch (err) {
      log(`[diagnostic] no se creó la cita en el calendario para ${orderNumber}`, err)
    }
  }

  return { status: 'confirmed', booking, live }
}

// Crockford base32: sin I, L, O ni U para que se pueda dictar sin confusiones
const ORDER_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'

/** Número de orden único para siempre: BRD-AAMMDD-XXXXXXXX (8 caracteres aleatorios) */
export function newOrderNumber(at: Date, random: Uint8Array): string {
  const yy = String(at.getUTCFullYear()).slice(2)
  const mm = String(at.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(at.getUTCDate()).padStart(2, '0')
  const tail = Array.from(random.slice(0, 8), (b) => ORDER_ALPHABET[b % 32]).join('')
  return `BRD-${yy}${mm}${dd}-${tail}`
}

/** Una orden sin pago se da por abandonada a las 2 horas */
export const ORDER_EXPIRE_MS = 2 * 3_600_000
const ORDER_GIVE_UP_MS = 48 * 3_600_000

/** Qué hace el barrido con una orden pendiente después de confirmarla contra el API */
export function reconcileAction(result: OrderResult, order: StoredOrder, now: number): 'done' | 'keep' | 'expire' {
  const age = now - order.createdAt
  if (result.status === 'unpaid') return age > ORDER_EXPIRE_MS ? 'expire' : 'keep'
  if (result.status === 'error') return age > ORDER_GIVE_UP_MS ? 'expire' : 'keep'
  return 'done'
}
