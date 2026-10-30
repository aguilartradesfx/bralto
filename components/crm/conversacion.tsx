'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  AlertTriangle,
  ArrowLeft,
  Bot,
  FileText,
  Image as ImagenIcono,
  MapPin,
  Music,
  Paperclip,
  Send,
  Share2,
  Smile,
  UserPlus,
  UserRound,
  Video,
  type LucideIcon,
} from 'lucide-react'
import { diaCR, horaCR } from '@/lib/calendario/fechas'
import { nombreDelDia } from '@/lib/crm/historial'
import { telefonoLegible } from '@/lib/crm/telefono'
import { CANAL_LABEL } from '@/lib/crm/tipos'
import type { ModoKnox } from '@/lib/knox/conversar/tipos'
import { adjuntoLabel, AUTOR_LABEL, cuandoVuelve, estadoKnox, textoHistoria, TIPO_LABEL, type ConversacionDetalle, type MensajeHilo, type PendienteDetalle } from '@/lib/crm/bandeja/vista'
import { Aviso, CAMPO, CanalIcono, ICONO } from '@/components/crm/piezas'
import { FotoPersona } from '@/components/crm/foto'
import { useEnvio } from '@/components/crm/usar-envio'

const REFRESCO_MS = 15_000

// Una clave por envío: si se corta la conexión y se vuelve a tocar «Enviar» con el mismo texto, Zernio no lo repite
function nuevaClave(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`
}

// Una conversación de la bandeja: el hilo, la respuesta que dejó Knox y la caja para contestar como Ale
export function Conversacion({ c, modo, ahora }: { c: ConversacionDetalle; modo: ModoKnox; ahora: string }) {
  const router = useRouter()
  const [texto, setTexto] = useState('')
  const intento = useRef<{ texto: string; clave: string } | null>(null)
  const caja = useRef<HTMLTextAreaElement>(null)
  const fin = useRef<HTMLDivElement>(null)
  const { enviar, ocupado, error } = useEnvio()
  const cuantos = useRef(c.mensajes.length)

  // Al abrir, lo más nuevo a la vista (como en el teléfono)
  useEffect(() => {
    fin.current?.scrollIntoView({ block: 'end' })
  }, [])

  // Si llega un mensaje nuevo y estabas abajo, baja con él
  useEffect(() => {
    if (c.mensajes.length > cuantos.current) {
      const abajo = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 400
      if (abajo) fin.current?.scrollIntoView({ block: 'end', behavior: 'smooth' })
    }
    cuantos.current = c.mensajes.length
  }, [c.mensajes.length])

  // Los mensajes nuevos aparecen solos mientras la tienes abierta
  useEffect(() => {
    const t = setInterval(() => {
      if (document.visibilityState === 'visible') router.refresh()
    }, REFRESCO_MS)
    return () => clearInterval(t)
  }, [router])

  async function mandar(e: React.FormEvent) {
    e.preventDefault()
    const t = texto.trim()
    if (!t) return
    if (!intento.current || intento.current.texto !== t) intento.current = { texto: t, clave: nuevaClave() }
    if (await enviar(`/api/crm/mensajes/${c.id}/enviar`, 'POST', { texto: t, clave: intento.current.clave })) {
      setTexto('')
      intento.current = null
      requestAnimationFrame(() => fin.current?.scrollIntoView({ block: 'end', behavior: 'smooth' }))
    }
  }

  function editar(respuesta: string) {
    setTexto(respuesta)
    requestAnimationFrame(() => {
      caja.current?.focus()
      caja.current?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    })
  }

  return (
    <div className="max-w-3xl p-4 md:p-6 lg:p-8">
      <Link href="/crm/mensajes" className="mb-4 inline-flex items-center gap-1.5 text-sm text-fg/55 transition-colors hover:text-fg">
        <ArrowLeft size={14} {...ICONO} />
        Mensajes
      </Link>

      <Cabecera c={c} modo={modo} ahora={ahora} />

      <section aria-label="Conversación" className="mt-4">
        {c.hayMas && <p className="mb-3 text-center text-[11px] text-fg/40">Aquí se ven los últimos 100 mensajes.</p>}
        <Hilo mensajes={c.mensajes} nombre={c.nombre} ahora={ahora} />
      </section>

      <div ref={fin} className="mt-4 space-y-3">
        {c.pendiente && <TarjetaKnox p={c.pendiente} onEditar={editar} />}

        <form onSubmit={mandar} className="pn-glass rounded-[20px] p-3 sm:p-4">
          <label className="block">
            <span className="sr-only">Tu respuesta</span>
            <textarea
              ref={caja}
              rows={3}
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              disabled={ocupado}
              placeholder={`Escríbele a ${c.nombre}…`}
              className={`${CAMPO} resize-y leading-relaxed`}
            />
          </label>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <p className="min-w-0 flex-1 text-[11px] leading-4 text-fg/40">Sale por {CANAL_LABEL[c.canal]}. Si le escribes tú, Knox se aparta 12 horas.</p>
            <button type="submit" disabled={ocupado || !texto.trim()} className="pn-btn-solid inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold disabled:opacity-40">
              <Send size={14} {...ICONO} />
              {ocupado ? 'Mandando…' : 'Enviar'}
            </button>
          </div>
          {error && (
            <div className="mt-2">
              <Aviso>{error.texto}</Aviso>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}

function Cabecera({ c, modo, ahora }: { c: ConversacionDetalle; modo: ModoKnox; ahora: string }) {
  const { enviar, ocupado, error } = useEnvio()
  const k = estadoKnox(c.knoxPausadoHasta, new Date(ahora))
  const detalle = c.usuario ? `@${c.usuario}` : c.telefono ? telefonoLegible(c.telefono) : null

  // Queda en la conversación: arriba aparece «Ver su ficha»
  const guardarContacto = () => void enviar(`/api/crm/mensajes/${c.id}/contacto`, 'POST', {})

  let estado: string
  if (modo === 'apagado') estado = 'Knox está apagado para todo. Lo prendes en la pestaña Knox.'
  else if (k.activo) estado = modo === 'automatico' ? 'Knox lee y contesta solo aquí.' : 'Knox lee y te deja respuestas aquí.'
  else if (k.siempre) estado = 'Knox no se mete en esta conversación.'
  else estado = `Le contestaste tú: Knox vuelve ${cuandoVuelve(k.hasta ?? ahora, new Date(ahora))}.`

  return (
    <section className="pn-glass rounded-[20px] p-4 sm:p-5">
      <div className="flex items-start gap-3.5">
        <FotoPersona nombre={c.nombre} foto={c.foto} canal={c.canal} grande />
        <div className="min-w-0 flex-1">
          <h1 className="break-words text-lg font-semibold tracking-tight text-fg sm:text-xl">{c.nombre}</h1>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-fg/50">
            <span className="inline-flex items-center gap-1.5">
              <CanalIcono canal={c.canal} size={12} />
              {CANAL_LABEL[c.canal]}
            </span>
            {detalle && <span className="break-all">{detalle}</span>}
            {c.tipo && <span className="rounded-full bg-fg/[0.07] px-2 py-0.5 text-[11px] text-fg/70">{TIPO_LABEL[c.tipo]}</span>}
          </p>
          <div className="mt-2.5">
            {c.contactoId ? (
              <Link href={`/crm/${c.contactoId}`} className="pn-btn-glass inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium">
                <UserRound size={13} {...ICONO} />
                Ver su ficha
              </Link>
            ) : (
              <button type="button" onClick={guardarContacto} disabled={ocupado} className="pn-btn-glass inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium disabled:opacity-40">
                <UserPlus size={13} {...ICONO} />
                {ocupado ? 'Guardando…' : 'Guardar como contacto'}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-fg/[0.06] pt-3.5">
        <div className="min-w-0">
          <p id={`knox-${c.id}`} className="text-sm font-medium text-fg">
            Knox en esta conversación
          </p>
          <p className="text-xs leading-snug text-fg/50">{estado}</p>
        </div>
        <Interruptor
          activo={k.activo}
          etiqueta={`knox-${c.id}`}
          ocupado={ocupado}
          onCambiar={() => void enviar(`/api/crm/mensajes/${c.id}`, 'PATCH', { knox: !k.activo })}
        />
      </div>
      {c.otraApp && (
        <p className="mt-3 flex items-start gap-2 text-xs leading-snug text-amber-300">
          <AlertTriangle size={14} {...ICONO} className="mt-px shrink-0" />
          Otra app (GoHighLevel) tiene esta conversación: desde aquí no se le puede contestar. Contéstale desde la app.
        </p>
      )}
      {error && (
        <div className="mt-2">
          <Aviso>{error.texto}</Aviso>
        </div>
      )}
    </section>
  )
}

export function Interruptor({ activo, etiqueta, ocupado, onCambiar }: { activo: boolean; etiqueta: string; ocupado: boolean; onCambiar: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={activo}
      aria-labelledby={etiqueta}
      onClick={onCambiar}
      disabled={ocupado}
      className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${activo ? 'bg-fg' : 'bg-fg/[0.15]'}`}
    >
      <span className={`inline-block h-5 w-5 rounded-full shadow transition-transform ${activo ? 'translate-x-6 bg-solid' : 'translate-x-1 bg-fg/70'}`} />
    </button>
  )
}

