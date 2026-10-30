'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Search } from 'lucide-react'
import { enlaceLista } from '@/lib/crm/busqueda'
import { CAMPO, ICONO } from '@/components/crm/piezas'

// Busca mientras escribes (con una pausa corta) y filtra por etiqueta. Todo queda en la dirección: ?q=…&etiqueta=…
export function Buscador({ q, etiqueta, etiquetas }: { q: string; etiqueta: string; etiquetas: { etiqueta: string; total: number }[] }) {
  const router = useRouter()
  const [texto, setTexto] = useState(q)
  const [buscando, startTransition] = useTransition()
  const pedido = useRef(q.trim()) // la última búsqueda que mandó este campo
  const ir = (nuevo: { q: string; etiqueta: string }) => {
    pedido.current = nuevo.q.trim()
    startTransition(() => router.replace(enlaceLista(nuevo), { scroll: false }))
  }

  useEffect(() => {
    if (texto.trim() === q.trim()) return
    const espera = setTimeout(() => ir({ q: texto, etiqueta }), 350)
    return () => clearTimeout(espera)
  }, [texto])

  // Si la búsqueda cambió por otro lado («Ver todos»), el campo se pone al día (sin pisar lo que se está escribiendo)
  useEffect(() => {
    if (q.trim() === pedido.current) return
    pedido.current = q.trim()
    setTexto(q)
  }, [q])

  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault()
        ir({ q: texto, etiqueta })
      }}
      className="mb-4 flex flex-col gap-2 sm:flex-row"
    >
      <label className="relative min-w-0 flex-1">
        <span className="sr-only">Buscar contactos</span>
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg/40">
          {buscando ? <Loader2 size={15} {...ICONO} className="animate-spin" /> : <Search size={15} {...ICONO} />}
        </span>
        <input
          type="search"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Nombre, teléfono o correo"
          enterKeyHint="search"
          autoComplete="off"
          className={`${CAMPO} pl-9`}
        />
      </label>
      <label className="sm:w-60">
        <span className="sr-only">Filtrar por etiqueta</span>
        <select value={etiqueta} onChange={(e) => ir({ q: texto, etiqueta: e.target.value })} className={CAMPO}>
          <option value="">Todas las etiquetas</option>
          {etiqueta && !etiquetas.some((e) => e.etiqueta === etiqueta) && <option value={etiqueta}>{etiqueta}</option>}
          {etiquetas.map((e) => (
            <option key={e.etiqueta} value={e.etiqueta}>
              {e.etiqueta} ({e.total})
            </option>
          ))}
        </select>
      </label>
    </form>
  )
}
