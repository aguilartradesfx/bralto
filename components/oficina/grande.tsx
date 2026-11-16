'use client'

import { createContext, useContext, useEffect, useId, useRef, useSyncExternalStore, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { DE_LADO, type Seccion } from '@/lib/oficina/direccion'

// Las dos maneras de ver una sección más grande: al lado (el tercio de la derecha, en la compu) y en grande (una ventana
// encima de la oficina). Y la capa: lo que va encima de la página (la ficha, los avisos y «en grande») va en un portal a
// document.body, fuera de los marcos que recortan o escalan la página (el centro de Knox), con el mismo look (.of-raiz).

export const TITULO: Record<Seccion, string> = {
  parati: 'Para ti', chat: 'Chat', ahora: 'Ahora', dia: 'Línea del día', maqueta: 'La oficina', plano: 'El plano',
}
const EN_SELECTOR: Partial<Record<Seccion, string>> = { parati: 'Para ti', chat: 'Chat', ahora: 'Ahora', dia: 'Día' }
// cómo se nombra cada sección en una frase: las etiquetas de sus botones dicen cuál abren («Ver el chat en grande»)
export const NOMBRE: Record<Seccion, string> = {
  parati: 'Para ti', chat: 'el chat', ahora: 'lo de ahora', dia: 'la línea del día', maqueta: 'la maqueta', plano: 'el plano',
}

// La clase de la raíz que lleva la capa: la letra pixel y el modo dormida (la pone la Oficina)
export const ClaseCapa = createContext('of-raiz of-capa')

const sinCambios = () => () => {}
// false en el servidor y al hidratar; true después (el portal necesita document.body)
const usarCliente = () => useSyncExternalStore(sinCambios, () => true, () => false)

export function Capa({ children }: { children: ReactNode }) {
  const clase = useContext(ClaseCapa)
  return usarCliente() ? createPortal(<div className={clase}>{children}</div>, document.body) : null
}

// ◧ al lado (el tercio de la derecha lleno), ⤢ en grande y ✕, dibujados en pixeles: se ven iguales en cualquier compu o
// teléfono (los símbolos de texto cambian de letra en cada uno)
type TipoIcono = 'lado' | 'grande' | 'cerrar'
// los trazos diagonales van en cuadritos de 2×2 (en un dibujo de 14×14)
const cuadros = (ps: number[][]) => ps.map(([x, y]) => `M${x} ${y}h2v2h-2z`).join('')
const PIXELES: Record<TipoIcono, string> = {
  lado: 'M1 2h12v1H1zM1 11h12v1H1zM1 3h1v8H1zM12 3h1v8h-1zM8 3h4v8H8z',
  grande: 'M8 1h5v2H8zM11 3h2v3h-2zM1 11h5v2H1zM1 8h2v3H1z' + cuadros([[9, 3], [8, 4], [7, 5], [6, 6], [5, 7], [4, 8], [3, 9]]),
  cerrar: cuadros([2, 3, 4, 5, 6, 7, 8, 9, 10].flatMap((i) => [[i, i], [12 - i, i]])),
}

export function Icono({ tipo }: { tipo: TipoIcono }) {
  return (
    <svg viewBox="0 0 14 14" aria-hidden="true" focusable="false" shapeRendering="crispEdges">
      <path fill="currentColor" d={PIXELES[tipo]} />
    </svg>
  )
}

// abre: con qué se marca el botón que abre una sección (al cerrarla, el foco vuelve a él)
export function BotonIcono(p: { tipo: TipoIcono; etiqueta: string; titulo: string; abre?: string; onClick(): void }) {
  return (
    <button type="button" className="of-icono" aria-label={p.etiqueta} title={p.titulo} data-of-abre={p.abre} onClick={p.onClick}>
      <Icono tipo={p.tipo} />
    </button>
  )
}

// En grande: casi a pantalla completa (en el teléfono, completa). Al abrir, el foco entra a la ventana y la página de
// atrás deja de desplazarse; tocar afuera la cierra. Esc y «atrás» los maneja la Oficina (van en orden con la ficha).
// nombre: la sección en una frase, para la etiqueta de ◧ («Ver el chat al lado»); si no, el título.
export function Grande(p: { titulo: string; nombre?: string; cerrar(): void; alLado?(): void; children: ReactNode }) {
  const ventana = useRef<HTMLDivElement>(null)
  const idTitulo = useId()

  useEffect(() => {
    ventana.current?.focus({ preventScroll: true })
    const html = document.documentElement, cuerpo = document.body
    const antes = [html.style.overflow, cuerpo.style.overflow]
    html.style.overflow = 'hidden'
    cuerpo.style.overflow = 'hidden'
    return () => {
      html.style.overflow = antes[0]
      cuerpo.style.overflow = antes[1]
    }
  }, [])

  return (
    <Capa>
      <div className="of-velo" aria-hidden="true" onClick={p.cerrar} />
      <div ref={ventana} className="of-grande" role="dialog" aria-modal="true" aria-labelledby={idTitulo} tabIndex={-1}>
        <div className="of-grande-h">
          <h2 id={idTitulo}>{p.titulo}</h2>
          <span className="of-acc">
            {p.alLado && <BotonIcono tipo="lado" etiqueta={`Ver ${p.nombre ?? p.titulo} al lado`} titulo="Al lado" onClick={p.alLado} />}
            <BotonIcono tipo="cerrar" etiqueta="Cerrar" titulo="Cerrar" onClick={p.cerrar} />
          </span>
        </div>
        <div className="of-grande-cuerpo">{p.children}</div>
      </div>
    </Capa>
  )
}

// Al lado: el panel del tercio de la derecha, con las secciones arriba para pasar de una a otra sin cerrarlo. Al abrir,
// el foco entra al panel. cuentas: el número que lleva cada sección en el selector (el de «Para ti»).
export function Lado(p: { seccion: Seccion; cuentas: Partial<Record<Seccion, number>>; cambiar(s: Seccion): void; children: ReactNode }) {
  const panel = useRef<HTMLElement>(null)
  const idCuerpo = useId()

  useEffect(() => {
    panel.current?.focus({ preventScroll: true })
  }, [])

  return (
    <aside ref={panel} className="of-panel-lado" aria-label="Al lado" tabIndex={-1}>
      <div className="of-selector" role="tablist" aria-label="Qué ver al lado">
        {DE_LADO.map((s) => {
          const n = p.cuentas[s]
          return (
            <button
              key={s}
              type="button"
              role="tab"
              className="of-tab"
              aria-selected={p.seccion === s}
              aria-controls={idCuerpo}
              onClick={() => p.cambiar(s)}
            >
              {EN_SELECTOR[s]}
              {n ? <span className="of-n">{n}</span> : null}
            </button>
          )
        })}
      </div>
      <div className="of-panel-cuerpo" id={idCuerpo} role="tabpanel" aria-label={TITULO[p.seccion]}>
        {p.children}
      </div>
    </aside>
  )
}
