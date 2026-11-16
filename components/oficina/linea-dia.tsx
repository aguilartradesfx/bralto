'use client'

import { useEffect, useRef, useState } from 'react'
import type { EstadoOficina, Marca, Proximo } from '@/lib/oficina/tipos'
import { SEP_PX, lineaDelDia, type AgenteSnap, type ClaseRaya } from '@/lib/oficina/pagina'
import { COL } from './pixel/vista'

const COLOR: Record<ClaseRaya, string> = {
  hecho: '#94a3b8',
  suave: '#64748b',
  sig: 'transparent',
  publicando: COL.publicando,
  listo: COL.listo,
  fallo: COL.fallo,
}

const NOMBRE_COL = 130 // ancho de la columna de las áreas (oficina.css: .of-tl-fila)
const RELLENO = 24 // relleno de .of-hoy a los lados

// La línea del día (pestaña «Maqueta y día»): lo que pasó hoy por área, la línea de ahora y lo que sigue
export function LineaDia(p: { agentes: AgenteSnap[]; marcas: Marca[]; proximos: Proximo[]; oficina: EstadoOficina; ahora: Date }) {
  const ref = useRef<HTMLDivElement>(null)
  const [ancho, setAncho] = useState(900)

  // las etiquetas se acomodan con el ancho real de la pista para no encimarse
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const medir = () => {
      const w = el.clientWidth - RELLENO - NOMBRE_COL
      if (w > 0) setAncho(Math.max(560, Math.round(w)))
    }
    medir()
    const ro = new ResizeObserver(medir)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const dia = lineaDelDia({ agentes: p.agentes, marcas: p.marcas, proximos: p.proximos, oficina: p.oficina }, p.ahora, ancho)

  return (
    <div className="of-hoy" ref={ref} role="group" aria-label="Lo que pasó hoy y lo que sigue">
      <div className="of-tl-fila eje">
        <div className="of-tl-nom">HOY</div>
        <div className="of-tl-pista">
          {dia.ejes.map((e) => (
            <span key={e.texto + e.x} style={{ left: `${e.x}%` }}>
              {e.texto}
            </span>
          ))}
        </div>
      </div>
      {dia.filas.map((f) => (
        <div className="of-tl-fila" key={f.area}>
          <div className="of-tl-nom" title={f.area}>
            {f.area}
          </div>
          <div className="of-tl-pista">
            {dia.sueno && <div className="of-tl-sueno" style={{ left: `${dia.sueno.x}%`, width: `${dia.sueno.w}%` }} />}
            {f.rayas.map((r, i) => (
              <i
                key={`r${i}`}
                className={`of-tl-t${r.clase === 'suave' ? ' suave' : r.clase === 'sig' ? ' sig' : ''}`}
                style={{ left: `${r.x}%`, background: COLOR[r.clase] }}
                title={r.titulo}
              />
            ))}
            {f.barras.map((b, i) => (
              <div key={`b${i}`} className="of-tl-b" style={{ left: `${b.x}%`, width: `${b.w}%`, background: COL[b.estado] }} title={b.titulo}>
                {b.texto}
              </div>
            ))}
            {f.etiquetas.map((e, i) => (
              <span
                key={`e${i}`}
                className="of-tl-l"
                style={e.lado === 'der' ? { left: `calc(${e.x}% + ${SEP_PX}px)` } : { right: `calc(${100 - e.x}% + ${SEP_PX}px)` }}
              >
                {e.texto}
              </span>
            ))}
            {f.vacio && (
              <span className="of-tl-l gris" style={{ left: SEP_PX }}>
                {f.vacio}
              </span>
            )}
            <div className="of-tl-ahora" style={{ left: `${dia.ahora}%` }} />
          </div>
        </div>
      ))}
      <ul className="of-tl-ley" aria-label="Qué quiere decir cada raya">
        <li>
          <i /> Terminó algo
        </li>
        <li>
          <i style={{ background: COL.publicando }} /> Publicó
        </li>
        <li>
          <i style={{ background: COL.listo }} /> Te dejó algo
        </li>
        <li>
          <i style={{ background: COL.fallo }} /> Falló
        </li>
        <li>
          <i className="sig" /> Lo que sigue
        </li>
        <li>
          <i className="ahora" /> Ahora
        </li>
      </ul>
    </div>
  )
}
