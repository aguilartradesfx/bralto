'use client'

import type { RefObject } from 'react'

// Knox en pequeño, en la esquina de las vistas que no son Hoy: la isla negra con la onda (como en los reels). La onda
// y el tiempo los mueve el cuadro a cuadro de centro.tsx. Tocar a Knox vuelve a Hoy; el botón pausa o sigue.
export const BARRAS_MINI = 18

export function MiniKnox(p: {
  hablando: boolean
  texto: string
  conAudio: boolean
  ondaRef: RefObject<HTMLDivElement | null>
  tiempoRef: RefObject<HTMLSpanElement | null>
  onCara: () => void
  onBoton: () => void
}) {
  return (
    <div className={`mk${p.hablando ? ' hablando' : ''}`} role="group" aria-label="Knox">
      <button type="button" className="mk-cara" onClick={p.onCara} aria-label="Volver a Hoy">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={p.hablando ? '/knox/senalando.webp' : '/knox/pulgar.webp'} alt="" />
      </button>
      <div className="mk-onda" ref={p.ondaRef} aria-hidden>
        {Array.from({ length: BARRAS_MINI }, (_, k) => (
          <i key={k} />
        ))}
      </div>
      <div className="mk-texto">
        <b>{p.texto}</b>
        <span ref={p.tiempoRef} />
      </div>
      <button type="button" className="mk-boton" onClick={p.onBoton} disabled={!p.conAudio} aria-label={p.hablando ? 'Pausar a Knox' : 'Escuchar a Knox'}>
        {p.hablando ? (
          <svg className="ic" viewBox="0 0 24 24" aria-hidden>
            <path d="M9 5v14M15 5v14" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" aria-hidden className="mk-play">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>
    </div>
  )
}
