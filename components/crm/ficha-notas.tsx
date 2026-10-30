'use client'

import { useState } from 'react'
import { Pin } from 'lucide-react'
import { fechaHora } from '@/lib/crm/fechas'
import { esLargo } from '@/lib/crm/historial'
import type { NotaVista } from '@/lib/crm/vista'
import { Aviso, Boton, CAMPO, ICONO, Seccion } from '@/components/crm/piezas'
import { useEnvio } from '@/components/crm/usar-envio'

// Notas del contacto: escribir una nueva arriba y las de antes debajo (las fijadas primero)
export function Notas({ contactoId, notas, ahora }: { contactoId: string; notas: NotaVista[]; ahora: string }) {
  const { enviar, ocupado, error } = useEnvio()
  const [texto, setTexto] = useState('')

  async function guardar(e: React.FormEvent) {
    e.preventDefault()
    if (await enviar(`/api/crm/contactos/${contactoId}/notas`, 'POST', { texto })) setTexto('')
  }

  return (
    <Seccion titulo="Notas" cuenta={notas.length}>
      <form onSubmit={guardar} className="space-y-2">
        <label className="block">
          <span className="sr-only">Nota nueva</span>
          <textarea
            rows={3}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            disabled={ocupado}
            placeholder="Escribe una nota…"
            className={`${CAMPO} leading-relaxed`}
          />
        </label>
        {error && <Aviso>{error.texto}</Aviso>}
        <Boton principal type="submit" disabled={ocupado || !texto.trim()}>
          {ocupado ? 'Guardando…' : 'Guardar nota'}
        </Boton>
      </form>
      {notas.length === 0 ? (
        <p className="mt-4 text-sm text-fg/45">Todavía no hay notas.</p>
      ) : (
        <ul className="mt-4 divide-y divide-fg/[0.06]">
          {notas.map((n) => (
            <Nota key={n.id} n={n} ahora={ahora} />
          ))}
        </ul>
      )}
    </Seccion>
  )
}

function Nota({ n, ahora }: { n: NotaVista; ahora: string }) {
  const [abierta, setAbierta] = useState(false)
  const larga = esLargo(n.texto)
  return (
    <li className="py-3">
      <p className="mb-1 flex flex-wrap items-center gap-x-2 text-[11px] text-fg/40">
        {n.fijada && (
          <span className="inline-flex items-center gap-1 text-fg/60">
            <Pin size={11} {...ICONO} />
            Fijada
          </span>
        )}
        <span className="tabular-nums">{fechaHora(n.creado_en, new Date(ahora))}</span>
        {n.autor && <span>· {n.autor}</span>}
      </p>
      <p className={`whitespace-pre-wrap break-words text-sm leading-relaxed text-fg/85 ${larga && !abierta ? 'line-clamp-6' : ''}`}>{n.texto}</p>
      {larga && (
        <button type="button" onClick={() => setAbierta(!abierta)} className="mt-1 text-xs font-medium text-fg/60 underline-offset-2 hover:text-fg hover:underline">
          {abierta ? 'Ver menos' : 'Ver todo'}
        </button>
      )}
    </li>
  )
}
