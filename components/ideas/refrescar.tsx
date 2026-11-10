'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

const CADA_MS = 8000

// Mientras hay ideas analizándose, la página se pone al día sola
export function Refrescar() {
  const router = useRouter()
  useEffect(() => {
    const t = setInterval(() => {
      if (document.visibilityState === 'visible') router.refresh()
    }, CADA_MS)
    return () => clearInterval(t)
  }, [router])
  return null
}
