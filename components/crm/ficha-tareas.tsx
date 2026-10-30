'use client'

import { useState } from 'react'
import type { TareaVista } from '@/lib/crm/vista'
import { Aviso, Boton, CAMPO, Seccion } from '@/components/crm/piezas'
import { FilaTarea } from '@/components/crm/tarea'
import { useEnvio } from '@/components/crm/usar-envio'

// Tareas del contacto: agregar una (con fecha si quieres) y marcarlas hechas. Las hechas van al final
export function Tareas({ contactoId, tareas, ahora }: { contactoId: string; tareas: TareaVista[]; ahora: string }) {
  const { enviar, ocupado, error } = useEnvio()
  const [titulo, setTitulo] = useState('')
  const [vence, setVence] = useState('')
  const pendientes = tareas.filter((t) => !t.hecha)
  const hechas = tareas.filter((t) => t.hecha)

  async function agregar(e: React.FormEvent) {
    e.preventDefault()
    if (await enviar(`/api/crm/contactos/${contactoId}/tareas`, 'POST', { titulo, vence })) {
      setTitulo('')
      setVence('')
    }
  }

  return (
    <Seccion titulo="Tareas" cuenta={pendientes.length}>
      <form onSubmit={agregar} className="space-y-2">
        <label className="block">
          <span className="sr-only">Qué hay que hacer</span>
          <input value={titulo} onChange={(e) => setTitulo(e.target.value)} disabled={ocupado} placeholder="¿Qué hay que hacer?" className={CAMPO} />
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex min-w-0 flex-1 items-center gap-2 text-xs text-fg/45">
            <span className="shrink-0">Para el</span>
            <input type="date" value={vence} onChange={(e) => setVence(e.target.value)} disabled={ocupado} className={`${CAMPO} min-w-0`} />
          </label>
          <Boton principal type="submit" disabled={ocupado || !titulo.trim()}>
            {ocupado ? 'Agregando…' : 'Agregar'}
          </Boton>
        </div>
        {error && <Aviso>{error.texto}</Aviso>}
      </form>
      {tareas.length === 0 ? (
        <p className="mt-4 text-sm text-fg/45">No hay tareas con esta persona.</p>
      ) : (
        <ul className="mt-3 divide-y divide-fg/[0.06]">
          {[...pendientes, ...hechas].map((t) => (
            <FilaTarea key={`${t.id}:${t.hecha}`} t={t} ahora={ahora} />
          ))}
        </ul>
      )}
    </Seccion>
  )
}
