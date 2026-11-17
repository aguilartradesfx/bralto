'use client'

import { useEffect, useState } from 'react'

// 'prendida': el navegador la deja prendida · 'no': no se puede (el teléfono la puede apagar) · 'apagada': no se pidió
export type Pantalla = 'prendida' | 'no' | 'apagada'

// Que la pantalla no se apague mientras `activa` (leyendo el guion o subiendo videos), con el Wake Lock del navegador si
// lo tiene. El navegador la suelta cuando la página se esconde: al volver, se pide otra vez.
export function usarPantallaPrendida(activa: boolean): Pantalla {
  const [estado, setEstado] = useState<Exclude<Pantalla, 'apagada'>>('prendida')

  useEffect(() => {
    if (!activa) return
    if (!('wakeLock' in navigator)) {
      setEstado('no')
      return
    }
    let lock: WakeLockSentinel | null = null
    let vivo = true
    const pedir = async () => {
      if (document.visibilityState !== 'visible' || (lock && !lock.released)) return
      try {
        const nuevo = await navigator.wakeLock.request('screen')
        if (!vivo) {
          void nuevo.release().catch(() => {})
          return
        }
        lock = nuevo
        setEstado('prendida')
      } catch {
        if (vivo) setEstado('no')
      }
    }
    const alVolver = () => void pedir()
    void pedir()
    document.addEventListener('visibilitychange', alVolver)
    return () => {
      vivo = false
      document.removeEventListener('visibilitychange', alVolver)
      void lock?.release().catch(() => {})
    }
  }, [activa])

  return activa ? estado : 'apagada'
}
