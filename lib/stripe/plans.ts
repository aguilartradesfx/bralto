// Server-side catalog of plans purchasable from the website.
// The client only ever sends a plan key — never a price id — so we can't be
// tricked into checking out an arbitrary product.

export type PlanKey = 'essentials_monthly'

export type Plan = {
  priceId: string
  productKind: string
  trialDays?: number
  displayName: string
}

export const PLANS: Record<PlanKey, Plan> = {
  essentials_monthly: {
    priceId: 'price_1TczKVEQo0AZC6TyjByOD7px', // Essentials $87/mo (prod_Uc9AVg9F5vCGrZ)
    productKind: 'bralto_essentials',
    trialDays: 14,
    displayName: 'Plataforma Bralto Essentials',
  },
}

export function getPlan(key: string): Plan | null {
  return (PLANS as Record<string, Plan>)[key] ?? null
}
