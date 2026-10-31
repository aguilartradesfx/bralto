'use client'

import { useEffect, useRef, useState } from 'react'

// El tamaño de una caja (en píxeles del lienzo, antes de la escala), para dibujar a su medida. 0 hasta que se mide
export function useMedida<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [medida, setMedida] = useState({ ancho: 0, alto: 0 })
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const medir = () => {
      const ancho = Math.round(el.clientWidth)
      const alto = Math.round(el.clientHeight)
      setMedida((m) => (m.ancho === ancho && m.alto === alto ? m : { ancho, alto }))
    }
    medir()
    const observador = new ResizeObserver(medir)
    observador.observe(el)
    return () => observador.disconnect()
  }, [])
  return [ref, medida] as const
}
