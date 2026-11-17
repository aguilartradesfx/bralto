'use client'

import { memo, useCallback, useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent, type RefObject } from 'react'
import Link from 'next/link'
import {
  AlertTriangle,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  ArrowUpRight,
  Bot,
  FileText,
  Image as ImagenIcono,
  Loader2,
  MapPin,
  Music,
  PanelRight,
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
import type { ModoKnox } from '@/lib/knox/conversar/tipos'
import {
  adjuntoLabel,
  AUTOR_LABEL,
  avisoVentana,
  cuandoVuelve,
  estadoKnox,
  RED_LABEL,
  textoHistoria,
  TIPO_LABEL,
  type ConversacionDetalle,
  type MensajeHilo,
  type PendienteDetalle,
} from '@/lib/crm/bandeja/vista'
import { Aviso, CAMPO, CanalIcono, ICONO } from '@/components/crm/piezas'
import { FotoPersona } from '@/components/crm/foto'
import { useEnvio } from '@/components/crm/usar-envio'
import { useBandeja } from '@/components/crm/bandeja'
import { PanelContacto } from '@/components/crm/bandeja-contacto'

// Una conversación de la bandeja. En la compu es el panel derecho de Mensajes: arriba
// quién es (con Knox y su ficha), en medio el hilo (lo más viejo arriba, como un chat) y abajo la caja para contestar;
// al lado, en pantallas anchas, lo que hay de esa persona en el CRM. En el teléfono, pantalla completa con «‹ Mensajes».
//
// Se pone al día sola cada pocos segundos mientras está abierta (sin recargar la página).

const REFRESCO_MS = 10_000
const CERCA_DEL_FINAL_PX = 80

// Una clave por envío: si se corta la conexión y se vuelve a tocar «Enviar» con el mismo texto, Zernio no lo repite
function nuevaClave(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`
}

// En la compu Enter manda (Shift+Enter, salto de línea). En el teléfono Enter es salto de línea y se manda con el botón
const conTeclado = () => typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches

type Panel = 'auto' | 'abierto' | 'cerrado'

export function Conversacion({ inicial, modo: modoInicial, ahora: ahoraInicial }: { inicial: ConversacionDetalle; modo: ModoKnox; ahora: string }) {
  const bandeja = useBandeja()
  const [c, setC] = useState(inicial)
  const [modo, setModo] = useState(modoInicial)
  const [ahora, setAhora] = useState(ahoraInicial)
  const [texto, setTexto] = useState('')
  const [nuevos, setNuevos] = useState(false)
  const [panel, setPanel] = useState<Panel>('auto')
  const intento = useRef<{ texto: string; clave: string } | null>(null)
  const scroller = useRef<HTMLDivElement>(null)
  const caja = useRef<HTMLTextAreaElement>(null)
  const pegado = useRef(true)
  const enCurso = useRef(false)
  const vivo = useRef(true)
  const { enviar, ocupado, error } = useEnvio()
  const id = inicial.id

  useEffect(() => {
    vivo.current = true
    return () => {
      vivo.current = false
    }
  }, [])

  // Abrirla es leerla (el servidor ya la marcó): en la lista deja de verse en negrita
  useEffect(() => {
    bandeja?.marcarLeida(id)
  }, [bandeja, id])

  const refrescar = useCallback(async () => {
    if (enCurso.current) return
    enCurso.current = true
    try {
      const visible = document.visibilityState === 'visible'
      const res = await fetch(`/api/crm/mensajes/${id}${visible ? '?leida=1' : ''}`, { cache: 'no-store' })
      if (!res.ok || !vivo.current) return
      const data = (await res.json()) as { c: ConversacionDetalle; modo: ModoKnox }
      setC(data.c)
      setModo(data.modo)
      setAhora(new Date().toISOString())
      if (visible) bandeja?.marcarLeida(id)
    } catch {
      // Sin conexión: se queda lo que había y se vuelve a intentar en el próximo refresco
    } finally {
      enCurso.current = false
    }
  }, [bandeja, id])

  // Los mensajes nuevos aparecen solos mientras la tienes abierta
  useEffect(() => {
    const t = window.setInterval(() => {
      if (document.visibilityState === 'visible') void refrescar()
    }, REFRESCO_MS)
    const alVolver = () => {
      if (document.visibilityState === 'visible') void refrescar()
    }
    document.addEventListener('visibilitychange', alVolver)
    return () => {
      window.clearInterval(t)
      document.removeEventListener('visibilitychange', alVolver)
    }
  }, [refrescar])

  // Después de mandar algo o cambiar a Knox: la conversación y la lista, al día
  const alCambiar = useCallback(async () => {
    pegado.current = true
    await refrescar()
    bandeja?.recargar()
  }, [bandeja, refrescar])

  // ── El hilo: al abrir, lo más nuevo a la vista; si llega algo y estabas abajo, baja con él ──
  const alFinal = useCallback((suave = false) => {
    const el = scroller.current
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: suave ? 'smooth' : 'auto' })
  }, [])

  useLayoutEffect(() => {
    alFinal()
  }, [alFinal])

  const ultimo = c.mensajes[c.mensajes.length - 1]
  const firma = `${ultimo?.id ?? ''}|${c.pendiente?.id ?? ''}`
  const firmaAntes = useRef(firma)
  useEffect(() => {
    if (firma === firmaAntes.current) return
    firmaAntes.current = firma
    if (pegado.current) requestAnimationFrame(() => alFinal(true))
    else if (ultimo?.autor === 'persona') setNuevos(true)
  }, [firma, ultimo, alFinal])

  function alDesplazar() {
    const el = scroller.current
    if (!el) return
    pegado.current = el.scrollHeight - el.scrollTop - el.clientHeight < CERCA_DEL_FINAL_PX
    if (pegado.current && nuevos) setNuevos(false)
  }

  // ── Contestar ──
  const aviso = avisoVentana(c.canal, c.ultimoEntranteEn, new Date(ahora))

  async function mandar() {
    const t = texto.trim()
    if (!t || ocupado || aviso.bloqueado) return
    if (!intento.current || intento.current.texto !== t) intento.current = { texto: t, clave: nuevaClave() }
    if (await enviar(`/api/crm/mensajes/${id}/enviar`, 'POST', { texto: t, clave: intento.current.clave }, { refrescar: false })) {
      setTexto('')
      intento.current = null
      await alCambiar()
      caja.current?.focus()
    }
  }

  function editar(respuesta: string) {
    setTexto(respuesta)
    requestAnimationFrame(() => {
      const t = caja.current
      if (!t) return
      t.focus()
      t.setSelectionRange(t.value.length, t.value.length)
    })
  }

  const rutaLista = `/crm/mensajes${bandeja?.busqueda ?? ''}`
  const detalle = c.usuario ? `@${c.usuario}` : c.telefono ? telefonoLegible(c.telefono) : null
  const visibilidadPanel = panel === 'abierto' ? 'lg:flex' : panel === 'cerrado' ? '' : 'min-[1600px]:flex'
  function alternarPanel() {
    const visible = panel === 'abierto' || (panel === 'auto' && window.matchMedia('(min-width: 1600px)').matches)
    setPanel(visible ? 'cerrado' : 'abierto')
  }

  return (
    <section
      aria-label={`Conversación con ${c.nombre}`}
      className="fixed inset-y-0 left-0 right-0 z-[35] flex bg-[var(--pn-bg)] md:left-[var(--pn-side-w)] lg:static lg:z-auto lg:h-full lg:gap-4 lg:bg-transparent"
    >
      <div className={`flex min-w-0 flex-1 flex-col lg:overflow-hidden lg:rounded-[20px] ${TARJETA_COMPU}`}>
        <header className="shrink-0 border-b border-fg/[0.06] px-3 pb-2.5 pt-[max(0.5rem,env(safe-area-inset-top))] sm:px-4 lg:px-5 lg:py-3.5">
          <div className="flex items-center gap-2 lg:gap-3">
            <Link href={rutaLista} aria-label="Volver a Mensajes" className="-ml-1 grid h-10 w-9 shrink-0 place-items-center rounded-xl text-fg/60 hover:bg-fg/[0.05] hover:text-fg lg:hidden">
              <ArrowLeft size={18} {...ICONO} />
            </Link>
            <Quien c={c} detalle={detalle} />
            <div className="flex shrink-0 items-center gap-1.5">
              <BotonKnox c={c} modo={modo} ahora={ahora} onCambio={alCambiar} />
              <BotonContacto c={c} onCambio={alCambiar} />
              <button
                type="button"
                onClick={alternarPanel}
                aria-label="Mostrar u ocultar lo que hay de esta persona"
                title="Lo que hay de esta persona"
                className="hidden h-9 w-9 place-items-center rounded-full text-fg/60 ring-1 ring-inset ring-fg/[0.1] transition-colors hover:bg-fg/[0.05] hover:text-fg lg:grid"
              >
                <PanelRight size={16} {...ICONO} />
              </button>
            </div>
          </div>
        </header>

        {c.otraApp && (
          <p className="flex shrink-0 items-start gap-2 border-b border-fg/[0.06] px-4 py-2 text-xs leading-snug text-amber-300 lg:px-5">
            <AlertTriangle size={14} {...ICONO} className="mt-px shrink-0" />
            Otra app (GoHighLevel) tiene esta conversación: desde aquí no se le puede contestar. Contéstale desde la app.
          </p>
        )}

        <div className="relative min-h-0 flex-1">
          <div ref={scroller} onScroll={alDesplazar} className="h-full overflow-y-auto overscroll-contain [overflow-anchor:none]">
            <div className="mx-auto flex min-h-full max-w-3xl flex-col justify-end px-3 py-4 sm:px-4 lg:max-w-none lg:px-6">
              {c.hayMas && <p className="mb-3 text-center text-[11px] text-fg/40">Aquí se ven los últimos 100 mensajes.</p>}
              <Hilo mensajes={c.mensajes} nombre={c.nombre} ahora={ahora} />
              {c.pendiente && <BorradorKnox p={c.pendiente} onEditar={editar} onCambio={alCambiar} />}
            </div>
          </div>
          {nuevos && (
            <button
              type="button"
              onClick={() => {
                pegado.current = true
                setNuevos(false)
                alFinal(true)
              }}
              className="pn-btn-solid absolute bottom-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1.5 px-4 py-2 text-xs font-semibold shadow-lg"
            >
              <ArrowDown size={14} {...ICONO} />
              Mensajes nuevos
            </button>
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            void mandar()
          }}
          className="shrink-0 border-t border-fg/[0.06] px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2.5 sm:px-4 lg:px-5 lg:pb-4 lg:pt-3"
        >
          <p className={`mb-2 text-[11.5px] leading-snug ${aviso.bloqueado ? 'text-amber-300' : 'text-fg/40'}`}>{aviso.texto}</p>
          <div className="flex items-end gap-2">
            <CampoMensaje
              campo={caja}
              valor={texto}
              onCambiar={setTexto}
              onEnviar={() => void mandar()}
              deshabilitado={aviso.bloqueado}
              placeholder={aviso.bloqueado ? 'Desde aquí ya no se le puede escribir' : 'Escribe tu respuesta…'}
              etiqueta={`Tu respuesta por ${RED_LABEL[c.canal]}`}
            />
            <button
              type="submit"
              disabled={ocupado || !texto.trim() || aviso.bloqueado}
              aria-label={`Enviar por ${RED_LABEL[c.canal]}`}
              title={`Enviar por ${RED_LABEL[c.canal]}`}
              className="pn-btn-solid grid h-11 w-11 shrink-0 place-items-center !rounded-full disabled:opacity-40"
            >
              {ocupado ? (
                <Loader2 size={18} {...ICONO} className="animate-spin" />
              ) : (
                <>
                  <ArrowUp size={18} {...ICONO} className="lg:hidden" />
                  <Send size={16} {...ICONO} className="hidden lg:block" />
                </>
              )}
            </button>
          </div>
          {error && (
            <div className="mt-2">
              <Aviso>{error.texto}</Aviso>
            </div>
          )}
        </form>
      </div>

      <PanelContacto c={c} modo={modo} ahora={ahora} onCambio={alCambiar} className={`hidden w-[290px] shrink-0 max-lg:!hidden ${visibilidadPanel}`} />
    </section>
  )
}

// Lo mismo que TARJETA, solo en la compu (escrito entero para que Tailwind lo vea)
const TARJETA_COMPU = 'lg:bg-[var(--pn-card)] lg:shadow-[inset_0_0_0_1px_var(--pn-line),var(--pn-shadow)]'

function Quien({ c, detalle }: { c: ConversacionDetalle; detalle: string | null }) {
  const contenido = (
    <>
      <FotoPersona nombre={c.nombre} foto={c.foto} canal={c.canal} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-semibold leading-tight tracking-tight text-fg lg:text-base">{c.nombre}</span>
        <span className="mt-0.5 flex min-w-0 items-center gap-1.5 text-xs text-fg/50">
          <CanalIcono canal={c.canal} size={12} />
          <span className="truncate">{[RED_LABEL[c.canal], detalle].filter(Boolean).join(' · ')}</span>
          {c.tipo && <span className="hidden shrink-0 rounded-full bg-fg/[0.07] px-2 py-0.5 text-[11px] text-fg/70 sm:inline">{TIPO_LABEL[c.tipo]}</span>}
        </span>
      </span>
    </>
  )
  const clase = 'flex min-w-0 flex-1 items-center gap-3 rounded-xl py-0.5 pr-2'
  // Con ficha, el nombre la abre (como en el teléfono)
  return c.contactoId ? (
    <Link href={`/crm/${c.contactoId}`} title="Ver su ficha" className={`${clase} -ml-1 pl-1 transition-colors hover:bg-fg/[0.04]`}>
      {contenido}
    </Link>
  ) : (
    <div className={clase}>{contenido}</div>
  )
}

// Knox en esta conversación: prendido, en pausa (porque contestaste tú) o fuera de aquí. Tocarlo lo cambia
function BotonKnox({ c, modo, ahora, onCambio }: { c: ConversacionDetalle; modo: ModoKnox; ahora: string; onCambio: () => Promise<void> }) {
  const { enviar, ocupado, error } = useEnvio()
  const k = estadoKnox(c.knoxPausadoHasta, new Date(ahora))
  const base = 'inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-[12.5px] font-medium ring-1 ring-inset transition-colors disabled:opacity-50 lg:px-3.5'

  if (modo === 'apagado') {
    return (
      <Link href="/crm/knox" title="Knox está apagado para todo. Lo prendes en la pestaña Knox." className={`${base} text-fg/50 ring-fg/[0.1] hover:text-fg`}>
        <Bot size={14} {...ICONO} />
        <span className="hidden sm:inline">Knox apagado</span>
      </Link>
    )
  }

  const cambiar = async () => {
    if (await enviar(`/api/crm/mensajes/${c.id}`, 'PATCH', { knox: !k.activo }, { refrescar: false })) await onCambio()
  }
  const etiqueta = k.activo ? 'Knox activo' : k.siempre ? 'Knox fuera' : 'Knox en pausa'
  const ayuda = k.activo
    ? `${modo === 'automatico' ? 'Knox lee y contesta solo aquí.' : 'Knox lee y te deja respuestas aquí.'} Tócalo para que no se meta en esta conversación.`
    : k.siempre
      ? 'Knox no se mete en esta conversación. Tócalo para que vuelva.'
      : `Le contestaste tú: Knox vuelve ${cuandoVuelve(k.hasta ?? ahora, new Date(ahora))}. Tócalo para que vuelva ya.`
  return (
    <>
      <button
        type="button"
        role="switch"
        aria-checked={k.activo}
        aria-label={`Knox en esta conversación. ${ayuda}`}
        title={error?.texto ?? ayuda}
        onClick={() => void cambiar()}
        disabled={ocupado}
        className={`${base} ${k.activo ? 'pn-chip-on text-fg ring-transparent' : 'text-fg/55 ring-fg/[0.1] hover:text-fg'} ${error ? '!ring-[var(--pn-accent-line)]' : ''}`}
      >
        {ocupado ? <Loader2 size={14} {...ICONO} className="animate-spin" /> : <Bot size={14} {...ICONO} />}
        <span className="hidden sm:inline">{etiqueta}</span>
        {k.activo && <span className="pn-signal" aria-hidden />}
      </button>
      {error && <span className="sr-only" role="alert">{error.texto}</span>}
    </>
  )
}

// «Ver ficha» si ya es contacto; si no, «Guardar contacto» (queda aquí y el botón pasa a «Ver ficha»)
function BotonContacto({ c, onCambio }: { c: ConversacionDetalle; onCambio: () => Promise<void> }) {
  const { enviar, ocupado, error } = useEnvio()
  const clase = 'pn-btn-glass inline-flex h-9 shrink-0 items-center gap-1.5 px-2.5 text-[12.5px] font-medium disabled:opacity-40 sm:px-3.5'
  if (c.contactoId) {
    // En el teléfono el nombre ya abre la ficha
    return (
      <Link href={`/crm/${c.contactoId}`} className={`${clase} max-sm:!hidden`}>
        Ver ficha
        <ArrowUpRight size={14} {...ICONO} />
      </Link>
    )
  }
  const guardar = async () => {
    if (await enviar(`/api/crm/mensajes/${c.id}/contacto`, 'POST', {}, { refrescar: false })) await onCambio()
  }
  return (
    <button type="button" onClick={() => void guardar()} disabled={ocupado} aria-label="Guardar como contacto" title={error?.texto ?? 'Guardarla en tus contactos'} className={clase}>
      <UserPlus size={14} {...ICONO} />
      <span className="hidden sm:inline">{ocupado ? 'Guardando…' : 'Guardar contacto'}</span>
    </button>
  )
}

function CampoMensaje({
  campo,
  valor,
  onCambiar,
  onEnviar,
  placeholder,
  etiqueta,
  deshabilitado,
}: {
  campo: RefObject<HTMLTextAreaElement | null>
  valor: string
  onCambiar: (v: string) => void
  onEnviar: () => void
  placeholder: string
  etiqueta: string
  deshabilitado: boolean
}) {
  // Crece con lo que escribes, hasta un tope
  useLayoutEffect(() => {
    const t = campo.current
    if (!t) return
    t.style.height = 'auto'
    t.style.height = `${Math.min(t.scrollHeight, 168)}px`
  }, [valor, campo])

  function tecla(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key !== 'Enter' || e.nativeEvent.isComposing) return
    if (e.metaKey || e.ctrlKey || (!e.shiftKey && conTeclado())) {
      e.preventDefault()
      onEnviar()
    }
  }

  return (
    <textarea
      ref={campo}
      rows={1}
      value={valor}
      onChange={(e) => onCambiar(e.target.value)}
      onKeyDown={tecla}
      disabled={deshabilitado}
      placeholder={placeholder}
      aria-label={etiqueta}
      className={`${CAMPO} block max-h-[168px] min-h-11 flex-1 resize-none !rounded-[22px] px-4 py-2.5 leading-6`}
    />
  )
}

// El borrador de Knox (o su aviso) al final del hilo, del lado de lo que sale: Enviar, Editar o Descartar
function BorradorKnox({ p, onEditar, onCambio }: { p: PendienteDetalle; onEditar: (texto: string) => void; onCambio: () => Promise<void> }) {
  const { enviar, ocupado, error } = useEnvio()
  const accion = async (que: 'enviar' | 'descartar') => {
    if (await enviar(`/api/crm/knox/decisiones/${p.id}`, 'POST', { accion: que }, { refrescar: false })) await onCambio()
  }

  return (
    <section aria-label="Lo que propone Knox" className="mt-4 flex justify-end">
      <div className="w-full max-w-[85%] rounded-2xl rounded-tr-md border border-dashed border-fg/[0.2] bg-fg/[0.04] px-3.5 py-3 sm:max-w-[75%]">
        <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-fg/55">
          <Bot size={12} {...ICONO} />
          {p.respuesta ? 'Borrador de Knox' : 'Knox te pasa esta conversación'}
        </p>
        {p.respuesta && <p className="mt-1.5 whitespace-pre-wrap break-words text-sm leading-relaxed text-fg/90">{p.respuesta}</p>}
        {p.aviso && <p className="mt-1.5 text-sm leading-snug text-fg/80">{p.aviso}</p>}
        {p.motivo && <p className="mt-1.5 text-xs leading-snug text-fg/45">Por qué: {p.motivo}</p>}
        {p.error && <p className="mt-1.5 text-xs leading-snug text-red-300">No salió: {p.error}</p>}
        <div className="mt-3 flex flex-wrap justify-end gap-2">
          {p.respuesta ? (
            <>
              <button type="button" onClick={() => void accion('descartar')} disabled={ocupado} className="px-2.5 py-1.5 text-[13px] font-medium text-fg/55 transition-colors hover:text-fg disabled:opacity-40">
                Descartar
              </button>
              <button type="button" onClick={() => onEditar(p.respuesta ?? '')} disabled={ocupado} className="pn-btn-glass px-3.5 py-1.5 text-[13px] font-medium disabled:opacity-40">
                Editar
              </button>
              <button type="button" onClick={() => void accion('enviar')} disabled={ocupado} className="pn-btn-solid inline-flex items-center gap-1.5 px-3.5 py-1.5 text-[13px] font-semibold disabled:opacity-40">
                <Send size={13} {...ICONO} />
                {ocupado ? 'Un momento…' : 'Enviar'}
              </button>
            </>
          ) : (
            <button type="button" onClick={() => void accion('descartar')} disabled={ocupado} className="pn-btn-glass px-3.5 py-1.5 text-[13px] font-medium disabled:opacity-40">
              Listo, ya lo vi
            </button>
          )}
        </div>
        {error && (
          <div className="mt-2">
            <Aviso>{error.texto}</Aviso>
          </div>
        )}
      </div>
    </section>
  )
}

// El hilo: de lo más viejo a lo más nuevo, por día. Lo de la persona a la izquierda; lo que salió, a la derecha
function Hilo({ mensajes, nombre, ahora }: { mensajes: MensajeHilo[]; nombre: string; ahora: string }) {
  if (mensajes.length === 0) return <p className="my-auto py-10 text-center text-sm text-fg/45">Todavía no hay mensajes.</p>
  const dias: [string, MensajeHilo[]][] = []
  for (const m of mensajes) {
    const dia = diaCR(m.enviadoEn)
    const ultimo = dias[dias.length - 1]
    if (ultimo && ultimo[0] === dia) ultimo[1].push(m)
    else dias.push([dia, [m]])
  }
  const hoy = new Date(ahora)
  return (
    <ol aria-label="Mensajes" className="space-y-4">
      {dias.map(([dia, lista]) => (
        <li key={dia}>
          <h2 className="mb-3 flex justify-center">
            <span className="rounded-full bg-fg/[0.06] px-2.5 py-0.5 text-[11px] font-medium text-fg/50">{nombreDelDia(dia, hoy)}</span>
          </h2>
          <ul>
            {lista.map((m, i) => {
              const antes = lista[i - 1]
              // Seguidos del mismo lado y con poco tiempo entre uno y otro: más juntos y sin repetir quién
              const seguido = !!antes && antes.autor === m.autor && Date.parse(m.enviadoEn) - Date.parse(antes.enviadoEn) < 5 * 60_000
              return (
                <li key={m.id} className={i === 0 ? '' : seguido ? 'mt-1' : 'mt-3'}>
                  <Burbuja m={m} nombre={nombre} seguido={seguido} />
                </li>
              )
            })}
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

const Burbuja = memo(function Burbuja({ m, nombre, seguido }: { m: MensajeHilo; nombre: string; seguido: boolean }) {
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
    <div className={`flex ${sale ? 'justify-end' : 'justify-start'}`}>
      <div className={`min-w-0 max-w-[85%] rounded-2xl px-3.5 py-2 sm:max-w-[75%] ${seguido ? '' : sale ? 'rounded-tr-md' : 'rounded-tl-md'} ${tono}`}>
        {sale && !seguido && (
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
          <span className="sr-only">{quien}, </span>
          {horaCR(m.enviadoEn)}
          {sale && m.estado && ESTADO[m.estado] && <span>· {ESTADO[m.estado]}</span>}
        </p>
        {m.estado === 'fallo' && <p className="mt-1 text-[11px] text-red-300">No se entregó{m.error ? `: ${m.error}` : ''}</p>}
      </div>
    </div>
  )
})

// Mientras carga un chat: el mismo lugar, con el reloj
export function CargandoConversacion() {
  return (
    <div
      className={`fixed inset-y-0 left-0 right-0 z-[35] grid place-items-center bg-[var(--pn-bg)] text-fg/40 md:left-[var(--pn-side-w)] lg:static lg:z-auto lg:h-full lg:rounded-[20px] ${TARJETA_COMPU}`}
      role="status"
    >
      <Loader2 size={22} {...ICONO} className="animate-spin" />
      <span className="sr-only">Cargando la conversación</span>
    </div>
  )
}
