import { Redis } from '@upstash/redis'
import { createBookingInGhl } from '@/lib/ghl/bookings'
import { stripeApi } from '@/lib/stripe/server'
import {
  CHECKOUT_TTL_SECONDS,
  finalizeDiagnostic,
  type CheckoutSessionLike,
  type DiagnosticBooking,
  type FinalizeResult,
} from './diagnostic'

// Conexiones reales del diagnóstico pagado (Redis, Stripe, Supabase, calendario).
// La lógica vive en ./diagnostic.ts, con tests.

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

export async function finalizeDiagnosticCheckout(checkoutSessionId: string): Promise<FinalizeResult> {
  if (!CHECKOUT_ID.test(checkoutSessionId)) return { status: 'invalid' }
  const r = redis()
  return finalizeDiagnostic(checkoutSessionId, {
    getSession: (id) => stripeApi<CheckoutSessionLike>(`/checkout/sessions/${id}`),
    claim: async (key) => (r ? (await r.set(key, '1', { nx: true, ex: 60 * 60 * 24 * 90 })) !== null : true),
    bookSlot: async (setKey, slot) => (r ? (await r.sadd(setKey, slot)) === 1 : true),
    releaseLock: async (slot) => {
      if (r) await r.del(lockKey(slot))
    },
    saveBooking: saveBookingToSupabase,
    pushToCalendar: async (b) => {
      await createBookingInGhl({
        slotKey: b.slot,
        firstName: b.firstName,
        lastName: b.lastName,
        phone: b.phone,
        email: b.email,
        answers: b.answers,
      })
    },
    log: (message, err) => console.error(message, err ?? ''),
  })
}