// La respuesta que dejó Knox (o su aviso), con Enviar, Editar y Descartar
function TarjetaKnox({ p, onEditar }: { p: PendienteDetalle; onEditar: (texto: string) => void }) {
  const { enviar, ocupado, error } = useEnvio()
  const accion = (que: 'enviar' | 'descartar') => void enviar(`/api/crm/knox/decisiones/${p.id}`, 'POST', { accion: que })

  return (
    <section aria-label="Lo que propone Knox" className="rounded-[20px] bg-fg/[0.06] p-4 ring-1 ring-inset ring-fg/[0.1] sm:p-5">
      <p className="flex items-center gap-2 text-sm font-semibold text-fg">
        <Bot size={16} {...ICONO} />
        {p.respuesta ? 'Knox dejó una respuesta' : 'Knox te pasa esta conversación'}
      </p>
      {p.respuesta && <p className="mt-2.5 whitespace-pre-wrap break-words rounded-2xl bg-fg/[0.07] px-3.5 py-2.5 text-sm leading-relaxed text-fg/90">{p.respuesta}</p>}
      {p.aviso && <p className="mt-2.5 text-sm leading-snug text-fg/80">{p.aviso}</p>}
      {p.motivo && <p className="mt-1.5 text-xs leading-snug text-fg/45">Por qué: {p.motivo}</p>}
      {p.error && <p className="mt-1.5 text-xs leading-snug text-red-300">No salió: {p.error}</p>}
      <div className="mt-3.5 flex flex-wrap gap-2">
        {p.respuesta ? (
          <>
            <button type="button" onClick={() => accion('enviar')} disabled={ocupado} className="pn-btn-solid inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold disabled:opacity-40">
              <Send size={14} {...ICONO} />
              {ocupado ? 'Un momento…' : 'Enviar'}
            </button>
            <button type="button" onClick={() => onEditar(p.respuesta ?? '')} disabled={ocupado} className="pn-btn-glass px-4 py-2 text-sm font-medium disabled:opacity-40">
              Editar
            </button>
            <button type="button" onClick={() => accion('descartar')} disabled={ocupado} className="px-3 py-2 text-sm font-medium text-fg/55 transition-colors hover:text-fg disabled:opacity-40">
              Descartar
            </button>
          </>
        ) : (
          <button type="button" onClick={() => accion('descartar')} disabled={ocupado} className="pn-btn-glass px-4 py-2 text-sm font-medium disabled:opacity-40">
            Listo, ya lo vi
          </button>
        )}
      </div>
      {error && (
        <div className="mt-2">
          <Aviso>{error.texto}</Aviso>
        </div>
      )}
    </section>
  )
}

