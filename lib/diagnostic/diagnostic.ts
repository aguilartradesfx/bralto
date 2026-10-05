import { z } from 'zod'

// Diagnóstico de 30 minutos: $97 USD. Si contrata el servicio, se descuenta del
// proyecto; si no, no se reembolsa (términos de Alejandro, 2026-10-05).
export const DIAGNOSTIC_PRICE_CENTS = 9700
// Stripe exige que una sesión de Checkout dure 30 minutos o más; el horario queda
// retenido ese mismo tiempo mientras la persona paga.
export const CHECKOUT_TTL_SECONDS = 31 * 60

const TERMS = {
  es: 'Pago único de $97 USD por el diagnóstico de 30 minutos. Si contrata el servicio, este monto se descuenta del proyecto; si no, no es reembolsable.',
  en: 'One-time payment of $97 USD for the 30-minute diagnostic session. If you hire us, this amount is deducted from the project; if not, it is non-refundable.',
} as const

const PRODUCT = {
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
  const product = PRODUCT[req.locale]
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
