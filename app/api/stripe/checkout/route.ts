import { NextResponse } from 'next/server'
import { stripeApi, StripeApiError, StripeConfigError } from '@/lib/stripe/server'
import { getPlan } from '@/lib/stripe/plans'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type CheckoutBody = {
  plan?: string
  locale?: string
}

type StripeCheckoutSession = {
  id: string
  url: string
}

function resolveOrigin(req: Request): string {
  const origin = req.headers.get('origin')
  if (origin) return origin.replace(/\/$/, '')
  const envOrigin = process.env.NEXT_PUBLIC_SITE_URL
  if (envOrigin) return envOrigin.replace(/\/$/, '')
  return 'https://bralto.io'
}

export async function POST(req: Request) {
  let body: CheckoutBody
  try {
    body = (await req.json()) as CheckoutBody
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const planKey = body.plan ?? ''
  const plan = getPlan(planKey)
  if (!plan) {
    return NextResponse.json({ error: `Unknown plan: ${planKey || '∅'}` }, { status: 400 })
  }

  const locale = body.locale === 'en' ? 'en' : 'es'
  const origin = resolveOrigin(req)

  // Stripe form-encoding (x-www-form-urlencoded) uses [bracket] notation for
  // nested objects — see serializeStripeForm in lib/stripe/server.ts.
  const params: Record<string, unknown> = {
    mode: 'subscription',
    'line_items[0][price]': plan.priceId,
    'line_items[0][quantity]': 1,
    success_url: `${origin}/87-payment?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/${locale}/precios`,
    allow_promotion_codes: true,
    'phone_number_collection[enabled]': true,
    payment_method_collection: 'always',
    'metadata[product_kind]': plan.productKind,
    'metadata[plan_key]': planKey,
    'metadata[locale]': locale,
    'subscription_data[metadata][product_kind]': plan.productKind,
    'subscription_data[metadata][plan_key]': planKey,
    // Ask for company name + contact name at checkout so we can populate GHL.
    'custom_fields[0][key]': 'business_name',
    'custom_fields[0][type]': 'text',
    'custom_fields[0][label][type]': 'custom',
    'custom_fields[0][label][custom]':
      locale === 'en' ? 'Business name' : 'Nombre de tu empresa',
    'custom_fields[0][text][minimum_length]': 2,
    'custom_fields[0][text][maximum_length]': 80,
    'custom_fields[1][key]': 'individual_name',
    'custom_fields[1][type]': 'text',
    'custom_fields[1][label][type]': 'custom',
    'custom_fields[1][label][custom]':
      locale === 'en' ? 'Your full name' : 'Tu nombre completo',
    'custom_fields[1][text][minimum_length]': 2,
    'custom_fields[1][text][maximum_length]': 80,
  }

  if (plan.trialDays && plan.trialDays > 0) {
    params['subscription_data[trial_period_days]'] = plan.trialDays
  }

  try {
    const session = await stripeApi<StripeCheckoutSession>('/checkout/sessions', {
      method: 'POST',
      body: params,
    })
    return NextResponse.json({ url: session.url, id: session.id })
  } catch (err) {
    if (err instanceof StripeConfigError) {
      console.error('[stripe checkout] config error:', err.message)
      return NextResponse.json({ error: 'Stripe is not configured' }, { status: 500 })
    }
    if (err instanceof StripeApiError) {
      console.error('[stripe checkout] api error:', err.message, err.body)
      return NextResponse.json({ error: 'Could not create checkout session' }, { status: 502 })
    }
    console.error('[stripe checkout] unexpected error:', err)
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 })
  }
}
