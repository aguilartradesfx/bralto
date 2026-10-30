'use client'

import { useId, useState } from 'react'
import { X } from 'lucide-react'
import { CAMPO, ICONO } from '@/components/crm/piezas'

// Etiquetas: se escribe una y se agrega con Enter o coma; la × la quita. Sugiere las que ya existen
export function CampoEtiquetas({
  valor,
  onChange,
  sugerencias,
  disabled,
}: {
  valor: string[]
  onChange: (etiquetas: string[]) => void
  sugerencias: string[]
  disabled?: boolean
}) {
  const [texto, setTexto] = useState('')
  const lista = useId()

  function agregar(crudo: string) {
    const nuevas = crudo
      .split(',')
      .map((t) => t.trim().toLowerCase().replace(/\s+/g, ' '))
      .filter((t) => t && !valor.includes(t))
    if (nuevas.length) onChange([...valor, ...new Set(nuevas)])
    setTexto('')
  }

  return (
    <div>
      {valor.length > 0 && (
        <ul className="mb-2 flex flex-wrap gap-1.5">
          {valor.map((e) => (
            <li key={e} className="inline-flex items-center gap-1 rounded-full bg-fg/[0.07] py-0.5 pl-2.5 pr-1 text-xs text-fg/80">
              {e}
              <button
                type="button"
                disabled={disabled}
                onClick={() => onChange(valor.filter((x) => x !== e))}
                aria-label={`Quitar la etiqueta ${e}`}
                className="grid h-5 w-5 place-items-center rounded-full text-fg/50 hover:bg-fg/[0.08] hover:text-fg"
              >
                <X size={11} {...ICONO} />
              </button>
            </li>
          ))}
        </ul>
      )}
      <input
        value={texto}
        disabled={disabled}
        list={lista}
        onChange={(e) => {
          if (e.target.value.includes(',')) agregar(e.target.value)
          else setTexto(e.target.value)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            agregar(texto)
          }
        }}
        onBlur={() => texto.trim() && agregar(texto)}
        placeholder={valor.length ? 'Agregar otra' : 'Escribe una y toca Enter'}
        enterKeyHint="done"
        className={CAMPO}
      />
      <datalist id={lista}>
        {sugerencias
          .filter((s) => !valor.includes(s))
          .map((s) => (
            <option key={s} value={s} />
          ))}
      </datalist>
    </div>
  )
}
