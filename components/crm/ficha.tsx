'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, BellOff, Handshake, ListTodo, Mail, MessageCircle, MessagesSquare, Phone, StickyNote, UserRound, type LucideIcon } from 'lucide-react'
import { haceCuanto } from '@/lib/crm/fechas'
import { enlaceLlamada, enlaceWhatsApp } from '@/lib/crm/telefono'
import { nombreVisible } from '@/lib/crm/tipos'
import type { Ficha } from '@/lib/crm/vista'
import { Archivos, Citas, Datos, MasDatos } from '@/components/crm/ficha-datos'
import { Notas } from '@/components/crm/ficha-notas'
import { Tareas } from '@/components/crm/ficha-tareas'
import { Ventas } from '@/components/crm/ficha-ventas'
import { Historial } from '@/components/crm/historial'
import { Avatar, Etiqueta, ICONO } from '@/components/crm/piezas'

type Pestaña = 'historial' | 'notas' | 'tareas' | 'ventas' | 'datos'

const PESTAÑAS: { id: Pestaña; label: string; icono: LucideIcon }[] = [
  { id: 'historial', label: 'Historial', icono: MessagesSquare },
  { id: 'notas', label: 'Notas', icono: StickyNote },
  { id: 'tareas', label: 'Tareas', icono: ListTodo },
  { id: 'ventas', label: 'Ventas', icono: Handshake },
  { id: 'datos', label: 'Datos', icono: UserRound },
]

// La ficha de un contacto. En el teléfono, una pestaña a la vez; desde lg, el historial a la izquierda y lo demás a
// la derecha, todo a la vista
export function FichaContacto({ ficha, etiquetas, ahora }: { ficha: Ficha; etiquetas: string[]; ahora: string }) {
  const [pestaña, setPestaña] = useState<Pestaña>('historial')
  const c = ficha.contacto
  const nombre = nombreVisible(c)
  const cuentas: Partial<Record<Pestaña, number>> = {
    notas: ficha.notas.length,
    tareas: ficha.tareas.filter((t) => !t.hecha).length,
    ventas: ficha.oportunidades.filter((o) => o.estado === 'abierta').length,
  }
  const visible = (p: Pestaña) => `${pestaña === p ? 'block' : 'hidden'} lg:block`

  return (
    <div className="max-w-6xl p-4 md:p-6 lg:p-8">
      <Link href="/crm" className="mb-5 inline-flex items-center gap-1.5 text-sm text-fg/55 transition-colors hover:text-fg">
        <ArrowLeft size={14} {...ICONO} />
        Contactos
      </Link>

      <Cabecera ficha={ficha} nombre={nombre} ahora={ahora} />

      <div role="tablist" aria-label="Partes de la ficha" className="pn-glass mt-4 grid grid-cols-5 gap-1 rounded-[16px] p-1 lg:hidden">
        {PESTAÑAS.map(({ id, label, icono: Icono }) => {
          const on = pestaña === id
          return (
            <button
              key={id}
              type="button"
              role="tab"
              id={`pestana-${id}`}
              aria-selected={on}
              aria-controls={`panel-${id}`}
              onClick={() => setPestaña(id)}
              className={`flex min-w-0 flex-col items-center gap-1 rounded-[12px] px-1 py-2 text-[11px] font-medium transition-colors ${on ? 'pn-chip-on text-fg' : 'text-fg/50 hover:text-fg'}`}
            >
              <Icono size={16} {...ICONO} />
              <span className="max-w-full truncate">
                {label}
                {cuentas[id] ? <span className="ml-0.5 tabular-nums text-fg/40"> {cuentas[id]}</span> : null}
              </span>
            </button>
          )
        })}
      </div>

      <div className="mt-4 lg:mt-6 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,400px)] lg:items-start lg:gap-6">
        <div id="panel-historial" role="tabpanel" aria-labelledby="pestana-historial" className={visible('historial')}>
          <Historial contactoId={c.id} inicial={ficha.historial} ahora={ahora} />
        </div>
        <div className="flex flex-col gap-4">
          <div id="panel-ventas" role="tabpanel" aria-labelledby="pestana-ventas" className={visible('ventas')}>
            <Ventas contactoId={c.id} nombreContacto={nombre} oportunidades={ficha.oportunidades} pipelines={ficha.pipelines} />
          </div>
          <div id="panel-tareas" role="tabpanel" aria-labelledby="pestana-tareas" className={visible('tareas')}>
            <Tareas contactoId={c.id} tareas={ficha.tareas} ahora={ahora} />
          </div>
          <div id="panel-notas" role="tabpanel" aria-labelledby="pestana-notas" className={visible('notas')}>
            <Notas contactoId={c.id} notas={ficha.notas} ahora={ahora} />
          </div>
          <div id="panel-datos" role="tabpanel" aria-labelledby="pestana-datos" className={`${visible('datos')} space-y-4`}>
            <Datos contacto={c} etiquetas={etiquetas} ahora={ahora} />
            <Citas citas={ficha.citas} ahora={ahora} />
            <Archivos adjuntos={ficha.adjuntos} ahora={ahora} />
            <MasDatos campos={c.campos} />
          </div>
        </div>
      </div>
    </div>
  )
}

