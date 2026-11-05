'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowUpRight, CalendarDays, Mail, MessageCircle, MessageSquare, NotebookPen, PanelRightClose, Phone, PhoneIncoming, PhoneOutgoing, type LucideIcon } from 'lucide-react'
import { fechaHora } from '@/lib/crm/fechas'
import { textoLlamada } from '@/lib/crm/historial'
import { CANAL_LABEL, ESTADO_CITA_LABEL, type EstadoCita } from '@/lib/crm/tipos'
import type { Ficha, MensajeVista } from '@/lib/crm/vista'
import { enlaceLlamada, enlaceWhatsApp } from '@/lib/crm/telefono'
import type { Tono } from '@/lib/panel/inicio/calculos'
import { Avatar, CanalIcono, Etiqueta, ICONO } from '@/components/crm/piezas'
import { Pildora } from '@/components/internal/inicio/graficas'

type Tipo = 'mensaje' | 'correo' | 'llamada' | 'nota' | 'cita'

interface Evento {
  id: string
  tipo: Tipo
  en: string
  quien: string
  accion: string
  con?: string
  asunto?: string | null
  texto: string | null
  estado?: { tono: Tono; label: string }
  icono: LucideIcon
}

const PESTAÑAS: { id: Tipo | 'todo'; label: string }[] = [
  { id: 'todo', label: 'Todo' },
  { id: 'mensaje', label: 'Mensajes' },
  { id: 'correo', label: 'Correos' },
  { id: 'llamada', label: 'Llamadas' },
  { id: 'nota', label: 'Notas' },
  { id: 'cita', label: 'Citas' },
]

const TONO_CITA: Record<EstadoCita, Tono> = { nueva: 'gris', confirmada: 'azul', asistio: 'verde', no_asistio: 'rojo', cancelada: 'rojo' }

// Quién mandó lo que salió: Knox, tú, una automatización o (lo viejo de GoHighLevel) Bralto
function deQuienSale(m: MensajeVista): string {
  if (m.autor === 'knox') return 'Knox'
  if (m.autor === 'ale') return 'Tú'
  if (m.autor === 'automatizacion' || m.autor === 'sistema') return 'Automatización'
  return 'Bralto'
}

function eventos(ficha: Ficha, nombre: string): Evento[] {
  const lista: Evento[] = []
  for (const m of ficha.historial.mensajes) {
    if (m.tipo === 'actividad') continue
    const entra = m.direccion === 'entrante'
    if (m.tipo === 'llamada') {
      lista.push({ id: m.id, tipo: 'llamada', en: m.enviado_en, quien: entra ? nombre : deQuienSale(m), accion: entra ? 'llamó' : 'llamó a', con: entra ? undefined : nombre, texto: textoLlamada(m.direccion, m.llamada), icono: entra ? PhoneIncoming : PhoneOutgoing })
      continue
    }
    const tipo: Tipo = m.tipo === 'correo' ? 'correo' : 'mensaje'
    lista.push({
      id: m.id,
      tipo,
      en: m.enviado_en,
      quien: entra ? nombre : deQuienSale(m),
      accion: entra ? `escribió por ${CANAL_LABEL[m.canal]}` : `respondió por ${CANAL_LABEL[m.canal]}`,
      asunto: m.asunto,
      texto: m.texto ?? (m.adjunto ? `(${m.adjunto})` : m.adjuntos.length ? '(archivo)' : 'Mensaje sin texto'),
      icono: tipo === 'correo' ? Mail : MessageSquare,
    })
  }
  for (const n of ficha.notas) lista.push({ id: n.id, tipo: 'nota', en: n.creado_en, quien: n.autor ?? 'Alguien', accion: 'dejó una nota', texto: n.texto, icono: NotebookPen })
  for (const c of ficha.citas)
    lista.push({ id: c.id, tipo: 'cita', en: c.inicio, quien: nombre, accion: 'tiene cita', asunto: c.titulo, texto: c.notas, estado: { tono: TONO_CITA[c.estado], label: ESTADO_CITA_LABEL[c.estado] }, icono: CalendarDays })
  return lista.sort((a, b) => Date.parse(b.en) - Date.parse(a.en))
}

