'use client'

import { useEffect } from 'react'

// En las guías el fondo animado del sitio (partículas y orbes) queda quieto: es una página para
// leer, y en el teléfono el canvas a 30 cuadros/s obliga a recalcular cada vidrio en cada cuadro
// (calentaba el teléfono). Usa el mismo interruptor que el botón del pie (data-motion en <html>)
// sin tocar la preferencia guardada de la persona, y lo devuelve como estaba al salir.
export function FondoQuieto() {
  useEffect(() => {
    const root = document.documentElement
    const antes = root.dataset.motion
    root.dataset.motion = 'paused'
    return () => {
      if (antes === undefined) delete root.dataset.motion
      else root.dataset.motion = antes
    }
  }, [])
  return null
}
