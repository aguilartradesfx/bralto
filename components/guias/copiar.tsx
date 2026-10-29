'use client'

import { useState } from 'react'

// Botón de copiar de cada comando o prompt de la guía
export function Copiar({ texto }: { texto: string }) {
  const [copiado, setCopiado] = useState(false)
  return (
    <button
      type="button"
      className="gu-copiar"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(texto)
          setCopiado(true)
          setTimeout(() => setCopiado(false), 2000)
        } catch {
          // Sin permiso para el portapapeles: el texto se puede seleccionar a mano
        }
      }}
    >
      <span aria-live="polite">{copiado ? 'Copiado' : 'Copiar'}</span>
    </button>
  )
}
