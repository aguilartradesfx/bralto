import { upsertContact, addContactTags } from '@/lib/ghl/api'

const BRALTO_LOCATION_ID =
  process.env.HIGHLEVEL_BRALTO_LOCATION_ID ?? 'hdVpvshZP3RGJQbxx8GA'

type CheckoutSession = {
  id: string
  customer?: string
  subscription?: string
  amount_total?: number
  currency?: string
  customer_details?: {
    email?: string
    name?: string
    phone?: string
  } & Record<string, unknown>
  custom_fields?: Array<{
    key: string
    text?: { value?: string | null }
  }>
  metadata?: Record<string, string>
  [key: string]: unknown
}

function splitName(full?: string): { firstName: string; lastName: string } {
  if (!full) return { firstName: '', lastName: '' }
  const parts = full.trim().split(/\s+/)
  return { firstName: parts[0] ?? '', lastName: parts.slice(1).join(' ') }
}

function readCustomField(session: CheckoutSession, key: string): string | undefined {
  return session.custom_fields?.find((f) => f.key === key)?.text?.value ?? undefined
}

// Handles checkouts for the public $87/mo Bralto Essentials plan.
//
// The GHL sub-account + SaaS plan are provisioned by GHL's native SaaS Mode
// (connected directly to Stripe), so we deliberately do NOT create the
// sub-account here — that would duplicate it. Our only job is to register the
// buyer as a lead in Bralto's own agency location, so the commercial team can
// follow up / run remarketing.
export async function handleBraltoEssentialsCheckout(session: CheckoutSession): Promise<void> {
  const businessName = readCustomField(session, 'business_name')
  const individualName =
    readCustomField(session, 'individual_name') ?? session.customer_details?.name
  const email = session.customer_details?.email ?? ''
  const phone = session.customer_details?.phone ?? ''
  const { firstName, lastName } = splitName(individualName)

  const amount = session.amount_total ? (session.amount_total / 100).toFixed(2) : '87.00'
  const currency = (session.currency ?? 'usd').toUpperCase()
  const tag = `Plataforma Bralto $${amount}/${currency}`

  const lead = await upsertContact({
    locationId: BRALTO_LOCATION_ID,
    email,
    phone,
    firstName,
    lastName,
    companyName: businessName,
    tags: [tag, 'Suscriptor Web'],
    source: 'Sitio web — Plan Essentials',
  })

  // Best-effort tagging — don't fail the whole webhook on a tag hiccup.
  await addContactTags(BRALTO_LOCATION_ID, lead.id, [tag, 'Suscriptor Web']).catch((err) => {
    console.warn(`[bralto_essentials] addContactTags warn for lead ${lead.id}:`, err)
  })
}
