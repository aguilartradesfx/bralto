'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Arrow } from './icons'

type Props = {
  locale: 'es' | 'en'
  label: string
  redirecting: string
  error: string
  className?: string
}

// Prueba de 14 días del plan de la plataforma ($87/mes): abre el checkout de Stripe
export function TrialButton({ locale, label, redirecting, error, className }: Props) {
  const [loading, setLoading] = useState(false)
  const [failed, setFailed] = useState(false)

  async function start() {
    setFailed(false)
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: 'essentials_monthly', locale }),
      })
      const data = (await res.json().catch(() => ({}))) as { url?: string }
      if (!res.ok || !data.url) throw new Error()
      window.location.href = data.url
    } catch {
      setLoading(false)
      setFailed(true)
    }
  }

  return (
    <span className={cn('hm-trial', className)}>
      <button type="button" onClick={start} disabled={loading} className="hm-btn hm-btn--solid">
        {loading ? redirecting : label}
        {!loading && <Arrow />}
      </button>
      {failed && (
        <span className="hm-trial__error" role="alert">
          {error}
        </span>
      )}
    </span>
  )
}
