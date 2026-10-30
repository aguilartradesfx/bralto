'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

export type ErrorEnvio = { texto: string; otro?: { id: string; nombre: string } }

const SIN_CONEXION = 'Sin conexión. Prueba de nuevo.'
const NO_SE_PUDO = 'No se pudo guardar. Prueba de nuevo.'

// Manda un cambio a la API del CRM y, si sale bien, pone la página al día. Devuelve la respuesta, o null si falló
// (el error queda en `error`, con el contacto que ya tiene ese teléfono o correo si es eso)
export function useEnvio() {
  const router = useRouter()
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<ErrorEnvio | null>(null)
  const [refrescando, startRefresh] = useTransition()

  async function enviar<T = Record<string, unknown>>(url: string, method: 'POST' | 'PATCH', body: unknown, { refrescar = true } = {}): Promise<T | null> {
    setEnviando(true)
    setError(null)
    try {
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const data = (await res.json().catch(() => null)) as (T & { error?: unknown; otro?: ErrorEnvio['otro'] }) | null
      if (!res.ok) {
        setError({ texto: typeof data?.error === 'string' ? data.error : NO_SE_PUDO, otro: data?.otro })
        return null
      }
      if (refrescar) startRefresh(() => router.refresh())
      return (data ?? {}) as T
    } catch {
      setError({ texto: SIN_CONEXION })
      return null
    } finally {
      setEnviando(false)
    }
  }

  return { enviar, ocupado: enviando || refrescando, error, setError }
}