function Cabecera({ ficha, nombre, ahora }: { ficha: Ficha; nombre: string; ahora: string }) {
  const c = ficha.contacto
  const acciones = [
    c.telefono && { href: enlaceLlamada(c.telefono), label: 'Llamar', icono: Phone, nueva: false },
    c.telefono && { href: enlaceWhatsApp(c.telefono), label: 'WhatsApp', icono: MessageCircle, nueva: true },
    c.correo && { href: `mailto:${c.correo}`, label: 'Correo', icono: Mail, nueva: false },
  ].filter(Boolean) as { href: string; label: string; icono: LucideIcon; nueva: boolean }[]

  return (
    <section className="pn-glass rounded-[20px] p-5">
      <div className="flex items-start gap-4">
        <Avatar nombre={nombre} grande />
        <div className="min-w-0 flex-1">
          <h1 className="break-words text-xl font-semibold tracking-tight text-fg">{nombre}</h1>
          {c.empresa && <p className="break-words text-sm text-fg/55">{c.empresa}</p>}
          {c.etiquetas.length > 0 && (
            <p className="mt-2 flex flex-wrap gap-1.5">
              {c.etiquetas.map((e) => (
                <Etiqueta key={e}>{e}</Etiqueta>
              ))}
            </p>
          )}
          <p className="mt-2 text-xs text-fg/45">Última actividad: {haceCuanto(c.ultima_actividad, new Date(ahora))}</p>
          {c.no_molestar && (
            <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-amber-300">
              <BellOff size={12} {...ICONO} />
              Pidió no recibir mensajes
            </p>
          )}
        </div>
      </div>
      {acciones.length > 0 && (
        <div className={`mt-4 grid gap-2 ${acciones.length === 3 ? 'grid-cols-3' : acciones.length === 2 ? 'grid-cols-2' : 'grid-cols-1'} sm:flex sm:flex-wrap`}>
          {acciones.map(({ href, label, icono: Icono, nueva }) => (
            <a
              key={label}
              href={href}
              {...(nueva ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              className="flex min-w-0 flex-col items-center justify-center gap-1 rounded-[14px] bg-fg/[0.05] px-2 py-2.5 text-xs font-medium text-fg ring-1 ring-inset ring-fg/[0.08] transition-colors hover:bg-fg/[0.09] sm:flex-row sm:gap-1.5 sm:px-4 sm:py-2 sm:text-sm"
            >
              <Icono size={16} {...ICONO} className="shrink-0" />
              <span className="max-w-full truncate">{label}</span>
            </a>
          ))}
        </div>
      )}
    </section>
  )
}
