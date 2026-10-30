'use client'

import { useEffect } from 'react'
import { deGolpe } from './de-golpe'

// Recién registrada, la persona llega de golpe al comienzo del texto (el candado estaba ahí cerca): en
// el teléfono lo abierto se cortaba a las pocas líneas, y saltar directo a la parte nueva le hacía
// perder lo que no alcanzó a leer. Después se limpia el ?abierta=1
export function IrAGuia() {
  useEffect(() => {
    deGolpe(() => document.getElementById('articulo')?.scrollIntoView({ block: 'start' }))
    const url = new URL(window.location.href)
    url.searchParams.delete('abierta')
    window.history.replaceState(window.history.state, '', url.pathname + url.search)
  }, [])
  return null
}
