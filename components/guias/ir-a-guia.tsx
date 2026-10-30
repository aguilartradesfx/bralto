'use client'

import { useEffect } from 'react'
import { deGolpe } from './de-golpe'

// Recién registrada, la persona llega directo a la parte que se abrió (de golpe: el candado estaba
// justo ahí); después se limpia el ?abierta=1
export function IrAGuia() {
  useEffect(() => {
    deGolpe(() => document.getElementById('guia')?.scrollIntoView({ block: 'start' }))
    const url = new URL(window.location.href)
    url.searchParams.delete('abierta')
    window.history.replaceState(window.history.state, '', url.pathname + url.search)
  }, [])
  return null
}
