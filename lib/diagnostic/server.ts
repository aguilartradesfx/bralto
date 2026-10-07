import { Redis } from '@upstash/redis'
import { createBookingInGhl } from '@/lib/ghl/bookings'
import { expectedEnvironment, paymentGateway, type ClientCheckout } from '@/lib/payments'
import { stripeApi } from '@/lib/stripe/server'
import {
  CHECKOUT_TTL_SECONDS,
  DIAGNOSTIC_PRICE,
  DIAGNOSTIC_PRODUCT,
  finalizeDiagnostic,
  finalizeOrder,
  newOrderNumber,
  reconcileAction,
  type CheckoutSessionLike,
  type DiagnosticBooking,
  type DiagnosticRequest,
  type FinalizeResult,
  type OrderResult,
  type StoredOrder,
} from './diagnostic'

// Conexiones reales del diagnóstico pagado (Redis, pasarela, Supabase, calendario).
// La lógica vive en ./diagnostic.ts, con tests. La pasarela activa es la de
// lib/payments (Tilopay); el flujo de Stripe de más abajo queda desconectado.

const BOOKED_KEY = 'bralto:booked_slots'
const lockKey = (slot: string) => `bralto:lock:${slot}`

function redis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  return url && token ? new Redis({ url, token }) : null
}

export type HoldResult = { ok: true } | { ok: false; reason: 'taken' | 'booked' }

// Retiene el horario a nombre de esta sesión mientras dura el pago. Si ya lo retenía
// la misma sesión, solo extiende el plazo.
export async function holdSlotForCheckout(slot: string, sessionId: string): Promise<HoldResult> {
  const r = redis()
  if (!r) return { ok: true } // sin Redis no hay retención (igual que /api/bookings)
  if (await r.sismember(BOOKED_KEY, slot)) return { ok: false, reason: 'booked' }
  const ttl = CHECKOUT_TTL_SECONDS + 60
  const owner = await r.get<string>(lockKey(slot))
  if (owner === sessionId) {
    await r.set(lockKey(slot), sessionId, { ex: ttl })
    return { ok: true }
  }
  if (owner !== null) return { ok: false, reason: 'taken' }
  const set = await r.set(lockKey(slot), sessionId, { nx: true, ex: ttl })
  return set === null ? { ok: false, reason: 'taken' } : { ok: true }
}

export async function createCheckoutSession(params: Record<string, string | number>) {
  return stripeApi<{ id: string; url: string }>('/checkout/sessions', { method: 'POST', body: params })
}

const CHECKOUT_ID = /^cs_(test|live)_[A-Za-z0-9]+$/