// El contacto abierto, a la derecha: quién es, cómo escribirle y todo lo que ha pasado con esa persona
export function PanelContacto({ ficha, etapa, cerrar, ahora, children }: { ficha: Ficha; etapa: { nombre: string; tono: Tono } | null; cerrar: string; ahora: string; children?: React.ReactNode }) {
  const c = ficha.contacto
  const nombre = [c.nombre, c.apellido].filter(Boolean).join(' ').trim() || c.telefono || c.correo || 'Sin nombre'
  const [pestaña, setPestaña] = useState<Tipo | 'todo'>('todo')
  const todos = useMemo(() => eventos(ficha, nombre.split(' ')[0]), [ficha, nombre])
  const cuenta = (t: Tipo | 'todo') => (t === 'todo' ? todos.length : todos.filter((e) => e.tipo === t).length)
  const visibles = pestaña === 'todo' ? todos : todos.filter((e) => e.tipo === pestaña)
  const hoy = new Date(ahora)

  const acciones = [
    c.telefono && { href: enlaceLlamada(c.telefono), label: 'Llamar', icono: Phone, nueva: false },
    c.telefono && { href: enlaceWhatsApp(c.telefono), label: 'WhatsApp', icono: MessageCircle, nueva: true },
    c.correo && { href: `mailto:${c.correo}`, label: 'Correo', icono: Mail, nueva: false },
  ].filter(Boolean) as { href: string; label: string; icono: LucideIcon; nueva: boolean }[]

  return (
    // En el teléfono se abre encima de la lista, a pantalla completa; en la compu, al lado y fijo al bajar
    <aside
      aria-label={`Contacto: ${nombre}`}
      className="pn-glass pn-rise pn-scroll max-lg:fixed max-lg:inset-0 max-lg:z-50 max-lg:overflow-y-auto max-lg:rounded-none lg:sticky lg:top-[80px] lg:max-h-[calc(100dvh-96px)] lg:overflow-y-auto lg:rounded-[14px]"
    >
      <div className="border-b border-fg/[0.07] p-5">
        <div className="flex items-start gap-3">
          <Link href={cerrar} scroll={false} className="pn-icon-btn !h-8 !w-8 shrink-0" aria-label="Cerrar el contacto" title="Cerrar">
            <PanelRightClose size={15} {...ICONO} />
          </Link>
          <Avatar nombre={nombre} />
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-[15px] font-medium text-fg">{nombre}</h2>
            <p className="truncate text-[12.5px] text-fg/45">{c.empresa ?? c.telefono ?? c.correo ?? 'Sin datos de contacto'}</p>
          </div>
          <Link href={`/crm/${c.id}`} className="pn-btn-glass inline-flex shrink-0 items-center gap-1 px-2.5 py-1.5 text-[12.5px]">
            Ficha
            <ArrowUpRight size={13} {...ICONO} />
          </Link>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-1.5 pl-[84px]">
          {etapa && <Pildora tono={etapa.tono}>{etapa.nombre}</Pildora>}
          {ficha.conversaciones.slice(0, 2).map((cv) => (
            <span key={cv.id} className="pn-pill">
              <CanalIcono canal={cv.canal} size={12} />
              {CANAL_LABEL[cv.canal]}
            </span>
          ))}
          {c.etiquetas.slice(0, 3).map((e) => (
            <Etiqueta key={e}>{e}</Etiqueta>
          ))}
        </div>
        {acciones.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5 pl-[84px]">
            {acciones.map(({ href, label, icono: Icono, nueva }) => (
              <a key={label} href={href} {...(nueva ? { target: '_blank', rel: 'noopener noreferrer' } : {})} className="pn-btn-glass inline-flex items-center gap-1.5 px-3 py-1.5 text-[12.5px]">
                {label}
                <Icono size={13} {...ICONO} />
              </a>
            ))}
          </div>
        )}
      </div>

      {children && <div className="border-b border-fg/[0.07] p-5">{children}</div>}

      <div className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-[14px] font-medium text-fg">Historial</h3>
          {ficha.conversaciones[0] && (
            <Link href={`/crm/mensajes/${ficha.conversaciones[0].id}`} className="pn-btn-glass inline-flex items-center gap-1 px-2.5 py-1.5 text-[12.5px]">
              Contestar
              <ArrowUpRight size={13} {...ICONO} />
            </Link>
          )}
        </div>
        <div className="pn-tabs mt-3 max-w-full overflow-x-auto [scrollbar-width:none]" role="tablist" aria-label="Qué ver">
          {PESTAÑAS.filter((p) => p.id === 'todo' || cuenta(p.id) > 0).map((p) => (
            <button key={p.id} type="button" role="tab" aria-selected={pestaña === p.id} onClick={() => setPestaña(p.id)} className="pn-tab">
              {p.label}
              <span className="ml-1.5 tabular-nums text-fg/35">{cuenta(p.id)}</span>
            </button>
          ))}
        </div>

        {visibles.length === 0 ? (
          <p className="py-10 text-center text-sm text-fg/45">Todavía no hay nada con {nombre.split(' ')[0]}.</p>
        ) : (
          <ol className="relative mt-5 space-y-5 before:absolute before:bottom-2 before:left-[13px] before:top-2 before:w-px before:bg-fg/[0.08]">
            {visibles.map((e) => (
              <li key={`${e.tipo}-${e.id}`} className="relative grid grid-cols-[28px_minmax(0,1fr)] gap-3">
                <span className={`relative z-[1] grid h-7 w-7 place-items-center rounded-[8px] ring-4 ring-[var(--pn-card)] ${e.tipo === 'nota' ? 'bg-[var(--pn-accent-soft)] text-[var(--pn-accent-ink)]' : 'bg-[var(--pn-raise-2)] text-fg/65'}`}>
                  <e.icono size={13} {...ICONO} />
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                    <p className="text-[12.5px] text-fg/50">
                      <span className="pn-pill !py-0 !text-[12px] text-fg">{e.quien}</span> {e.accion}
                      {e.con && (
                        <>
                          {' '}
                          <span className="pn-pill !py-0 !text-[12px] text-fg">{e.con}</span>
                        </>
                      )}
                    </p>
                    <time dateTime={e.en} className="shrink-0 text-[11.5px] tabular-nums text-fg/35">
                      {fechaHora(e.en, hoy)}
                    </time>
                  </div>
                  {(e.asunto || e.texto) && (
                    <dl className="mt-2 grid grid-cols-[64px_minmax(0,1fr)] gap-x-3 gap-y-1 text-[12.5px]">
                      {e.asunto && (
                        <>
                          <dt className="text-fg/40">{e.tipo === 'cita' ? 'Cita' : 'Asunto'}</dt>
                          <dd className="text-fg/80">{e.asunto}</dd>
                        </>
                      )}
                      {e.texto && (
                        <>
                          <dt className="text-fg/40">{e.tipo === 'nota' ? 'Nota' : e.tipo === 'llamada' ? 'Llamada' : e.tipo === 'cita' ? 'Notas' : 'Mensaje'}</dt>
                          <dd className="line-clamp-4 whitespace-pre-line break-words text-fg/75">{e.texto}</dd>
                        </>
                      )}
                    </dl>
                  )}
                  {e.estado && (
                    <p className="mt-2">
                      <Pildora tono={e.estado.tono}>{e.estado.label}</Pildora>
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        )}
        {ficha.historial.siguiente && (
          <Link href={`/crm/${c.id}`} className="mt-6 flex items-center justify-center gap-1 text-[12.5px] text-fg/55 hover:text-fg">
            Ver todo el historial en la ficha
            <ArrowUpRight size={13} {...ICONO} />
          </Link>
        )}
      </div>
    </aside>
  )
}