// El hilo: de lo más viejo a lo más nuevo, por día. Lo de la persona a la izquierda; lo que salió, a la derecha
function Hilo({ mensajes, nombre, ahora }: { mensajes: MensajeHilo[]; nombre: string; ahora: string }) {
  if (mensajes.length === 0) return <p className="py-8 text-center text-sm text-fg/45">Todavía no hay mensajes.</p>
  const dias: [string, MensajeHilo[]][] = []
  for (const m of mensajes) {
    const dia = diaCR(m.enviadoEn)
    const ultimo = dias[dias.length - 1]
    if (ultimo && ultimo[0] === dia) ultimo[1].push(m)
    else dias.push([dia, [m]])
  }
  const hoy = new Date(ahora)
  return (
    <ol className="space-y-5">
      {dias.map(([dia, lista]) => (
        <li key={dia}>
          <h2 className="mb-2.5 text-center text-[11px] font-medium uppercase tracking-wide text-fg/40">{nombreDelDia(dia, hoy)}</h2>
          <ul className="space-y-2">
            {lista.map((m) => (
              <Burbuja key={m.id} m={m} nombre={nombre} />
            ))}
          </ul>
        </li>
      ))}
    </ol>
  )
}

const ICONO_ADJUNTO: Record<string, LucideIcon> = {
  foto: ImagenIcono,
  video: Video,
  audio: Music,
  archivo: FileText,
  sticker: Smile,
  historia: ImagenIcono,
  'publicación compartida': Share2,
  ubicación: MapPin,
  contacto: UserRound,
}

