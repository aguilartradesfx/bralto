'use client'

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import type { AgenteSnap, EstadoAgente } from '@/lib/oficina/tipos'
import type { LugarSala } from '@/lib/oficina/sala'
import type { Visita } from '@/lib/oficina/visitas'
import { MEDIDAS, MUNDO_H, MUNDO_W, crearMundo } from '@/lib/oficina/mundo'
import { Icono, NOMBRE } from './grande'
import { crearPlano } from './pixel/plano'
import { crearVista } from './pixel/vista'

// Los dos dibujos de la Oficina. Cada uno crea su dibujo al montarse y lo destruye al desmontarse; mientras vive,
// solo se rehace si cambia el catálogo (quién está, en qué puesto y cómo se ve). Los estados, la bandeja, el modo
// dormir, quién está en la sala y quién de visita le llegan sin rehacerlo, y si su caja cambia de tamaño (al lado) solo
// se vuelve a medir.
// Con enGrande, su ⤢ va junto a + − Ver todo; en grande va sin él (la ventana tiene su ✕).

type Vista2D = ReturnType<typeof crearVista>

// La caja de la maqueta tiene la proporción del mundo más una franja abajo (FRANJA, en pixeles del mundo) para los
// botones y la pista: el dibujo ajustado queda encima de ellos (vista.ts lo sube lo que tapen), así nada de la sala arranca
// tapado. El letrero de «la oficina duerme» va sobre el pasillo de arriba, al centro de las oficinas (sigue al mundo si
// cambia de tamaño). El plano no lleva franja: no tiene botones (si los tiene, también se sube).
const { PAS, CH, X0, RW } = MEDIDAS
const FRANJA = 50
const CAJA: CSSProperties = {
  ['--of-aspecto' as string]: `${MUNDO_W} / ${MUNDO_H + FRANJA}`,
  ['--of-cartel-x' as string]: `${(((X0 + 3 * RW) / MUNDO_W) * 100).toFixed(2)}%`,
  ['--of-cartel-y' as string]: `${(((PAS[0] + CH / 2) / (MUNDO_H + FRANJA)) * 100).toFixed(2)}%`,
}
const CAJA_PLANO: CSSProperties = { ['--of-aspecto' as string]: `${MUNDO_W} / ${MUNDO_H}` }

// Cuánto tapan desde abajo los controles marcados con data-of-tapa (los botones y la pista), en px de la página y con un
// respiro de 8 px. Solo cuenta lo alto: da igual cuántos botones haya en la fila.
function tapaAbajo(caja: HTMLElement | null): number {
  if (!caja) return 0
  const fondo = caja.getBoundingClientRect().bottom
  let alto = 0
  caja.querySelectorAll<HTMLElement>('[data-of-tapa]').forEach((el) => {
    const r = el.getBoundingClientRect()
    if (r.height > 0) alto = Math.max(alto, fondo - r.top)
  })
  return alto > 0 ? alto + 8 : 0
}

// La pista «Toca una oficina…» se apaga sola (12 s y 1 s de fundido en el CSS); con menos movimiento no hay fundido,
// así que este reloj es el que la quita en los dos casos
const PISTA_MS = 13_000

// «10:20 a. m.» nunca se parte en dos renglones
const juntarHora = (s: string) => s.replace(/(\d) ([ap])\. m\./g, '$1 $2. m.')

const catalogoDe = (agentes: AgenteSnap[]) =>
  JSON.stringify(agentes.map((a) => [a.id, a.puesto, a.nombre, a.area, a.aspecto, a.despierto_siempre, a.estado_fijo]))

function estadosDe(agentes: AgenteSnap[]): Record<string, EstadoAgente> {
  const m: Record<string, EstadoAgente> = {}
  for (const a of agentes) m[a.id] = a.estado
  return m
}

// lo último que llegó por props, para leerlo desde el dibujo sin rehacerlo
function useUltimo<T>(v: T) {
  const ref = useRef(v)
  useLayoutEffect(() => {
    ref.current = v
  })
  return ref
}

