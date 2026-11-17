'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Bot, ChevronDown, Loader2, MessagesSquare, Search, X } from 'lucide-react'
import { haceCuanto } from '@/lib/crm/fechas'
import {
  busquedaDeVista,
  esVistaInicial,
  FILTRO_LABEL,
  FILTROS,
  leerVista,
  POR_PAGINA,
  RED_LABEL,
  REDES,
  textoVacio,
  type ConversacionLista,
  type ListaBandeja,
  type ResumenBandeja,
  type VistaLista,
} from '@/lib/crm/bandeja/vista'
import { CanalIcono, ICONO, SubMenu } from '@/components/crm/piezas'
import { FotoPersona } from '@/components/crm/foto'

// La bandeja de Mensajes, como una app de mensajería: en la compu, dos paneles a todo el alto (la lista a la
// izquierda, que se queda puesta al pasar de un chat a otro, y la conversación a la derecha). En el teléfono, la
// lista; tocar un chat lo abre a pantalla completa.
//
// Filtro, red y búsqueda viven en la URL (?filtro=…&red=…&q=…) y se arrastran al abrir un chat. La lista se pone al
// día sola cada pocos segundos: lo que entra por Zernio aparece sin recargar.

const REFRESCO_MS = 15_000

// La tarjeta del panel (lo mismo que pn-glass), para ponerla solo en una medida de pantalla. Escritas enteras: Tailwind
// solo genera las clases que ve tal cual en el código
export const TARJETA = 'bg-[var(--pn-card)] shadow-[inset_0_0_0_1px_var(--pn-line),var(--pn-shadow)]'
const TARJETA_COMPU = 'lg:bg-[var(--pn-card)] lg:shadow-[inset_0_0_0_1px_var(--pn-line),var(--pn-shadow)]'
const TARJETA_TELEFONO = 'max-lg:bg-[var(--pn-card)] max-lg:shadow-[inset_0_0_0_1px_var(--pn-line),var(--pn-shadow)]'

// Los botones de filtro y de red: una cápsula con la opción elegida levantada
const SEGMENTOS = 'flex gap-0.5 rounded-xl bg-fg/[0.05] p-1'
const segmento = (on: boolean) =>
  `inline-flex min-w-9 flex-auto items-center justify-center gap-1.5 rounded-lg px-1.5 py-1.5 text-[12.5px] font-medium transition-colors ${on ? 'bg-[var(--pn-card)] text-fg shadow-[0_0_0_1px_var(--pn-line)]' : 'text-fg/55 hover:text-fg'}`

interface ContextoBandeja {
  // «?filtro=…» de ahora, para volver a la lista sin perderlo
  busqueda: string
  // La conversación abierta quedó leída (sin esperar al refresco)
  marcarLeida: (id: string) => void
  // Algo cambió (mandaste un mensaje, Knox, un contacto): la lista se pide de nuevo
  recargar: () => void
}

const Contexto = createContext<ContextoBandeja | null>(null)

export const useBandeja = () => useContext(Contexto)

function resumenTexto(r: ResumenBandeja | null): string {
  if (!r) return ' '
  const partes = [
    r.porResponder === 0 ? 'Nada por responder' : r.porResponder === 1 ? '1 por responder' : `${r.porResponder} por responder`,
    r.pendientes > 0 ? (r.pendientes === 1 ? '1 respuesta de Knox' : `${r.pendientes} respuestas de Knox`) : null,
  ]
  return partes.filter(Boolean).join(' · ')
}

async function pedirLista(vista: VistaLista, cuantas: number): Promise<ListaBandeja> {
  const p = new URLSearchParams(busquedaDeVista(vista).slice(1))
  if (cuantas > POR_PAGINA) p.set('cuantas', String(cuantas))
  const q = p.toString()
  const res = await fetch(`/api/crm/mensajes${q ? `?${q}` : ''}`, { cache: 'no-store' })
  const data = (await res.json().catch(() => null)) as (ListaBandeja & { error?: string }) | null
  if (!res.ok || !data?.filas) throw new Error(data?.error ?? 'No se pudo cargar la bandeja. Prueba de nuevo.')
  return data
}

