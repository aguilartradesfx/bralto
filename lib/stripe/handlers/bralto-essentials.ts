import { upsertContact, addContactTags } from '@/lib/ghl/api'
import { handleGhlSaasCheckout } from './ghl-saas'

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

// Handles checkouts for the public $87/mo Bralto Essentials plan:
//   1. Runs the standard GHL SaaS flow — creates a sub-account for the
//      customer so they get their own white-labeled instance.
//   2. Additionally registers the customer as a lead in Bralto's own GHL
//      location so the commercial team has visibility.
export async function handleBraltoEssentialsCheckout(session: CheckoutSession): Promise<void> {
  const businessName = readCustomField(session, 'business_name')
  const individualName =
    readCustomField(session, 'individual_name') ?? session.customer_details?.name
  const email = session.customer_details?.email ?? ''
  const phone = session.customer_details?.phone ?? ''

  // Step 1 — let the existing SaaS handler create the sub-account. We forward
  // the collected names through `collected_information` so it can use them.
  await handleGhlSaasCheckout({
    ...session,
    collected_information: {
      business_name: businessName,
      individual_name: individualName,
    },
  })

  // Step 2 — also create/update a lead in Bralto's own GHL location.
  try {
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
      tags: [tag, 'Suscriptor Web'],
      source: 'Sitio web — Plan Essentials',
    })

    await addContactTags(BRALTO_LOCATION_ID, lead.id, [tag, 'Suscriptor Web']).catch((err) => {
      console.warn(`[bralto_essentials] addContactTags warn for lead ${lead.id}:`, err)
    })
  } catch (err) {
    // Don't fail the webhook if the internal lead step breaks — the customer
    // already has their sub-account from step 1, which is the critical path.
    console.error('[bralto_essentials] internal lead upsert failed:', err)
  }
}
