'use client'

import { useEffect, useId, useRef, useState, type RefObject } from 'react'
import type { Pestana } from '@/lib/oficina/direccion'
import { horaCR } from '@/lib/oficina/horario'
import { chipsDe, lasCR, trabajandoAhora, type AgenteSnap, type Chip } from '@/lib/oficina/pagina'
import { COL } from './pixel/vista'
import type { usarOficina } from './usar-oficina'

const PESTANAS: [Pestana, string][] = [['oficina', 'Oficina'], ['plano', 'Plano'], ['foro', 'Foro'], ['ideas', 'Ideas']]
const NOTA: Record<Pestana, string> = {
  oficina: 'Toca una oficina o un nombre para ver su ficha.',
  plano: 'Toca una carita o un nombre para ver su ficha.',
  foro: 'Toca un nombre para ver su ficha, o una foto para verla en grande.',
  ideas: 'Toca un nombre para ver su ficha, o el post para ir a verlo.',
}
const GUARDIA = '#ffd27a'

type Dormir = ReturnType<typeof usarOficina>['dormir']

// Arriba de todo: el título, el puntito en vivo, las cuentas (cada una baja a su caja), la hora de Costa Rica,
// el switch de dormir con su confirmación y las pestañas (el Foro con lo nuevo; Ideas, con las que esperan respuesta).
export function Cabecera(p: {
  agentes: AgenteSnap[]
  dormida: boolean
  sinSenal: boolean
  datosDe: string // la hora de la última foto buena (para «Sin conexión»)
  ahora: Date
  enMarco: boolean
  pestana: Pestana
  idPanel: string
  nuevosForo: number // 0: no sale
  ideasNuevas: number // 0: no sale
  cambiarPestana(v: Pestana): void
  alChip(clave: Chip['clave']): void
  dormir: Dormir
}) {
  const vivo = p.sinSenal
    ? `Sin conexión · datos de ${lasCR(new Date(p.datosDe))}`
    : p.dormida
      ? 'La oficina duerme'
      : `${trabajandoAhora(p.agentes)} trabajando`
  const fallaron = p.agentes.filter((a) => a.estado === 'fallo').length

  return (
    <header className="of-cab">
      <div className="of-ancho of-gut">
        <div className="of-cab-fila">
          <div className="of-marca">
            {!p.enMarco && <h1>La Oficina de Knox</h1>}
            <span className={`of-vivo${p.sinSenal ? ' of-sin' : ''}`}>
              <i aria-hidden="true" />
              <span>{vivo}</span>
            </span>
          </div>
          <ul className="of-conteo" aria-label="Cuántos hay en cada estado">
            {chipsDe(p.agentes, p.dormida).map((c) => (
              <li key={c.clave}>
                <button
                  type="button"
                  className="of-chip"
                  onClick={() => p.alChip(c.clave)}
                  data-of-ficha={c.clave === 'fallo' && fallaron === 1 ? '' : undefined}
                >
                  <span className="of-dot" style={{ background: c.clave === 'guardia' ? GUARDIA : COL[c.clave] }} />
                  <b>{c.n}</b> {c.texto.replace(/^\d+\s/, '')}
                </button>
              </li>
            ))}
          </ul>
          <div className="of-cab-der">
            <Reloj ahora={p.ahora} />
            <Switch dormida={p.dormida} d={p.dormir} />
          </div>
        </div>
        <div className="of-tabs-fila">
          <nav className="of-tabs" role="tablist" aria-label="Qué ver">
            {PESTANAS.map(([v, texto]) => (
              <button
                key={v}
                type="button"
                role="tab"
                className="of-tab"
                aria-selected={p.pestana === v}
                aria-controls={p.idPanel}
                onClick={() => p.cambiarPestana(v)}
              >
                {texto}
                {v === 'foro' && p.nuevosForo > 0 && (
                  <span className="of-n">
                    {p.nuevosForo}
                    <span className="of-n-tx">{p.nuevosForo === 1 ? ' nuevo' : ' nuevos'}</span>
                  </span>
                )}
                {v === 'ideas' && p.ideasNuevas > 0 && (
                  <span className="of-n">
                    {p.ideasNuevas}
                    <span className="of-oculto">{p.ideasNuevas === 1 ? ' nueva' : ' nuevas'}</span>
                  </span>
                )}
              </button>
            ))}
          </nav>
          <p className="of-nota">{NOTA[p.pestana]}</p>
        </div>
      </div>
    </header>
  )
}