export function Maqueta(p: {
  agentes: AgenteSnap[]
  bandeja: number
  dormida: boolean
  sala: Record<string, LugarSala> // quién está en la sala y dónde (repartirSala)
  visitas: Record<string, Visita> // quién está de visita y en la oficina de quién (repartirVisitas)
  aLoAlto: boolean
  alTocar(id: string | null): void
  api(v: Vista2D | null): void
  enGrande?(): void
  cartel?: string | null // «La oficina duerme desde las…», encima del dibujo
}) {
  const caja = useRef<HTMLDivElement>(null)
  const lienzo = useRef<HTMLCanvasElement>(null)
  const vista = useRef<Vista2D | null>(null)
  const ultimo = useUltimo(p)
  const catalogo = useMemo(() => catalogoDe(p.agentes), [p.agentes])
  const [pista, setPista] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => setPista(false), PISTA_MS)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    const cv = lienzo.current, box = caja.current
    const { agentes } = ultimo.current
    if (!cv || !box || !agentes.length) return
    const v = crearVista(cv, crearMundo(agentes), agentes, {
      alTocar: (id) => ultimo.current.alTocar(id),
      aLoAlto: p.aLoAlto,
      abajo: () => tapaAbajo(caja.current),
    })
    vista.current = v
    v.estados(estadosDe(agentes))
    v.bandeja(ultimo.current.bandeja)
    v.dormir(ultimo.current.dormida)
    v.sala(ultimo.current.sala, ultimo.current.visitas) // la primera vez, cada uno aparece ya en su lugar
    ultimo.current.api(v)
    const ro = new ResizeObserver(() => v.medir())
    ro.observe(box)
    return () => {
      ro.disconnect()
      v.destruir()
      if (vista.current === v) vista.current = null
      ultimo.current.api(null)
    }
  }, [catalogo, p.aLoAlto, ultimo])

  useEffect(() => {
    vista.current?.estados(estadosDe(p.agentes))
  }, [p.agentes])
  useEffect(() => {
    vista.current?.bandeja(p.bandeja)
  }, [p.bandeja])
  useEffect(() => {
    vista.current?.dormir(p.dormida)
  }, [p.dormida])
  useEffect(() => {
    vista.current?.sala(p.sala, p.visitas)
  }, [p.sala, p.visitas])

  return (
    <div className="of-lienzo of-escena" ref={caja} style={CAJA} data-of-ficha>
      <canvas
        ref={lienzo}
        role="img"
        aria-label="La oficina en pixel art, con la sala abajo. Toca una oficina, a un Knox en la sala o a uno de visita para ver su ficha; tu oficina lleva a «Para ti»."
      />
      {p.cartel && <p className="of-cartel">{juntarHora(p.cartel)}</p>}
      {pista && (
        <p className="of-pista" data-of-tapa>
          Toca una oficina o a un Knox para ver su ficha
        </p>
      )}
      <div className="of-zoom" data-of-tapa>
        <button type="button" aria-label="Acercar" onClick={() => vista.current?.acercar()}>
          +
        </button>
        <button type="button" aria-label="Alejar" onClick={() => vista.current?.alejar()}>
          −
        </button>
        <button type="button" onClick={() => vista.current?.verTodo()}>
          Ver todo
        </button>
        {p.enGrande && (
          <button type="button" aria-label={`Ver ${NOMBRE.maqueta} en grande`} title="En grande" data-of-abre="maqueta-grande" onClick={p.enGrande}>
            <Icono tipo="grande" />
          </button>
        )}
      </div>
    </div>
  )
}

// El lugar de un dibujo mientras se ve en grande: la misma caja, vacía (un solo dibujo andando a la vez)
export function Hueco({ de }: { de: 'maqueta' | 'plano' }) {
  const maqueta = de === 'maqueta'
  return <div className={`of-lienzo of-hueco ${maqueta ? 'of-escena' : 'of-plano'}`} style={maqueta ? CAJA : CAJA_PLANO} aria-hidden="true" />
}

export function Plano(p: {
  agentes: AgenteSnap[]
  textos: Record<string, string>
  sala: Record<string, LugarSala>
  alTocar(id: string | null): void
  enGrande?(): void
}) {
  const caja = useRef<HTMLDivElement>(null)
  const lienzo = useRef<HTMLCanvasElement>(null)
  const plano = useRef<ReturnType<typeof crearPlano> | null>(null)
  const ultimo = useUltimo(p)
  const catalogo = useMemo(() => catalogoDe(p.agentes), [p.agentes])

  useEffect(() => {
    const cv = lienzo.current, box = caja.current
    const { agentes } = ultimo.current
    if (!cv || !box || !agentes.length) return
    // los textos de debajo de cada carita se leen en cada dibujo (cambian con cada foto, no hace falta rehacerlo)
    const pl = crearPlano(cv, agentes, (id) => ultimo.current.textos[id] ?? '', (id) => ultimo.current.alTocar(id), () =>
      tapaAbajo(caja.current),
    )
    plano.current = pl
    pl.estados(estadosDe(agentes))
    pl.sala(ultimo.current.sala)
    const ro = new ResizeObserver(() => pl.medir())
    ro.observe(box)
    return () => {
      ro.disconnect()
      pl.destruir()
      if (plano.current === pl) plano.current = null
    }
  }, [catalogo, ultimo])

  useEffect(() => {
    plano.current?.estados(estadosDe(p.agentes))
  }, [p.agentes])
  useEffect(() => {
    plano.current?.sala(p.sala)
  }, [p.sala])

  return (
    <div className="of-lienzo of-plano" ref={caja} style={CAJA_PLANO} data-of-ficha>
      <canvas
        ref={lienzo}
        role="img"
        aria-label="El plano de la oficina: cada Knox con su anillo de estado y, abajo, la sala con quien está ahí. Toca una carita para ver su ficha."
      />
      {p.enGrande && (
        <div className="of-zoom" data-of-tapa>
          <button type="button" aria-label={`Ver ${NOMBRE.plano} en grande`} title="En grande" data-of-abre="plano-grande" onClick={p.enGrande}>
            <Icono tipo="grande" />
          </button>
        </div>
      )}
    </div>
  )
}
