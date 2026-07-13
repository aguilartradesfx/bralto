import { createSubAccount, upsertContact, addContactTags, enableSaas } from '@/lib/ghl/api'
import { createServiceClient } from '@/lib/supabase/service'

const DEFAULT_PLAN_ID = process.env.HIGHLEVEL_DEFAULT_SAAS_PLAN_ID ?? '684c43e8a8208c0a61936158'

type CheckoutSession = {
  id: string
  customer?: string
  subscription?: string
  metadata?: Record<string, string>
  customer_email?: string
  customer_details?: {
    email?: string
    name?: string
    phone?: string
    business_name?: string
    individual_name?: string
  } & Record<string, unknown>
  collected_information?: {
    business_name?: string
    individual_name?: string
  }
  [key: string]: unknown
}

function splitName(full?: string): { firstName: string; lastName: string } {
  if (!full) return { firstName: '', lastName: '' }
  const parts = full.trim().split(/\s+/)
  return { firstName: parts[0] ?? '', lastName: parts.slice(1).join(' ') }
}

// Replicates the n8n "Stripe → GHL SaaS - New Account Creation" workflow:
// create sub-account → upsert contact (with SAAS tag) → enable SaaS billing.
export async function handleGhlSaasCheckout(session: CheckoutSession): Promise<void> {
  const customerId = session.customer ?? ''
  const subscriptionId = session.subscription ?? ''
  const planId = session.metadata?.ghl_plan_id ?? DEFAULT_PLAN_ID

  if (!customerId || !subscriptionId) {
    throw new Error(
      `ghl_saas: session ${session.id} missing customer or subscription (mode must be "subscription")`,
    )
  }

  const email =
    session.customer_details?.email ?? session.customer_email ?? ''
  const phone = session.customer_details?.phone ?? ''

  const businessName =
    session.collected_information?.business_name ??
    session.customer_details?.business_name ??
    (email ? email.split('@')[0] : 'New Client')

  const individualName =
    session.collected_information?.individual_name ??
    session.customer_details?.name ??
    ''
  const { firstName, lastName } = splitName(individualName)

  // 1. Create the GHL sub-account.
  const location = await createSubAccount({
    name: businessName,
    phone,
    email,
    firstName,
    lastName,
  })

  // 2. Upsert the contact inside the new sub-account, with SAAS tag.
  const contact = await upsertContact({
    locationId: location.id,
    email,
    phone,
    firstName,
    lastName,
    tags: ['SAAS'],
    source: 'Stripe Checkout',
  })

  try {
    await addContactTags(location.id, contact.id, ['SAAS'])
  } catch (err) {
    console.warn(`[ghl_saas] addContactTags warning for ${contact.id}:`, err)
  }

  // 3. Enable SaaS billing on the new location.
  await enableSaas({
    locationId: location.id,
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscriptionId,
    planId,
  })

  // 4. Persist the mapping so we can manage this customer later.
  const supabase = createServiceClient()
  await supabase.from('saas_customers').upsert(
    {
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      ghl_location_id: location.id,
      ghl_contact_id: contact.id,
      ghl_plan_id: planId,
      email,
      business_name: businessName,
      status: 'active',
      raw_checkout_session: session,
    },
    { onConflict: 'stripe_customer_id,stripe_subscription_id' },
  )
}