export function Bandeja({ inicial, ahora: ahoraServidor, children }: { inicial: ListaBandeja | null; ahora: string; children: ReactNode }) {
  const params = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const ruta = useParams<{ id?: string }>()
  const abierta = typeof ruta?.id === 'string' ? ruta.id : null

  const vista = leerVista(params)
  const clave = `${vista.filtro}|${vista.red ?? ''}|${vista.q}`
  const conInicial = esVistaInicial(vista) && !!inicial

  const [filas, setFilas] = useState<ConversacionLista[] | null>(conInicial ? inicial.filas : null)
  const [resumen, setResumen] = useState<ResumenBandeja | null>(inicial?.resumen ?? null)
  const [hayMas, setHayMas] = useState(conInicial ? inicial.hayMas : false)
  const [cuantas, setCuantas] = useState(POR_PAGINA)
  const [error, setError] = useState<string | null>(null)
  const [cargandoMas, setCargandoMas] = useState(false)
  const [ahora, setAhora] = useState(ahoraServidor)
  const [texto, setTexto] = useState(vista.q)
  const pedido = useRef(0)
  const cuantasRef = useRef(cuantas)
  const vistaRef = useRef(vista)
  vistaRef.current = vista
  cuantasRef.current = cuantas

  // silencioso: el refresco de cada rato (si falla, se queda lo que había)
  const cargar = useCallback(async (silencioso: boolean) => {
    const n = ++pedido.current
    if (!silencioso) setError(null)
    try {
      const r = await pedirLista(vistaRef.current, cuantasRef.current)
      if (n !== pedido.current) return
      setFilas(r.filas)
      setHayMas(r.hayMas)
      setResumen(r.resumen)
      setAhora(new Date().toISOString())
      setError(null)
    } catch (e) {
      if (n === pedido.current && !silencioso) setError(e instanceof Error ? e.message : 'No se pudo cargar la bandeja.')
    }
  }, [])

  // Al cambiar el filtro, la red o la búsqueda. La primera vista sin filtros ya vino del servidor
  const primera = useRef(true)
  useEffect(() => {
    const yaEstaba = primera.current && conInicial
    primera.current = false
    if (yaEstaba) return
    setFilas(null)
    setCuantas(POR_PAGINA)
    cuantasRef.current = POR_PAGINA
    void cargar(false)
  }, [clave]) // eslint-disable-line react-hooks/exhaustive-deps

  // Lo nuevo aparece solo: cada rato con la pestaña a la vista, y al volver a ella
  useEffect(() => {
    const t = window.setInterval(() => {
      if (document.visibilityState === 'visible') void cargar(true)
    }, REFRESCO_MS)
    const alVolver = () => {
      if (document.visibilityState === 'visible') void cargar(true)
    }
    document.addEventListener('visibilitychange', alVolver)
    return () => {
      window.clearInterval(t)
      document.removeEventListener('visibilitychange', alVolver)
    }
  }, [cargar])

  // Lo último que se pidió, mientras la URL se pone al día: dos toques seguidos (Todas y luego Messenger) suman
  const pedida = useRef<VistaLista | null>(null)
  useEffect(() => {
    pedida.current = null
  }, [clave])
  const cambiar = useCallback(
    (cambio: Partial<VistaLista>) => {
      const nueva = { ...(pedida.current ?? vistaRef.current), ...cambio }
      pedida.current = nueva
      router.replace(`${pathname}${busquedaDeVista(nueva)}`, { scroll: false })
    },
    [pathname, router],
  )

  // El buscador escribe en la URL un momento después de dejar de teclear; si la URL cambia por otro lado, lo sigue
  const [qAntes, setQAntes] = useState(vista.q)
  if (vista.q !== qAntes) {
    setQAntes(vista.q)
    setTexto(vista.q)
  }
  useEffect(() => {
    const t = texto.replace(/\s+/g, ' ').trim()
    if (t === vista.q) return
    const h = window.setTimeout(() => cambiar({ q: t }), 350)
    return () => window.clearTimeout(h)
  }, [texto]) // eslint-disable-line react-hooks/exhaustive-deps

  async function verMas() {
    const siguiente = cuantas + POR_PAGINA
    setCargandoMas(true)
    const n = ++pedido.current
    try {
      const r = await pedirLista(vista, siguiente)
      if (n !== pedido.current) return
      setFilas(r.filas)
      setHayMas(r.hayMas)
      setResumen(r.resumen)
      setCuantas(siguiente)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudieron cargar más conversaciones.')
    } finally {
      setCargandoMas(false)
    }
  }

  const busqueda = busquedaDeVista(vista)
  const contexto = useMemo<ContextoBandeja>(
    () => ({
      busqueda,
      marcarLeida: (id) => setFilas((xs) => (xs?.some((x) => x.id === id && x.sinLeer) ? xs.map((x) => (x.id === id ? { ...x, sinLeer: false } : x)) : xs)),
      recargar: () => void cargar(true),
    }),
    [busqueda, cargar],
  )

  return (
    <Contexto.Provider value={contexto}>
      <div className="px-4 pb-12 md:px-8 lg:pb-6">
        <h1 className="sr-only">Mensajes</h1>
        <div className="lg:grid lg:h-[calc(100dvh-96px)] lg:min-h-[520px] lg:grid-cols-[340px_minmax(0,1fr)] lg:grid-rows-[minmax(0,1fr)] lg:gap-4 2xl:grid-cols-[380px_minmax(0,1fr)]">
          <section
            aria-label="Conversaciones"
            className={`${abierta ? 'max-lg:hidden' : ''} lg:flex lg:min-h-0 lg:flex-col lg:overflow-hidden lg:rounded-[20px] ${TARJETA_COMPU}`}
          >
            <div className="lg:hidden">
              <SubMenu activa="/crm/mensajes" />
            </div>

            <div className="shrink-0 lg:border-b lg:border-fg/[0.06] lg:px-4 lg:pb-3 lg:pt-4">
              <p className="text-[13px] text-fg/50" aria-live="polite">
                {resumenTexto(resumen)}
              </p>

              <label className="mt-3 flex h-10 items-center gap-2 rounded-xl bg-fg/[0.05] px-3 text-fg/45 ring-1 ring-inset ring-transparent transition-colors focus-within:bg-transparent focus-within:ring-[var(--pn-accent-line)]">
                <Search size={15} {...ICONO} className="shrink-0" />
                <input
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                  placeholder="Buscar por nombre, @ o número"
                  aria-label="Buscar conversaciones"
                  className="min-w-0 flex-1 bg-transparent text-base text-fg placeholder:text-fg/35 focus:!shadow-none focus:outline-none sm:text-[13px]"
                />
                {texto && (
                  <button type="button" onClick={() => setTexto('')} aria-label="Borrar la búsqueda" className="grid h-7 w-7 place-items-center rounded-md text-fg/50 hover:bg-fg/[0.06] hover:text-fg">
                    <X size={14} {...ICONO} />
                  </button>
                )}
              </label>

              <div role="group" aria-label="Qué conversaciones ver" className={`mt-2.5 ${SEGMENTOS}`}>
                {FILTROS.map((f) => (
                  <button key={f} type="button" aria-pressed={f === vista.filtro} onClick={() => cambiar({ filtro: f })} className={segmento(f === vista.filtro)}>
                    <span className="truncate">{FILTRO_LABEL[f]}</span>
                  </button>
                ))}
              </div>

              {/* En la lista angosta, las redes que no están elegidas van solo con su ícono */}
              <div role="group" aria-label="Red" className={`mt-2 ${SEGMENTOS}`}>
                {([null, ...REDES] as const).map((r) => {
                  const on = r === vista.red
                  return (
                    <button
                      key={r ?? 'todas'}
                      type="button"
                      aria-pressed={on}
                      aria-label={r ? RED_LABEL[r] : 'Todas las redes'}
                      title={r ? RED_LABEL[r] : 'Todas las redes'}
                      onClick={() => cambiar({ red: r })}
                      className={segmento(on)}
                    >
                      {r ? (
                        <>
                          <CanalIcono canal={r} size={13} />
                          <span className={on ? 'truncate' : 'hidden truncate max-lg:inline 2xl:inline'}>{RED_LABEL[r]}</span>
                        </>
                      ) : (
                        'Todas'
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="mt-3 lg:relative lg:mt-0 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:overscroll-contain">
              {error && !filas ? (
                <Problema texto={error} onReintentar={() => void cargar(false)} />
              ) : !filas ? (
                <Cargando />
              ) : filas.length === 0 ? (
                <p className="px-4 py-10 text-center text-sm leading-relaxed text-fg/45">{textoVacio(vista)}</p>
              ) : (
                <>
                  <ul className={`overflow-hidden rounded-[20px] max-lg:divide-y max-lg:divide-fg/[0.06] ${TARJETA_TELEFONO} lg:space-y-0.5 lg:rounded-none lg:p-2`}>
                    {filas.map((f) => (
                      <Fila key={f.id} f={f} activa={f.id === abierta} busqueda={busqueda} reemplazar={!!abierta} ahora={ahora} />
                    ))}
                  </ul>
                  {error && <Problema texto={error} onReintentar={() => void cargar(false)} />}
                  {hayMas && (
                    <div className="flex justify-center pt-4 lg:px-3 lg:pb-3 lg:pt-1">
                      <button type="button" onClick={verMas} disabled={cargandoMas} className="pn-btn-glass inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium disabled:opacity-50 lg:w-full lg:justify-center">
                        {cargandoMas ? <Loader2 size={15} {...ICONO} className="animate-spin" /> : <ChevronDown size={15} {...ICONO} />}
                        {cargandoMas ? 'Cargando…' : 'Ver más'}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </section>

          <div className="lg:min-h-0">{children}</div>
        </div>
      </div>
    </Contexto.Provider>
  )
}

function Fila({ f, activa, busqueda, reemplazar, ahora }: { f: ConversacionLista; activa: boolean; busqueda: string; reemplazar: boolean; ahora: string }) {
  // Lo personal y el spam se ven, pero discretos
  const discreta = f.tipo === 'personal' || f.tipo === 'spam'
  return (
    <li>
      <Link
        href={`/crm/mensajes/${f.id}${busqueda}`}
        replace={reemplazar}
        scroll={false}
        aria-current={activa ? 'page' : undefined}
        className={`flex items-start gap-3 px-4 py-3.5 transition-colors lg:rounded-2xl lg:px-3 lg:py-3 ${activa ? 'bg-fg/[0.07]' : 'hover:bg-fg/[0.04]'} ${discreta && !activa ? 'opacity-60' : ''}`}
      >
        <FotoPersona nombre={f.nombre} foto={f.foto} canal={f.canal} />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-3">
            <p className={`truncate text-sm ${f.sinLeer ? 'font-semibold text-fg' : 'font-medium text-fg/85'}`}>
              {f.nombre}
              {f.tipo === 'personal' && <span className="font-normal text-fg/45"> · personal</span>}
              {f.tipo === 'spam' && <span className="font-normal text-fg/45"> · spam</span>}
            </p>
            {f.ultimoEn && <span className={`shrink-0 text-[11px] tabular-nums ${f.sinLeer ? 'font-medium text-fg/70' : 'text-fg/40'}`}>{haceCuanto(f.ultimoEn, new Date(ahora))}</span>}
          </div>
          <div className="mt-0.5 flex items-center gap-2">
            <p className={`min-w-0 flex-1 truncate text-[13px] ${f.sinLeer ? 'text-fg/80' : 'text-fg/50'}`}>
              <span className="sr-only">{RED_LABEL[f.canal]}: </span>
              {f.vistaPrevia}
            </p>
            {f.sinLeer && <span className="pn-signal" role="img" aria-label="Sin leer" />}
          </div>
          {f.pendiente && (
            <p className="mt-1.5 inline-flex max-w-full items-center gap-1.5 rounded-full bg-fg/[0.07] px-2.5 py-0.5 text-[11px] font-medium text-fg/80">
              <Bot size={12} {...ICONO} />
              <span className="truncate">{f.pendiente.respuesta ? 'Knox dejó una respuesta' : 'Knox te avisa'}</span>
            </p>
          )}
        </div>
      </Link>
    </li>
  )
}

function Cargando() {
  return (
    <div className="grid place-items-center py-14 text-fg/40" role="status">
      <Loader2 size={20} {...ICONO} className="animate-spin" />
      <span className="sr-only">Cargando</span>
    </div>
  )
}

function Problema({ texto, onReintentar }: { texto: string; onReintentar: () => void }) {
  return (
    <div role="alert" className="m-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-fg/[0.05] px-3.5 py-2.5 text-[13px] text-fg/70">
      <span>{texto}</span>
      <button type="button" onClick={onReintentar} className="font-medium text-fg underline-offset-2 hover:underline">
        Reintentar
      </button>
    </div>
  )
}

// En la compu, sin un chat elegido. En el teléfono no se ve: ahí manda la lista
export function SinSeleccion() {
  return (
    <div className={`hidden h-full flex-col items-center justify-center rounded-[20px] px-8 text-center lg:flex ${TARJETA}`}>
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-fg/[0.06] text-fg/70">
        <MessagesSquare size={24} {...ICONO} />
      </span>
      <p className="mt-4 text-[17px] font-semibold tracking-tight text-fg">Elige una conversación</p>
      <p className="mt-1.5 max-w-sm text-[13.5px] leading-relaxed text-fg/50">
        Toca un chat de la lista para leerlo y contestar por Instagram, Messenger o WhatsApp. Arriba puedes buscar a alguien o ver una sola red.
      </p>
    </div>
  )
}
