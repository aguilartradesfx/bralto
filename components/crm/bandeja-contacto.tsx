'use client'

import Link from 'next/link'
import { ArrowUpRight, Bot, Building2, Columns3, ListTodo, Mail, Phone, Tag, UserPlus, type LucideIcon } from 'lucide-react'
import { telefonoLegible } from '@/lib/crm/telefono'
import type { ModoKnox } from '@/lib/knox/conversar/tipos'
import { cuandoVuelve, estadoKnox, RED_LABEL, TIPO_LABEL, type ConversacionDetalle } from '@/lib/crm/bandeja/vista'
import { Aviso, CanalIcono, Etiqueta, ICONO } from '@/components/crm/piezas'
import { FotoPersona } from '@/components/crm/foto'
import { useEnvio } from '@/components/crm/usar-envio'

// Al lado del chat (en pantallas anchas): quién es, qué hace Knox ahí y lo que hay de esa persona en el CRM (datos,
// etiquetas, oportunidades y tareas), para contestar sin ir a la ficha

const dinero = new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })

function textoKnox(c: ConversacionDetalle, modo: ModoKnox, ahora: string): string {
  const k = estadoKnox(c.knoxPausadoHasta, new Date(ahora))
  if (modo === 'apagado') return 'Knox está apagado para todo. Lo prendes en la pestaña Knox.'
  if (k.activo) return modo === 'automatico' ? 'Knox lee y contesta solo aquí.' : 'Knox lee y te deja respuestas aquí.'
  if (k.siempre) return 'Knox no se mete en esta conversación.'
  return `Le contestaste tú: Knox vuelve ${cuandoVuelve(k.hasta ?? ahora, new Date(ahora))}.`
}

export function PanelContacto({
  c,
  modo,
  ahora,
  onCambio,
  className = '',
}: {
  c: ConversacionDetalle
  modo: ModoKnox
  ahora: string
  onCambio: () => Promise<void>
  className?: string
}) {
  const { enviar, ocupado, error } = useEnvio()
  const p = c.contacto
  const detalle = c.usuario ? `@${c.usuario}` : c.telefono ? telefonoLegible(c.telefono) : null

  const guardar = async () => {
    if (await enviar(`/api/crm/mensajes/${c.id}/contacto`, 'POST', {}, { refrescar: false })) await onCambio()
  }

  return (
    <aside
      aria-label="Lo que hay de esta persona"
      className={`min-h-0 flex-col overflow-hidden rounded-[20px] bg-[var(--pn-card)] shadow-[inset_0_0_0_1px_var(--pn-line),var(--pn-shadow)] ${className}`}
    >
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-5">
        <div className="flex flex-col items-center text-center">
          <FotoPersona nombre={c.nombre} foto={c.foto} canal={c.canal} grande />
          <p className="mt-3 break-words text-base font-semibold leading-tight tracking-tight text-fg">{p?.nombre || c.nombre}</p>
          <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-fg/50">
            <CanalIcono canal={c.canal} size={12} />
            {[RED_LABEL[c.canal], detalle].filter(Boolean).join(' · ')}
          </p>
          {c.tipo && <span className="mt-2 rounded-full bg-fg/[0.07] px-2.5 py-0.5 text-[11px] font-medium text-fg/70">{TIPO_LABEL[c.tipo]}</span>}
        </div>

        <Bloque titulo="Knox" icono={Bot}>
          <p className="text-[12.5px] leading-snug text-fg/65">{textoKnox(c, modo, ahora)}</p>
        </Bloque>

        {p ? (
          <>
            {(p.telefono || p.correo || p.empresa) && (
              <dl className="mt-5 space-y-2.5 text-[12.5px]">
                {p.telefono && (
                  <Dato etiqueta="Teléfono" icono={Phone}>
                    <a href={`tel:${p.telefono}`} className="hover:underline">
                      {telefonoLegible(p.telefono)}
                    </a>
                  </Dato>
                )}
                {p.correo && (
                  <Dato etiqueta="Correo" icono={Mail}>
                    <a href={`mailto:${p.correo}`} className="break-all hover:underline">
                      {p.correo}
                    </a>
                  </Dato>
                )}
                {p.empresa && (
                  <Dato etiqueta="Empresa" icono={Building2}>
                    {p.empresa}
                  </Dato>
                )}
              </dl>
            )}

            {p.etiquetas.length > 0 && (
              <Bloque titulo="Etiquetas" icono={Tag}>
                <div className="flex flex-wrap gap-1">
                  {p.etiquetas.slice(0, 12).map((t) => (
                    <Etiqueta key={t}>{t}</Etiqueta>
                  ))}
                  {p.etiquetas.length > 12 && <Etiqueta>+{p.etiquetas.length - 12}</Etiqueta>}
                </div>
              </Bloque>
            )}

            <Bloque titulo="Pipeline" icono={Columns3}>
              {p.oportunidades.length > 0 ? (
                <ul className="space-y-1.5">
                  {p.oportunidades.map((o) => (
                    <li key={o.id} className="rounded-xl bg-fg/[0.04] px-3 py-2">
                      <p className="truncate text-[12.5px] font-medium text-fg">{o.nombre}</p>
                      <p className="mt-0.5 truncate text-[11.5px] text-fg/50">{[o.etapa, o.valor ? dinero.format(o.valor) : null].filter(Boolean).join(' · ') || 'Abierta'}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[12px] text-fg/40">Sin oportunidades abiertas.</p>
              )}
            </Bloque>

            <Bloque titulo="Tareas" icono={ListTodo}>
              <p className="text-[12.5px] text-fg/65">{p.tareas === 0 ? 'Nada pendiente.' : p.tareas === 1 ? '1 tarea pendiente' : `${p.tareas} tareas pendientes`}</p>
            </Bloque>
          </>
        ) : (
          <Bloque titulo="Contacto" icono={UserPlus}>
            <p className="text-[12.5px] leading-snug text-fg/55">Todavía no está en tus contactos. Guárdala para darle seguimiento en el pipeline.</p>
          </Bloque>
        )}
        {error && (
          <div className="mt-3">
            <Aviso>{error.texto}</Aviso>
          </div>
        )}
      </div>

      <div className="shrink-0 border-t border-fg/[0.06] p-3">
        {p ? (
          <Link href={`/crm/${p.id}`} className="pn-btn-glass inline-flex h-10 w-full items-center justify-center gap-1.5 text-[13px] font-medium">
            Abrir la ficha completa
            <ArrowUpRight size={15} {...ICONO} />
          </Link>
        ) : (
          <button type="button" onClick={() => void guardar()} disabled={ocupado} className="pn-btn-solid inline-flex h-10 w-full items-center justify-center gap-1.5 text-[13px] font-semibold disabled:opacity-40">
            <UserPlus size={15} {...ICONO} />
            {ocupado ? 'Guardando…' : 'Guardar como contacto'}
          </button>
        )}
      </div>
    </aside>
  )
}

function Dato({ etiqueta, icono: Icono, children }: { etiqueta: string; icono: LucideIcon; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <dt className="flex w-[84px] shrink-0 items-center gap-1.5 text-fg/40">
        <Icono size={13} {...ICONO} />
        {etiqueta}
      </dt>
      <dd className="min-w-0 flex-1 text-fg/75">{children}</dd>
    </div>
  )
}

function Bloque({ titulo, icono: Icono, children }: { titulo: string; icono: LucideIcon; children: React.ReactNode }) {
  return (
    <section className="mt-5">
      <h3 className="mb-2 flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-fg/45">
        <Icono size={13} {...ICONO} />
        {titulo}
      </h3>
      {children}
    </section>
  )
}
