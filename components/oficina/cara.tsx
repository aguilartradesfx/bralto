'use client'

import { useEffect, useRef, useState } from 'react'
import type { AgenteSnap } from '@/lib/oficina/tipos'
import { sprite } from './pixel/knox-sprite'

// La carita de un Knox: su retrato cuando ya existe (enlace firmado) y, si no hay o no carga, la cabeza en pixel
// (los 24×24 de arriba del sprite), ampliada un número entero de pixeles de pantalla para que se vea nítida.
// Con alTocar es un botón (abre su ficha); sin él, solo adorno al lado del nombre.
export function Cara(p: { agente: AgenteSnap | undefined; url?: string; px: 24 | 48; alTocar?(): void }) {
  const [rota, setRota] = useState<string | null>(null) // el enlace que no cargó (se vence a la hora)
  const conFoto = !!p.url && rota !== p.url
  const clase = `of-cara ${p.px === 48 ? 'of-c48' : 'of-c24'}`
  const nombre = p.agente?.nombre ?? ''
  const adentro = conFoto ? (
    <img src={p.url} alt="" draggable={false} onError={() => setRota(p.url ?? null)} />
  ) : (
    <Pixel agente={p.agente} px={p.px} />
  )
  if (!p.alTocar) {
    return (
      <span className={clase} aria-hidden="true">
        {adentro}
      </span>
    )
  }
  return (
    <button type="button" className={clase} data-of-ficha onClick={p.alTocar} aria-label={nombre ? `Ver la ficha de ${nombre}` : 'Ver la ficha'} title={nombre}>
      {adentro}
    </button>
  )
}

function Pixel({ agente, px }: { agente: AgenteSnap | undefined; px: 24 | 48 }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const clave = agente ? JSON.stringify(agente.aspecto) : ''
  useEffect(() => {
    const cv = ref.current
    const c = cv?.getContext('2d')
    if (!cv || !c || !clave) return
    const dpr = window.devicePixelRatio || 1
    const k = Math.max(1, Math.floor((px * dpr) / 24))
    cv.width = 24 * k
    cv.height = 24 * k
    cv.style.width = `${(24 * k) / dpr}px`
    cv.style.height = `${(24 * k) / dpr}px`
    c.imageSmoothingEnabled = false
    c.clearRect(0, 0, cv.width, cv.height)
    c.drawImage(sprite(JSON.parse(clave)), 2, 0, 24, 24, 0, 0, 24 * k, 24 * k)
  }, [clave, px])
  return <canvas ref={ref} width={24} height={24} style={{ width: px, height: px }} />
}
