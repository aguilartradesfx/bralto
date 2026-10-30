'use client'

import { ABRIR_CANDADO } from './candado'

// «Ir directo a» cada sección. Con la guía cerrada, en vez de saltar abre la ventana del candado.
export function IrDirecto({ secciones, conAcceso }: { secciones: { id: string; texto: string }[]; conAcceso: boolean }) {
  return (
    <nav className="gu-indice gu-tarjeta" aria-label="Ir directo a">
      <span className="hm-eyebrow">Ir directo a</span>
      <ul>
        {secciones.map((s) => (
          <li key={s.id}>
            <a
              href={conAcceso ? `#${s.id}` : '#guia'}
              onClick={(e) => {
                if (conAcceso) return
                e.preventDefault()
                window.dispatchEvent(new Event(ABRIR_CANDADO))
              }}
            >
              {s.texto}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
