'use client'

import { useEffect } from 'react'
import { deGolpe } from './de-golpe'

// Recién registrada, la persona estaba en el cuadro del registro (arriba de todo): la guía se abre
// desde el comienzo, de golpe, y se limpia el ?abierta=1 de la dirección
export function IrAGuia() {
  useEffect(() => {
    deGolpe(() => window.scrollTo(0, 0))
    const url = new URL(window.location.href)
    url.searchParams.delete('abierta')
    window.history.replaceState(window.history.state, '', url.pathname + url.search)
  }, [])
  return null
}