const ESTADO: Record<string, string> = { enviado: 'Enviado', entregado: 'Entregado', leido: 'Leído' }

function Burbuja({ m, nombre }: { m: MensajeHilo; nombre: string }) {
  const sale = m.autor !== 'persona'
  const quien = sale ? AUTOR_LABEL[m.autor] : nombre
  const historia = textoHistoria(m.historia)
  const Icono = m.adjunto ? (ICONO_ADJUNTO[m.adjunto] ?? Paperclip) : null
  const tono =
    m.autor === 'knox'
      ? 'bg-fg/[0.1] ring-1 ring-inset ring-fg/[0.14]'
      : m.autor === 'automatizacion'
        ? 'border border-dashed border-fg/[0.16] bg-fg/[0.04]'
        : sale
          ? 'bg-fg/[0.1]'
          : 'bg-fg/[0.045]'
  return (
    <li className={`flex ${sale ? 'justify-end' : 'justify-start'}`}>
      <div className={`min-w-0 max-w-[85%] rounded-2xl px-3.5 py-2 sm:max-w-[75%] ${sale ? 'rounded-tr-md' : 'rounded-tl-md'} ${tono}`}>
        {sale && (
          <p className="mb-0.5 flex items-center gap-1 text-[11px] font-medium text-fg/55">
            {m.autor === 'knox' && <Bot size={11} {...ICONO} />}
            {quien}
          </p>
        )}
        {historia && <p className="mb-1 text-[11px] italic text-fg/45">{historia}</p>}
        {m.texto && <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-fg/90">{m.texto}</p>}
        {Icono && (
          <p className={`inline-flex items-center gap-1.5 rounded-full bg-fg/[0.06] px-2.5 py-0.5 text-xs text-fg/70 ${m.texto ? 'mt-1.5' : ''}`}>
            <Icono size={12} {...ICONO} />
            {adjuntoLabel(m.adjunto)}
          </p>
        )}
        {!m.texto && !Icono && !historia && <p className="text-sm italic text-fg/40">Mensaje sin texto</p>}
        <p className="mt-1 flex items-center justify-end gap-1.5 text-[10px] tabular-nums text-fg/40">
          {horaCR(m.enviadoEn)}
          {sale && m.estado && ESTADO[m.estado] && <span>· {ESTADO[m.estado]}</span>}
        </p>
        {m.estado === 'fallo' && <p className="mt-1 text-[11px] text-red-300">No se entregó{m.error ? `: ${m.error}` : ''}</p>}
      </div>
    </li>
  )
}

