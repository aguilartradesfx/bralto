'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  BarChart3,
  CalendarClock,
  CalendarDays,
  DollarSign,
  Loader2,
  MessageCircle,
  Pause,
  Play,
  RefreshCw,
  UserPlus,
  Users,
  type LucideIcon,
} from 'lucide-react'
import type { Datos, Reporte, Tarjeta } from '@/lib/knox/tipos'
import './knox.css'

// Knox en el Inicio: al abrir el panel trae el reporte del día y lo dice en voz alta. Cada tarjeta aparece
// cuando Knox empieza a hablar de ella. El navegador solo deja sonar sin un toque si el sitio tiene permiso
// de reproducir solo; si no, Knox espera el primer toque. Con ?hablar vuelve a hablar aunque ya lo hayas oído.

type Fase = 'cargando' | 'preparando' | 'esperando' | 'hablando' | 'pausado' | 'terminado' | 'error'

const BARRAS = 22
const ORDEN: Tarjeta[] = ['cambio', 'leads', 'agenda', 'mensajes', 'publicaciones', 'seguidores', 'contenido']
const numero = new Intl.NumberFormat('es-CR')
const colones = new Intl.NumberFormat('es-CR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const hora = new Intl.DateTimeFormat('es-CR', { timeZone: 'America/Costa_Rica', hour: 'numeric', minute: '2-digit' })
const dia = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Costa_Rica' })

const clave = (id: string) => `knox-escuchado:${id}`
function yaEscuchado(id: string): boolean {
  try {
    return localStorage.getItem(clave(id)) === '1'
  } catch {
    return false
  }
}
function marcarEscuchado(id: string) {
  try {
    localStorage.setItem(clave(id), '1')
  } catch {
    // modo privado: Knox volverá a hablar la próxima vez
  }
}

function tieneDatos(t: Tarjeta, d: Datos): boolean {
  if (t === 'cambio') return Boolean(d.cambio)
  if (t === 'leads') return Boolean(d.leads)
  if (t === 'agenda') return Boolean(d.agenda)
  if (t === 'mensajes') return Boolean(d.conversaciones || d.redes)
  if (t === 'publicaciones') return Boolean(d.redes?.publicaciones.length)
  if (t === 'seguidores') return Boolean(d.redes?.instagram.length)
  if (t === 'contenido') return Boolean(d.contenido)
  return false
}

export function Knox() {
  const [reporte, setReporte] = useState<Reporte | null>(null)
  const [fase, setFase] = useState<Fase>('cargando')
  const [actual, setActual] = useState(-1)
  const [error, setError] = useState<string | null>(null)
  const audio = useRef<HTMLAudioElement | null>(null)
  const objeto = useRef<string | null>(null)
  const inicios = useRef<number[]>([])
  const indice = useRef(-1)
  const contexto = useRef<AudioContext | null>(null)
  const analizador = useRef<AnalyserNode | null>(null)
  const onda = useRef<HTMLDivElement | null>(null)
  const cuadro = useRef(0)

  // Cada cuadro: qué sección está sonando y la altura de cada barra de la onda
  const animar = useCallback(() => {
    const a = audio.current
    if (!a) return
    const t = a.currentTime
    let i = -1
    inicios.current.forEach((s, k) => {
      if (t + 0.05 >= s) i = k
    })
    if (i !== indice.current) {
      indice.current = i
      setActual(i)
    }
    const barras = onda.current?.children
    if (barras) {
      const frecuencias = new Uint8Array(64)
      analizador.current?.getByteFrequencyData(frecuencias)
      const centro = (barras.length - 1) / 2
      for (let k = 0; k < barras.length; k++) {
        const d = Math.abs(k - centro) / centro
        const v = analizador.current
          ? (frecuencias[1 + Math.round(d * 14)] / 255) * (1 - d * 0.35)
          : a.paused
            ? 0
            : (0.25 + 0.6 * Math.abs(Math.sin(t * 7.3 + d * 5)) * (0.6 + 0.4 * Math.sin(t * 2.1 + k))) * (1 - d * 0.45)
        ;(barras[k] as HTMLElement).style.transform = `scaleY(${Math.max(0.12, Math.min(1, v)).toFixed(3)})`
      }
    }
    if (!a.paused && !a.ended) cuadro.current = requestAnimationFrame(animar)
  }, [])

  // La onda de verdad sale del audio, pero solo si el navegador deja arrancar el sonido de la página;
  // si no, el audio suena directo y la onda se dibuja sola.
  const conectarOnda = useCallback(async () => {
    const a = audio.current
    if (!a || analizador.current) return
    try {
      const Contexto = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!Contexto) return
      const ctx = contexto.current ?? new Contexto()
      contexto.current = ctx
      if (ctx.state !== 'running') await Promise.race([ctx.resume(), new Promise((r) => setTimeout(r, 250))])
      if (ctx.state !== 'running') return
      const fuente = ctx.createMediaElementSource(a)
      const an = ctx.createAnalyser()
      an.fftSize = 128
      an.smoothingTimeConstant = 0.72
      fuente.connect(an)
      an.connect(ctx.destination)
      analizador.current = an
    } catch {
      analizador.current = null
    }
  }, [])

  const reproducir = useCallback(
    async (conToque: boolean) => {
      const a = audio.current
      if (!a) return
      if (a.ended) a.currentTime = 0
      try {
        if (conToque) await conectarOnda()
        await a.play()
        if (!conToque) void conectarOnda()
        setFase('hablando')
        cancelAnimationFrame(cuadro.current)
        cuadro.current = requestAnimationFrame(animar)
      } catch {
        setFase('esperando')
      }
    },
    [animar, conectarOnda],
  )

  const prepararAudio = useCallback(
    async (r: Reporte, hablar: boolean) => {
      audio.current?.pause()
      if (objeto.current) URL.revokeObjectURL(objeto.current)
      audio.current = null
      analizador.current = null
      inicios.current = r.inicios
      indice.current = -1
      setActual(-1)
      if (!r.conAudio) return setFase('terminado')
      const res = await fetch(`/api/knox/audio/${r.id}`)
      if (!res.ok) return setFase('terminado')
      objeto.current = URL.createObjectURL(await res.blob())
      const a = new Audio(objeto.current)
      a.preload = 'auto'
      a.addEventListener('ended', () => {
        marcarEscuchado(r.id)
        indice.current = -1
        setActual(-1)
        setFase('terminado')
      })
      a.addEventListener('pause', () => {
        if (!a.ended) setFase('pausado')
      })
      audio.current = a
      if (hablar) await reproducir(false)
      else setFase('terminado')
    },
    [reproducir],
  )

  useEffect(() => {
    let vivo = true
    ;(async () => {
      try {
        const res = await fetch('/api/knox', { cache: 'no-store' })
        const j = (await res.json()) as { reporte?: Reporte; error?: string }
        if (!res.ok || !j.reporte) throw new Error(j.error ?? 'Knox no respondió.')
        if (!vivo) return
        setReporte(j.reporte)
        const forzar = new URLSearchParams(window.location.search).has('hablar')
        await prepararAudio(j.reporte, forzar || !yaEscuchado(j.reporte.id))
      } catch (e) {
        if (!vivo) return
        setError(e instanceof Error ? e.message : 'Knox no respondió.')
        setFase('error')
      }
    })()
    return () => {
      vivo = false
      cancelAnimationFrame(cuadro.current)
      audio.current?.pause()
      if (objeto.current) URL.revokeObjectURL(objeto.current)
    }
  }, [prepararAudio])

  async function actualizar() {
    setFase('preparando')
    setError(null)
    try {
      const res = await fetch('/api/knox', { method: 'POST' })
      const j = (await res.json()) as { reporte?: Reporte; error?: string }
      if (!res.ok || !j.reporte) throw new Error(j.error ?? 'Knox no respondió.')
      setReporte(j.reporte)
      await prepararAudio(j.reporte, true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Knox no respondió.')
      setFase('error')
    }
  }

  const secciones = reporte?.secciones ?? []
  const datos = reporte?.datos
  const todas = fase === 'terminado'
  const reveladas = new Set(secciones.filter((_, i) => todas || (actual >= 0 && i <= actual)).map((s) => s.tarjeta))
  const dichas = [...new Set(secciones.map((s) => s.tarjeta))].filter((t) => ORDEN.includes(t))
  const orden = datos ? [...dichas, ...ORDEN.filter((t) => !dichas.includes(t) && tieneDatos(t, datos))] : []
  const hablandoDe = fase === 'hablando' || fase === 'pausado' ? secciones[actual]?.tarjeta : undefined
  const subtitulo =
    fase === 'hablando' || fase === 'pausado'
      ? secciones[actual]?.texto ?? ''
      : fase === 'esperando'
        ? 'Tengo listo tu resumen de hoy.'
        : fase === 'terminado'
          ? secciones[0]?.texto ?? ''
          : ''

  return (
    <section className="mb-10" aria-label="Knox, tu asistente">
      <div className="pn-glass relative overflow-hidden rounded-[28px] p-6 md:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center">
          <Image
            src={fase === 'hablando' ? '/knox/senalando.webp' : '/knox/pulgar.webp'}
            alt="Knox"
            width={360}
            height={540}
            priority
            className="knox-mascota mx-auto h-40 w-auto shrink-0 md:mx-0 md:h-52"
          />
          <div className="min-w-0 flex-1">
            <div className="knox-isla">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-white.svg" alt="Bralto" className="h-[14px] w-auto" />
              <div ref={onda} className="knox-onda" data-activa={fase === 'hablando'} aria-hidden>
                {Array.from({ length: BARRAS }, (_, k) => (
                  <i key={k} />
                ))}
              </div>
            </div>

            <p className="mt-4 text-[11px] uppercase tracking-[0.18em] text-fg/40">Knox · tu asistente</p>
            <div className="mt-2 min-h-[72px]" aria-live="polite">
              {fase === 'cargando' || fase === 'preparando' ? (
                <p className="flex items-center gap-2 text-base text-fg/60">
                  <Loader2 size={16} className="animate-spin" /> Knox está preparando tu resumen…
                </p>
              ) : fase === 'error' ? (
                <p className="text-base text-fg/60">{error}</p>
              ) : (
                <p key={`${fase}-${actual}`} className="knox-texto text-lg leading-relaxed text-fg md:text-xl">
                  {subtitulo}
                </p>
              )}
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              {fase === 'esperando' && (
                <>
                  <button onClick={() => reproducir(true)} className="pn-btn-solid inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium">
                    <Play size={15} /> Escuchar a Knox
                  </button>
                  <button onClick={() => setFase('terminado')} className="px-3 py-2 text-sm text-fg/50 hover:text-fg">
                    Ver sin audio
                  </button>
                </>
              )}
              {fase === 'hablando' && (
                <button onClick={() => audio.current?.pause()} className="pn-btn-glass inline-flex items-center gap-2 px-4 py-2 text-sm">
                  <Pause size={15} /> Pausa
                </button>
              )}
              {fase === 'pausado' && (
                <button onClick={() => reproducir(true)} className="pn-btn-solid inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium">
                  <Play size={15} /> Seguir
                </button>
              )}
              {fase === 'terminado' && reporte?.conAudio && (
                <button onClick={() => reproducir(true)} className="pn-btn-glass inline-flex items-center gap-2 px-4 py-2 text-sm">
                  <Play size={15} /> Escuchar de nuevo
                </button>
              )}
              {(fase === 'terminado' || fase === 'error') && (
                <button onClick={actualizar} className="pn-btn-glass inline-flex items-center gap-2 px-4 py-2 text-sm">
                  <RefreshCw size={14} /> Actualizar
                </button>
              )}
              {reporte && fase !== 'cargando' && fase !== 'preparando' && (
                <span className="text-xs text-fg/35">
                  {dia.format(new Date(reporte.creadoEn)) === dia.format(new Date()) ? 'Preparado hoy a las ' : 'Preparado el '}
                  {hora.format(new Date(reporte.creadoEn))}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {datos && orden.length > 0 && (
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {orden
            .filter((t) => reveladas.has(t) || todas)
            .map((t) => (
              <TarjetaKnox key={t} tarjeta={t} datos={datos} actual={hablandoDe === t} />
            ))}
        </div>
      )}
    </section>
  )
}

const ICONOS: Record<Tarjeta, LucideIcon> = {
  saludo: Users,
  cambio: DollarSign,
  leads: UserPlus,
  agenda: CalendarClock,
  mensajes: MessageCircle,
  publicaciones: BarChart3,
  seguidores: Users,
  contenido: CalendarDays,
  cierre: Users,
}

const TITULOS: Record<Tarjeta, string> = {
  saludo: '',
  cambio: 'Dólar hoy',
  leads: 'Leads · 24 horas',
  agenda: 'Agenda',
  mensajes: 'Mensajes',
  publicaciones: 'Publicaciones · 7 días',
  seguidores: 'Seguidores',
  contenido: 'Contenido',
  cierre: '',
}

function TarjetaKnox({ tarjeta, datos, actual }: { tarjeta: Tarjeta; datos: Datos; actual: boolean }) {
  const Icono = ICONOS[tarjeta]
  return (
    <div className="knox-tarjeta pn-glass min-w-0 rounded-[20px] p-5" data-actual={actual}>
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-fg/[0.06]">
          <Icono size={14} strokeWidth={1.6} className="text-fg/80" />
        </div>
        <p className="text-xs font-medium uppercase tracking-[0.12em] text-fg/50">{TITULOS[tarjeta]}</p>
        {actual && <span className="pn-signal ml-auto" />}
      </div>
      <Contenido tarjeta={tarjeta} datos={datos} />
    </div>
  )
}

const Linea = ({ izquierda, derecha }: { izquierda: React.ReactNode; derecha: React.ReactNode }) => (
  <div className="flex items-baseline justify-between gap-3 py-1 text-sm">
    <span className="min-w-0 truncate text-fg/70">{izquierda}</span>
    <span className="shrink-0 font-mono text-fg">{derecha}</span>
  </div>
)

const Vacio = ({ children }: { children: React.ReactNode }) => <p className="text-sm text-fg/45">{children}</p>

function Contenido({ tarjeta, datos }: { tarjeta: Tarjeta; datos: Datos }) {
  if (tarjeta === 'cambio' && datos.cambio) {
    return (
      <>
        <Linea izquierda="Venta" derecha={`₡${colones.format(datos.cambio.venta)}`} />
        <Linea izquierda="Compra" derecha={`₡${colones.format(datos.cambio.compra)}`} />
      </>
    )
  }

  if (tarjeta === 'leads' && datos.leads) {
    if (!datos.leads.length) return <Vacio>No entraron leads nuevos.</Vacio>
    return (
      <>
        <p className="mb-2 font-mono text-3xl text-fg">{datos.leads.length}</p>
        {datos.leads.slice(0, 4).map((l, i) => (
          <Linea key={i} izquierda={l.nombre} derecha={<span className="font-sans text-xs text-fg/45">{l.origen}</span>} />
        ))}
      </>
    )
  }

  if (tarjeta === 'agenda' && datos.agenda) {
    if (!datos.agenda.length) return <Vacio>Sin citas hoy ni mañana.</Vacio>
    return (
      <>
        {datos.agenda.slice(0, 4).map((c, i) => (
          <Linea
            key={i}
            izquierda={c.titulo}
            derecha={`${dia.format(new Date(c.inicio)) === dia.format(new Date()) ? 'Hoy' : 'Mañana'} ${hora.format(new Date(c.inicio))}`}
          />
        ))}
      </>
    )
  }

  if (tarjeta === 'mensajes') {
    const c = datos.conversaciones
    const comentarios = datos.redes?.comentarios ?? []
    return (
      <>
        {c && (
          <>
            <p className="font-mono text-3xl text-fg">{c.sinLeer}</p>
            <p className="mb-2 text-xs text-fg/45">sin responder en GoHighLevel</p>
            {Object.entries(c.porCanal)
              .sort((a, b) => b[1] - a[1])
              .map(([canal, n]) => (
              <Linea key={canal} izquierda={canal.charAt(0).toUpperCase() + canal.slice(1)} derecha={n} />
            ))}
          </>
        )}
        <Linea izquierda="Comentarios nuevos en Instagram" derecha={comentarios.length} />
        {comentarios[0] && <p className="mt-2 line-clamp-2 text-xs italic text-fg/50">«{comentarios[0].texto}»</p>}
      </>
    )
  }

  if (tarjeta === 'publicaciones' && datos.redes?.publicaciones.length) {
    const pubs = datos.redes.publicaciones
    const [ultima] = pubs
    const mejor = pubs.reduce((a, p) => ((p.vistas ?? 0) > (a.vistas ?? 0) ? p : a), ultima)
    const total = pubs.reduce((a, p) => a + (p.vistas ?? 0), 0)
    return (
      <>
        <p className="font-mono text-3xl text-fg">{numero.format(total)}</p>
        <p className="mb-2 text-xs text-fg/45">vistas en la semana</p>
        <a href={ultima.enlace ?? undefined} target="_blank" rel="noreferrer" className="block hover:opacity-80">
          <Linea izquierda={`Última: ${ultima.titulo}`} derecha={`${numero.format(ultima.vistas ?? 0)} vistas`} />
        </a>
        <p className="-mt-1 mb-1 text-xs text-fg/45">
          {ultima.meGusta} me gusta · {ultima.comentarios} comentarios{ultima.compartidos !== null ? ` · ${ultima.compartidos} compartidos` : ''}
        </p>
        {mejor !== ultima && (
          <a href={mejor.enlace ?? undefined} target="_blank" rel="noreferrer" className="block hover:opacity-80">
            <Linea izquierda={`La mejor: ${mejor.titulo}`} derecha={`${numero.format(mejor.vistas ?? 0)} vistas`} />
          </a>
        )}
      </>
    )
  }

  if (tarjeta === 'seguidores' && datos.redes) {
    return (
      <>
        {datos.redes.instagram.map((c) => (
          <Linea
            key={c.usuario}
            izquierda={`@${c.usuario}`}
            derecha={`${numero.format(c.seguidores)}${c.nuevosAyer ? ` (+${c.nuevosAyer})` : ''}`}
          />
        ))}
        {datos.redes.facebook.map((p) => (
          <Linea key={p.nombre} izquierda={`Facebook · ${p.nombre}`} derecha={numero.format(p.seguidores)} />
        ))}
      </>
    )
  }

  if (tarjeta === 'contenido' && datos.contenido) {
    const estados: Record<string, string> = { publicado: 'Publicado', programado: 'Programado', borrador: 'Sin aprobar', publicando: 'Saliendo', error: 'Con error' }
    return (
      <>
        {datos.contenido.hoy.length ? (
          datos.contenido.hoy.map((p, i) => (
            <Linea key={i} izquierda={`${p.hora} · ${p.titulo}`} derecha={<span className="font-sans text-xs text-fg/50">{estados[p.estado] ?? p.estado}</span>} />
          ))
        ) : (
          <Vacio>Hoy no hay nada programado.</Vacio>
        )}
        <div className="mt-3 flex items-center justify-between gap-3 border-t border-fg/10 pt-3 text-sm">
          <span className={datos.contenido.manana ? 'text-fg/70' : 'text-amber-300'}>
            {datos.contenido.manana ? `Mañana: ${datos.contenido.manana} listas` : 'Mañana: nada programado'}
          </span>
          <Link href="/calendario" className="text-xs text-fg/50 underline underline-offset-2 hover:text-fg">
            Ver calendario
          </Link>
        </div>
      </>
    )
  }

  return null
}
