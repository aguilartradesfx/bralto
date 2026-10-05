import { NextResponse } from 'next/server'
import { buildDiagnosticCheckout, parseDiagnosticRequest } from '@/lib/diagnostic/diagnostic'
import { createCheckoutSession, holdSlotForCheckout } from '@/lib/diagnostic/server'
import { StripeApiError, StripeConfigError } from '@/lib/stripe/server'

// Diagnóstico de $97: retiene el horario mientras dura el pago y crea la sesión de
// Stripe Checkout. La cita se confirma después del pago (página de éxito o webhook).
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function resolveOrigin(req: Request): string {
  const origin = req.headers.get('origin')
  if (origin) return origin.replace(/\/$/, '')
  const envOrigin = process.env.NEXT_PUBLIC_SITE_URL
  if (envOrigin) return envOrigin.replace(/\/$/, '')
  return 'https://bralto.io'
}

export async function POST(req: Request) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const parsed = parseDiagnosticRequest(body)
  if (!parsed.ok) {
    return NextResponse.json({ error: 'invalid', fields: parsed.error }, { status: 400 })
  }

  const hold = await holdSlotForCheckout(parsed.data.slot, parsed.data.sessionId)
  if (!hold.ok) {
    return NextResponse.json({ error: hold.reason }, { status: 409 })
  }

  try {
    const params = buildDiagnosticCheckout(parsed.data, {
      origin: resolveOrigin(req),
      nowSeconds: Math.floor(Date.now() / 1000),
    })
    const session = await createCheckoutSession(params)
    return NextResponse.json({ url: session.url })
  } catch (err) {
    if (err instanceof StripeConfigError) {
      console.error('[diagnostic checkout] config error:', err.message)
      return NextResponse.json({ error: 'not_configured' }, { status: 500 })
    }
    if (err instanceof StripeApiError) {
      console.error('[diagnostic checkout] stripe error:', err.message, err.body)
      return NextResponse.json({ error: 'stripe' }, { status: 502 })
    }
    console.error('[diagnostic checkout] unexpected error:', err)
    return NextResponse.json({ error: 'unexpected' }, { status: 500 })
  }
}
