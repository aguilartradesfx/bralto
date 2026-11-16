'use client'

import { useEffect, useId, useRef, type MouseEvent } from 'react'
import type { AgenteSnap, Foto } from '@/lib/oficina/tipos'
import { nombreDe } from '@/lib/oficina/pagina'
import { Cara } from './cara'
import { BotonIcono, Capa } from './grande'

// El visor de fotos: la foto lo más grande que quepa, su pie y quiénes salen (cada uno abre su ficha y cierra el visor).
// Lo abren el retrato de la ficha, «Sus fotos», las fotos del foro y las miniaturas. Se cierra con ✕, con Esc o tocando
// afuera de la foto. Va encima de la ficha y de «en grande»: el foco entra al abrir, Tab no se sale y, al cerrar, vuelve
// a lo que lo abrió; mientras tanto, la página de atrás no se desplaza.
export function Visor(p: { foto: Foto | null; agentes: AgenteSnap[]; cerrar(): void; abrirFicha(id: string): void }) {
  if (!p.foto) return null
  return <Abierto key={p.foto.id} foto={p.foto} agentes={p.agentes} cerrar={p.cerrar} abrirFicha={p.abrirFicha} />
}

// ¿El toque cayó en la foto? Con object-fit: contain la imagen llena su cuadro, pero la foto se dibuja solo en el centro:
// las franjas de alrededor cuentan como afuera.
function enLaFoto(img: HTMLImageElement, x: number, y: number): boolean {
  const { naturalWidth: w, naturalHeight: h } = img
  if (!w || !h) return true // todavía no carga: mejor no cerrar
  const r = img.getBoundingClientRect()
  const k = Math.min(r.width / w, r.height / h)
  const ancho = w * k, alto = h * k
  const x0 = r.left + (r.width - ancho) / 2, y0 = r.top + (r.height - alto) / 2
  return x >= x0 && x <= x0 + ancho && y >= y0 && y <= y0 + alto
}

const ENFOCABLES = 'button:not(:disabled), a[href]'

function Abierto({ foto, agentes, cerrar, abrirFicha }: { foto: Foto; agentes: AgenteSnap[]; cerrar(): void; abrirFicha(id: string): void }) {
  const caja = useRef<HTMLDivElement>(null)
  const antes = useRef<HTMLElement | null>(null)
  const idTitulo = useId()
  const idPie = useId()
  const titulo = foto.tipo === 'retrato' ? `Retrato de ${nombreDe(foto.agentes[0] ?? '', agentes)}` : 'Foto del equipo'
  const pie = foto.pie?.trim() || null

  // Al abrir, el foco entra; al cerrar, vuelve a lo que lo abrió, salvo que ya esté en otra parte (una ficha que se abrió
  // desde «Salen:»)
  useEffect(() => {
    const el = caja.current
    const activo = document.activeElement
    antes.current = activo instanceof HTMLElement && activo !== document.body ? activo : null
    el?.focus({ preventScroll: true })
    return () => {
      const ahora = document.activeElement
      const suelto = !ahora || ahora === document.body || !!el?.contains(ahora)
      if (suelto && antes.current?.isConnected) antes.current.focus({ preventScroll: true })
    }
  }, [])

  // Esc cierra; Tab da la vuelta adentro del visor
  useEffect(() => {
    const alTecla = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        cerrar()
        return
      }
      const el = caja.current
      if (e.key !== 'Tab' || !el) return
      const focos = Array.from(el.querySelectorAll<HTMLElement>(ENFOCABLES))
      if (!focos.length) return
      const activo = document.activeElement
      const adentro = activo instanceof Node && el.contains(activo)
      if (e.shiftKey ? !adentro || activo === el || activo === focos[0] : !adentro || activo === focos[focos.length - 1]) {
        e.preventDefault()
        ;(e.shiftKey ? focos[focos.length - 1] : focos[0]).focus()
      }
    }
    document.addEventListener('keydown', alTecla)
    return () => document.removeEventListener('keydown', alTecla)
  }, [cerrar])

  // La página de atrás no se desplaza (con dos dedos, el teléfono sí puede acercar la foto)
  useEffect(() => {
    const el = caja.current
    if (!el) return
    const quieto = (e: WheelEvent | TouchEvent) => {
      if (!('touches' in e) || e.touches.length < 2) e.preventDefault()
    }
    el.addEventListener('wheel', quieto, { passive: false })
    el.addEventListener('touchmove', quieto, { passive: false })
    return () => {
      el.removeEventListener('wheel', quieto)
      el.removeEventListener('touchmove', quieto)
    }
  }, [])

  // Tocar afuera cierra: lo de alrededor de la foto, nunca un botón, el pie ni la foto misma
  const alTocar = (e: MouseEvent<HTMLDivElement>) => {
    const t = e.target as Element
    if (t.closest('button, a, h2, .of-visor-pie')) return
    if (t instanceof HTMLImageElement && enLaFoto(t, e.clientX, e.clientY)) return
    cerrar()
  }

  // «Salen:»: el foco vuelve primero a lo que abrió el visor (así, al cerrar la ficha que se abre, vuelve ahí)
  const verFicha = (id: string) => {
    if (antes.current?.isConnected) antes.current.focus({ preventScroll: true })
    abrirFicha(id)
    cerrar()
  }

  return (
    <Capa>
      <div
        ref={caja}
        className="of-visor"
        data-of-visor
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        aria-describedby={pie ? idPie : undefined}
        tabIndex={-1}
        onClick={alTocar}
      >
        <div className="of-visor-h">
          <h2 id={idTitulo}>{titulo}</h2>
          <BotonIcono tipo="cerrar" etiqueta="Cerrar la foto" titulo="Cerrar" onClick={cerrar} />
        </div>
        <div className="of-visor-foto">
          {/* eslint-disable-next-line @next/next/no-img-element -- enlace firmado del bucket privado, de 1 hora */}
          <img src={foto.url} alt={pie ?? titulo} draggable={false} />
        </div>
        {(pie || foto.agentes.length > 0) && (
          <div className="of-visor-pie">
            {pie && <p id={idPie}>{pie}</p>}
            {foto.agentes.length > 0 && (
              <div className="of-salen">
                <span className="of-salen-tit">{foto.agentes.length === 1 ? 'Sale:' : 'Salen:'}</span>
                <ul>
                  {foto.agentes.map((id) => {
                    const ag = agentes.find((a) => a.id === id)
                    const nombre = nombreDe(id, agentes)
                    return (
                      <li key={id}>
                        {ag ? (
                          <button type="button" className="of-quien" data-of-ficha aria-label={`Ver la ficha de ${nombre}`} onClick={() => verFicha(id)}>
                            <Cara agente={ag} px={24} />
                            {nombre}
                          </button>
                        ) : (
                          // un Knox que ya no está: solo su nombre, sin nada que parezca botón
                          <span className="of-salen-tx">{nombre}</span>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </Capa>
  )
}
