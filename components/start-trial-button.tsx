'use client'

import { useState } from 'react'
import { ArrowRight, Loader2 } from 'lucide-react'
import { useLocale } from 'next-intl'

const ESSENTIALS_PLAN_KEY = 'essentials_monthly'

/**
 * Kicks off the Bralto Essentials ($87/mo, 14-day trial) checkout via
 * /api/stripe/checkout and redirects to the returned Stripe URL.
 * Self-contained so it can drop into any section (hero, final CTA, …).
 */
export function StartTrialButton({
  label,
  className,
}: {
  label: string
  className?: string
}) {
  const locale = useLocale()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function startCheckout() {
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: ESSENTIALS_PLAN_KEY, locale }),
      })
      const data = (await res.json()) as { url?: string; error?: string }
      if (!res.ok || !data.url) {
        throw new Error(data.error ?? `Checkout failed (${res.status})`)
      }
      window.location.href = data.url
    } catch (err) {
      setLoading(false)
      setError(err instanceof Error ? err.message : 'Unexpected error')
    }
  }

  return (
    <div className="flex flex-col items-center">
      <button
        type="button"
        onClick={startCheckout}
        disabled={loading}
        className={
          className ??
          'inline-flex items-center justify-center gap-2.5 rounded-full bg-[#5bb6ff] px-10 py-4 font-semibold text-black transition-all hover:shadow-[0_0_48px_rgba(91,182,255,0.3)] disabled:cursor-not-allowed disabled:opacity-60'
        }
      >
        {loading ? (locale === 'en' ? 'Redirecting…' : 'Redirigiendo…') : label}
        {loading ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
      </button>
      {error && <p className="mt-3 text-center text-xs text-rose-300/80">{error}</p>}
    </div>
  )
}
