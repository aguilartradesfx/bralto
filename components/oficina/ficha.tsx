'use client'

import { useEffect, useRef, type RefObject } from 'react'
import type { Aspecto, Marca } from '@/lib/oficina/tipos'
import { ETIQUETA, lineaAhora, lineaFalla, marcaDeAhora, proximoDe, ultimoDe, type AgenteSnap } from '@/lib/oficina/pagina'
import { SH, SW, sprite } from './pixel/knox-sprite'
import { COL } from './pixel/vista'
import { Ver } from './panel'

// La foto pixel: el sprite de 28×38 ampliado un número entero de pixeles de pantalla (nítido en cualquier pantalla)
function Foto({ aspecto, nombre }: { aspecto: Aspecto; nombre: string }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const clave = JSON.stringify(aspecto)
  useEffect(() => {
    const cv = ref.current
    const c = cv?.getContext('2d')
    if (!cv || !c) return
    const dpr = window.devicePixelRatio || 1
    const k = Math.max(1, Math.round(3 * dpr))
    cv.width = SW * k
    cv.height = SH * k
    cv.style.width = `${(SW * k) / dpr}px`
    cv.style.height = `${(SH * k) / dpr}px`
    c.imageSmoothingEnabled = false
    c.clearRect(0, 0, cv.width, cv.height)
    c.drawImage(sprite(JSON.parse(clave) as Aspecto), 0, 0, SW * k, SH * k)
  }, [clave])
  return <canvas ref={ref} width={SW * 3} height={SH * 3} role="img" aria-label={`${nombre}, en pixel art`} />
}

// La ficha de un Knox: se abre al tocar su oficina, su carita o su nombre; se cierra con ×, Esc o tocando afuera
export function Ficha(p: {
  agente: AgenteSnap | null
  abierta: boolean
  marcas: Marca[]
  paraTi: Marca[]
  dormida: boolean
  ahora: Date
  cerrar(): void
  ver(m: Marca): void
  refFicha: RefObject<HTMLElement | null>
}) {
  const antes = useRef<HTMLElement | null>(null)

  // al abrir, el foco va a la ficha (sin anillo: no es un botón); al cerrar vuelve a donde estaba (si era un botón del panel)
  useEffect(() => {
    if (p.abierta) {
      const activo = document.activeElement
      antes.current = activo instanceof HTMLElement && activo !== document.body ? activo : null
      p.refFicha.current?.focus({ preventScroll: true })
      return
    }
    const previo = antes.current
    antes.current = null
    if (previo && previo.isConnected && p.refFicha.current?.contains(document.activeElement)) previo.focus({ preventScroll: true })
  }, [p.abierta, p.refFicha])

  const a = p.agente
  const enQue = a ? lineaAhora(a, p.marcas, p.paraTi, p.ahora) : null
  const falla = a && a.estado === 'fallo' ? lineaFalla(a, p.marcas, p.ahora) : null
  const entrega = a && a.estado === 'listo' ? marcaDeAhora(a, p.marcas, p.paraTi) : null

  return (
    <aside
      ref={p.refFicha}
      className={`of-ficha${p.abierta && a ? ' abierta' : ''}`}
      role="dialog"
      aria-modal="false"
      aria-label={a ? `Ficha de ${a.nombre}` : 'Ficha'}
      aria-hidden={!(p.abierta && a)}
      inert={!(p.abierta && a)}
      tabIndex={-1}
    >
      <button type="button" className="of-cerrar" aria-label="Cerrar la ficha" onClick={p.cerrar}>
        ×
      </button>
      {a && (
        <>
          <div className="of-foto">
            <Foto aspecto={a.aspecto} nombre={a.nombre} />
          </div>
          <h2>{a.nombre}</h2>
          <p className="of-rol">{a.oficio}</p>
          <div className="of-estado">
            <span className="of-dot" style={{ background: COL[a.estado] }} />
            {ETIQUETA[a.estado]}
          </div>
          <div className="of-stats">
            <div className="of-stat">
              <b>{a.numeros.tareas.toLocaleString('es-CR')}</b>
              <span>tareas completadas</span>
            </div>
            <div className="of-stat">
              <b>{a.numeros.horas.toLocaleString('es-CR', { maximumFractionDigits: 1 })}</b>
              <span>horas trabajadas</span>
            </div>
            <div className="of-stat">
              <b>{a.numeros.diasSinFallar.toLocaleString('es-CR')}</b>
              <span>días sin fallar</span>
            </div>
          </div>
          {a.personalidad && <p className="of-perso">{a.personalidad}</p>}
          {a.frase && <p className="of-frase">«{a.frase}»</p>}
          <dl className="of-datos">
            <dt>Área</dt>
            <dd>{a.area}</dd>
            {enQue && (
              <>
                <dt>Ahora</dt>
                <dd>
                  {enQue}
                  {falla && <> · {falla}</>}
                  {entrega && <Ver m={entrega} ver={p.ver} />}
                </dd>
              </>
            )}
            <dt>Lo último que hizo</dt>
            <dd>{ultimoDe(a.id, p.marcas, p.ahora) ?? 'Nada en las últimas 24 horas'}</dd>
            <dt>Lo próximo</dt>
            <dd>{proximoDe(a, p.ahora, p.dormida)}</dd>
          </dl>
        </>
      )}
    </aside>
  )
}
