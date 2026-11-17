'use client'

import { useEffect, useState } from 'react'
import { candado } from '@/lib/guiones/candado'

// 'prendida': el navegador la deja prendida · 'no': no se puede (el teléfono la puede apagar) · 'apagada': no se pidió
export type Pantalla = 'prendida' | 'no' | 'apagada'

// Que la pantalla no se apague mientras `activa` (leyendo el guion o subiendo videos), con el Wake Lock del navegador si
// lo tiene. El navegador lo suelta cuando la página se esconde: al volver, se pide otra vez (lib/guiones/candado.ts
// cuida que nunca queden dos pedidos a la vez ni uno suelto).
export function usarPantallaPrendida(activa: boolean): Pantalla {
  const [estado, setEstado] = useState<Exclude<Pantalla, 'apagada'>>('prendida')

  useEffect(() => {
    if (!activa) return
    if (!('wakeLock' in navigator)) {
      setEstado('no')
      return
    }
    const c = candado(() => navigator.wakeLock.request('screen'), setEstado)
    const pedir = () => {
      if (document.visibilityState === 'visible') void c.pedir()
    }
    pedir()
    document.addEventListener('visibilitychange', pedir)
    return () => {
      document.removeEventListener('visibilitychange', pedir)
      c.soltar()
    }
  }, [activa])

  return activa ? estado : 'apagada'
}