async function saveBookingToSupabase(b: DiagnosticBooking) {
  // Mismo registro que guardaba /api/bookings (tabla bookings, clave anónima)
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_ANON_KEY
  if (!url || !key) return
  await fetch(`${url}/rest/v1/bookings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
      apikey: key,
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({
      slot_key: b.slot,
      nombre: b.firstName,
      apellido: b.lastName,
      telefono: b.phone,
      email: b.email,
      answers: b.answers,
    }),
  })
}

// Efectos de la reserva compartidos por los dos flujos (claim único, horario, calendario)
function bookingEffects(r: Redis | null) {
  return {
    claim: async (key: string) => (r ? (await r.set(key, '1', { nx: true, ex: 60 * 60 * 24 * 90 })) !== null : true),
    bookSlot: async (setKey: string, slot: string) => (r ? (await r.sadd(setKey, slot)) === 1 : true),
    releaseLock: async (slot: string) => {
      if (r) await r.del(lockKey(slot))
    },
    saveBooking: saveBookingToSupabase,
    pushToCalendar: async (b: DiagnosticBooking) => {
      await createBookingInGhl({
        slotKey: b.slot,
        firstName: b.firstName,
        lastName: b.lastName,
        phone: b.phone,
        email: b.email,
        answers: b.answers,
      })
    },
    log: (message: string, err?: unknown) => console.error(message, err ?? ''),
  }
}

// Stripe (desconectado: sin claves en ningún ambiente). Se conserva para poder volver.
export async function finalizeDiagnosticCheckout(checkoutSessionId: string): Promise<FinalizeResult> {
  if (!CHECKOUT_ID.test(checkoutSessionId)) return { status: 'invalid' }
  return finalizeDiagnostic(checkoutSessionId, {
    getSession: (id) => stripeApi<CheckoutSessionLike>(`/checkout/sessions/${id}`),
    ...bookingEffects(redis()),
  })
}

// ── Pasarela activa (Tilopay) ──────────────────────────────────────────────────

const orderKey = (orderNumber: string) => `bralto:pay:order:${orderNumber}`
const PENDING_KEY = 'bralto:pay:pending'
const ORDER_TTL_SECONDS = 60 * 60 * 24 * 60
const ORDER_NUMBER = /^BRD-\d{6}-[0-9A-HJKMNP-TV-Z]{8}$/

export type DiagnosticCheckout = { orderNumber: string; checkout: ClientCheckout; holdExpiresAt: number }

/**
 * Abre el pago de un diagnóstico: la orden se guarda (con la reserva) ANTES de pedirle
 * nada a la pasarela, para que el webhook y el barrido sepan qué consultar si algo se cae.
 */
export async function startDiagnosticCheckout(req: DiagnosticRequest, origin: string): Promise<DiagnosticCheckout> {
  const r = redis()
  if (!r) throw new Error('[diagnostic] Redis no está configurado: no se puede guardar la orden')
  const { sessionId, ...booking } = req
  const orderNumber = newOrderNumber(new Date(), crypto.getRandomValues(new Uint8Array(8)))
  const order: StoredOrder = {
    orderNumber,
    kind: 'diagnostic',
    provider: paymentGateway.provider,
    money: DIAGNOSTIC_PRICE,
    booking,
    sessionId,
    createdAt: Date.now(),
    status: 'pending',
  }
  await r.set(orderKey(orderNumber), order, { ex: ORDER_TTL_SECONDS })
  await r.zadd(PENDING_KEY, { score: order.createdAt, member: orderNumber })

  const checkout = await paymentGateway.prepareCheckout({
    orderNumber,
    money: DIAGNOSTIC_PRICE,
    description: DIAGNOSTIC_PRODUCT[booking.locale].name,
    customer: { firstName: booking.firstName, lastName: booking.lastName, email: booking.email, phone: booking.phone },
    locale: booking.locale,
    // La pasarela agrega su resultado (?code=…); la orden viaja en la ruta, que es nuestra
    returnUrl: `${origin}/${booking.locale}/confirmacion/${orderNumber}`,
  })
  return { orderNumber, checkout, holdExpiresAt: order.createdAt + CHECKOUT_TTL_SECONDS * 1000 }
}

/** Confirma una orden contra la pasarela. Idempotente: retorno, webhook y barrido pueden llamarla. */
export async function finalizeDiagnosticOrder(orderNumber: string): Promise<OrderResult> {
  if (!ORDER_NUMBER.test(orderNumber)) return { status: 'invalid' }
  const r = redis()
  return finalizeOrder(orderNumber, {
    getOrder: async (n) => (r ? await r.get<StoredOrder>(orderKey(n)) : null),
    getStatus: (n) => paymentGateway.getStatus(n),
    expected: expectedEnvironment(process.env),
    markOrder: async (n, status) => {
      if (!r) return
      const order = await r.get<StoredOrder>(orderKey(n))
      if (order) await r.set(orderKey(n), { ...order, status }, { ex: ORDER_TTL_SECONDS })
      await r.zrem(PENDING_KEY, n)
    },
    ...bookingEffects(r),
  })
}

/**
 * Barrido de conciliación. En compras la pasarela manda UN solo webhook: si se pierde, la
 * venta queda huérfana. Esto revisa contra el API toda orden que lleve tiempo pendiente.
 */
export async function reconcilePendingOrders(opts: { limit?: number; minAgeMs?: number } = {}) {
  const r = redis()
  const results: Record<string, string> = {}
  if (!r) return { checked: 0, results }
  const now = Date.now()
  const due = await r.zrange<string[]>(PENDING_KEY, 0, now - (opts.minAgeMs ?? 2 * 60_000), {
    byScore: true,
    offset: 0,
    count: opts.limit ?? 20,
  })
  for (const orderNumber of due) {
    const order = await r.get<StoredOrder>(orderKey(orderNumber))
    if (!order) {
      await r.zrem(PENDING_KEY, orderNumber)
      continue
    }
    try {
      const result = await finalizeDiagnosticOrder(orderNumber)
      const action = reconcileAction(result, order, now)
      if (action !== 'keep') await r.zrem(PENDING_KEY, orderNumber)
      if (action === 'expire') await r.set(orderKey(orderNumber), { ...order, status: 'expired' }, { ex: ORDER_TTL_SECONDS })
      results[orderNumber] = `${result.status} → ${action}`
    } catch (err) {
      console.error(`[reconcile] ${orderNumber} falló:`, err)
      results[orderNumber] = 'error → keep'
    }
  }
  return { checked: due.length, results }
}