// La hora de Costa Rica, que se mueve sola. Antes de montar dice la de la foto (así coincide con la del servidor).
function Reloj({ ahora }: { ahora: Date }) {
  const [texto, setTexto] = useState<string | null>(null)
  useEffect(() => {
    const tic = () => setTexto(horaCR(new Date()))
    tic()
    const t = setInterval(tic, 1000)
    return () => clearInterval(t)
  }, [])
  return (
    <div className="of-reloj">
      <small>Costa Rica</small>
      <b>{texto ?? horaCR(ahora)}</b>
    </div>
  )
}

// El switch de dormir: pregunta en la misma página (nunca el cuadro del navegador). Se cierra con «No», con Esc o
// tocando afuera; al terminar, el foco vuelve al switch.
function Switch({ dormida, d }: { dormida: boolean; d: Dormir }) {
  const caja = useRef<HTMLDivElement>(null)
  const boton = useRef<HTMLButtonElement>(null)
  const idConfirma = useId()
  const { confirma, cerrar } = d

  useEffect(() => {
    if (!confirma) return
    const alClic = (e: MouseEvent) => {
      if (e.target instanceof Node && caja.current?.contains(e.target)) return
      cerrar()
    }
    const alTecla = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      cerrar()
      boton.current?.focus({ preventScroll: true })
    }
    document.addEventListener('click', alClic)
    document.addEventListener('keydown', alTecla)
    return () => {
      document.removeEventListener('click', alClic)
      document.removeEventListener('keydown', alTecla)
    }
  }, [confirma, cerrar])

  return (
    <div className="of-sw" ref={caja}>
      <button
        ref={boton}
        type="button"
        className="of-switch"
        aria-expanded={confirma}
        aria-controls={confirma ? idConfirma : undefined}
        disabled={d.cambiando}
        onClick={() => (confirma ? cerrar() : d.abrir())}
      >
        <span className={dormida ? 'of-sol' : 'of-luna'} aria-hidden="true" />
        {dormida ? 'Despertar' : 'A dormir'}
      </button>
      {confirma && <Confirmacion id={idConfirma} dormida={dormida} d={d} boton={boton} />}
    </div>
  )
}

function Confirmacion(p: { id: string; dormida: boolean; d: Dormir; boton: RefObject<HTMLButtonElement | null> }) {
  const caja = useRef<HTMLDivElement>(null)
  const no = useRef<HTMLButtonElement>(null)
  const { boton } = p
  useEffect(() => {
    no.current?.focus({ preventScroll: true })
    const el = caja.current
    // al cerrarse con «Sí» o «No», el foco vuelve al switch (si se cerró tocando otro botón, se queda ahí).
    // Solo si la caja de verdad se fue: en desarrollo React desmonta y vuelve a montar de mentira.
    return () => {
      const activo = document.activeElement
      const suelto = !activo || activo === document.body || (el && el.contains(activo))
      requestAnimationFrame(() => {
        if (suelto && !el?.isConnected) boton.current?.focus({ preventScroll: true })
      })
    }
  }, [boton])
  return (
    <div id={p.id} ref={caja} className="of-confirma" role="alertdialog" aria-labelledby={`${p.id}-pregunta`} aria-describedby={p.d.error ? `${p.id}-error` : undefined}>
      <p id={`${p.id}-pregunta`}>
        {p.dormida ? '¿Despertamos la oficina? Retoman donde quedaron.' : '¿Dormimos la oficina? Nadie empieza nada nuevo hasta que la despiertes.'}
      </p>
      <div className="of-botones">
        <button type="button" className="of-btn of-pri" onClick={() => void p.d.cambiar()} disabled={p.d.cambiando}>
          {p.d.cambiando ? 'Un momento…' : p.dormida ? 'Sí, despertar' : 'Sí, a dormir'}
        </button>
        <button ref={no} type="button" className="of-btn" onClick={p.d.cerrar} disabled={p.d.cambiando}>
          No
        </button>
      </div>
      {p.d.error && (
        <p id={`${p.id}-error`} className="of-error" role="alert">
          {p.d.error}
        </p>
      )}
    </div>
  )
}
