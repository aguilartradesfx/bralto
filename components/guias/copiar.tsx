'use client'

import { useState } from 'react'

// Copia con el portapapeles moderno y, si el navegador no lo deja (algunos navegadores dentro de apps,
// como el WebView de Android que abre Instagram), con el método viejo de un textarea seleccionado
async function alPortapapeles(texto: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(texto)
    return true
  } catch {
    const area = document.createElement('textarea')
    area.value = texto
    area.setAttribute('readonly', '')
    area.style.cssText = 'position:fixed;top:0;left:0;opacity:0;font-size:16px' // 16 px: iOS no hace zoom
    document.body.appendChild(area)
    area.select()
    area.setSelectionRange(0, texto.length)
    let ok = false
    try {
      ok = document.execCommand('copy')
    } catch {
      ok = false
    }
    area.remove()
    return ok
  }
}

// Botón de copiar de cada comando o prompt de la guía
export function Copiar({ texto }: { texto: string }) {
  const [aviso, setAviso] = useState<'Copiado' | 'No se pudo' | null>(null)
  return (
    <button
      type="button"
      className="gu-copiar"
      onClick={async () => {
        setAviso((await alPortapapeles(texto)) ? 'Copiado' : 'No se pudo')
        setTimeout(() => setAviso(null), 2000)
      }}
    >
      <span aria-live="polite">{aviso ?? 'Copiar'}</span>
    </button>
  )
}
