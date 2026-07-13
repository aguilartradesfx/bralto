import { NextResponse, after } from 'next/server'
import { verifyStripeSignature, StripeSignatureError, type StripeEvent } from '@/lib/stripe/server'
import { createServiceClient } from '@/lib/supabase/service'
import { handleGhlSaasCheckout } from '@/lib/stripe/handlers/ghl-saas'
import { handleBraltoEssentialsCheckout } from '@/lib/stripe/handlers/bralto-essentials'

// Stripe needs the raw body to verify signatures — disable any body parsing.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type CheckoutSession = {
  id: string
  customer?: string
  subscription?: string
  metadata?: Record<string, string>
  payment_link?: string
  [key: string]: unknown
}

// Maps Stripe event → which handler should run, based on `metadata.product_kind`.
// To launch a new automation: add a new product_kind and the handler.
function resolveProductKind(event: StripeEvent): string | null {
  const obj = event.data.object as { metadata?: Record<string, string> }
  return obj?.metadata?.product_kind ?? null
}

export async function POST(req: Request) {
  const rawBody = await req.text()
  const signature = req.headers.get('stripe-signature')

  let event: StripeEvent
  try {
    event = await verifyStripeSignature({ rawBody, signatureHeader: signature })
  } catch (err) {
    const status = err instanceof StripeSignatureError ? 400 : 500
    console.error('[stripe webhook] verification failed:', err)
    return NextResponse.json({ error: 'Signature verification failed' }, { status })
  }

  const supabase = createServiceClient()
  const productKind = resolveProductKind(event)

  // Idempotency: insert the event row first; conflict means we already processed.
  const { error: insertErr } = await supabase
    .from('stripe_events')
    .insert({
      id: event.id,
      type: event.type,
      livemode: event.livemode,
      payload: event,
      product_kind: productKind,
    })

  if (insertErr) {
    // Unique-violation error code in Postgres is 23505.
    const isDup = (insertErr as { code?: string }).code === '23505'
    if (isDup) {
      return NextResponse.json({ received: true, duplicate: true })
    }
    console.error('[stripe webhook] insert event failed:', insertErr)
    // Still return 200 so Stripe doesn't keep retrying on a logging failure.
    return NextResponse.json({ received: true, warning: 'log_insert_failed' })
  }

  // Process asynchronously so we respond to Stripe within 200ms.
  after(async () => {
    try {
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as CheckoutSession
          if (productKind === 'bralto_essentials') {
            await handleBraltoEssentialsCheckout(session)
          } else if (productKind === 'ghl_saas') {
            await handleGhlSaasCheckout(session)
          } else {
            // No handler registered for this product_kind — log and move on.
            console.log(
              `[stripe webhook] ${event.type}: no handler for product_kind="${productKind ?? '∅'}" (event ${event.id})`,
            )
          }
          break
        }
        default:
          // Many other event types are fine to ignore here.
          break
      }

      await supabase
        .from('stripe_events')
        .update({ processed_at: new Date().toISOString() })
        .eq('id', event.id)
    } catch (err) {
      console.error(`[stripe webhook] handler error for ${event.id}:`, err)
      await supabase
        .from('stripe_events')
        .update({ processing_error: (err as Error).message ?? 'unknown' })
        .eq('id', event.id)
    }
  })

  return NextResponse.json({ received: true })
}
