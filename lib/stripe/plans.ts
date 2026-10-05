// Server-side catalog of plans purchasable from the website.
// The client only ever sends a plan key — never a price id — so we can't be
// tricked into checking out an arbitrary product.
//
// Prices live in the Stripe account "Alejandro Aguilar" and are found by
// lookup key, so the same code works in test and live mode (each mode has its
// own price with the same lookup key).

export type PlanKey = 'essentials_monthly'

export type Plan = {
  lookupKey: string
  productKind: string
  trialDays?: number
  displayName: string
}

export const PLANS: Record<PlanKey, Plan> = {
  essentials_monthly: {
    lookupKey: 'bralto_essentials_monthly', // Essentials USD 87/mes
    productKind: 'bralto_essentials',
    trialDays: 14,
    displayName: 'Plataforma Bralto Essentials',
  },
}

export function getPlan(key: string): Plan | null {
  return (PLANS as Record<string, Plan>)[key] ?? null
}
