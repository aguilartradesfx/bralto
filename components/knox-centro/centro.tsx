'use client'

import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Reporte, Tarjeta } from '@/lib/knox/tipos'
import type { Centro } from '@/lib/knox/centro/tipos'
import { enVivo, fijo, trozos, type Subtitulo } from '@/lib/knox/centro/subtitulo'
import {
  fuentesRevisadas,
  MODO_CENTRO,
  ofrecerRespuestas,
  preguntaAprobar,
  proximo,
  reporteViejo,
  resultadoAprobar,
  textoProximo,
} from '@/lib/knox/centro/armar'
import { hora, minutosYSegundos } from '@/lib/knox/centro/formato'
import { arco, BARRAS, C, envolvente, ondaQuieta, P, svgFlujos, svgFondo } from './geometria'
import { Hud, type Anotacion, type Estado, type FaseVoz, type RefsHud } from './hud'
import * as Paneles from './paneles'
import type { Panel } from './paneles'
import { Polvo } from './polvo'
import './centro.css'

// El Centro de mando de Knox (/knox), a pantalla completa en la app de Mac y en el navegador. Trae el último reporte
// hablado (/api/knox) y lo dice en voz alta; si es de otro día o tiene más de 5 horas, primero le pide uno nuevo. Los
// paneles salen de /api/knox/centro, que pregunta cada minuto. La app de Mac (KnoxMac en el user agent) deja sonar
// sin un toque; en el navegador, si no deja, Knox espera el primer toque. ?hablar: habla aunque ya lo hayas oído.

export type Demo = { centro: Centro; reporte: Reporte; fase: FaseVoz; segundo: number; duracion: number; ahora: string }

// Los paneles se vuelven a dibujar solo si cambian sus datos (el subtítulo cambia varias veces por segundo)
const Cabecera = memo(Paneles.Cabecera)
const Clientes = memo(Paneles.Clientes)
const Esperando = memo(Paneles.Esperando)
const Embudo = memo(Paneles.Embudo)
const Instagram = memo(Paneles.Instagram)
const Mejor = memo(Paneles.Mejor)
const TuDia = memo(Paneles.TuDia)
const Pulso = memo(Paneles.Pulso)

const CADA_MS = 60_000
const RAYA = '—'
const PANEL_DE: Partial<Record<Tarjeta, Panel>> = {
  cambio: 'dolar',
  leads: 'clientes',
  mensajes: 'esperando',
  publicaciones: 'mejor',
  seguidores: 'instagram',
  agenda: 'dia',
  contenido: 'dia',
}

const QUIETA = ondaQuieta()
const ENV = Array.from({ length: 91 }, (_, j) => envolvente(j))
const COS = BARRAS.map((b) => Math.cos(((b.grados - 90) * Math.PI) / 180))
const SIN = BARRAS.map((b) => Math.sin(((b.grados - 90) * Math.PI) / 180))
const CIRCULO = `M${C} ${C - 226}A226 226 0 1 1 ${C - 0.01} ${C - 226}`
const FONDO = svgFondo()
const FLUJOS = svgFlujos()

// Lo mismo que guarda el Inicio del panel: lo que ya se oyó en un lado no se repite en el otro
const claveEscuchado = (id: string) => `knox-escuchado:${id}`
function yaEscuchado(id: string): boolean {
  try {
    return localStorage.getItem(claveEscuchado(id)) === '1'
  } catch {
    return false
  }
}
function marcarEscuchado(id: string) {
  try {
    localStorage.setItem(claveEscuchado(id), '1')
  } catch {
    // modo privado: Knox volverá a hablar la próxima vez
  }
}

async function pedirReporte(metodo: 'GET' | 'POST'): Promise<Reporte> {
  const res = await fetch('/api/knox', { method: metodo, cache: 'no-store' })
  if (res.status === 401) {
    window.location.href = '/login'
    throw new Error('Tu sesión venció.')
  }
  const j = (await res.json().catch(() => ({}))) as { reporte?: Reporte; error?: string }
  if (!res.ok || !j.reporte) throw new Error(j.error ?? 'Knox no respondió.')
  return j.reporte
}

// El lienzo de 1920×1080 cabe entero en la ventana (con bordes negros)
function escalar() {
  document.documentElement.style.setProperty('--kc-escala', String(Math.min(window.innerWidth / 1920, window.innerHeight / 1080)))
}

export function CentroKnox({ iniciales, demo }: { iniciales: string; demo?: Demo }) {
  const [centro, setCentro] = useState<Centro | null>(demo?.centro ?? null)
  const [reporte, setReporte] = useState<Reporte | null>(demo?.reporte ?? null)
  const [fase, setFase] = useState<FaseVoz>(demo?.fase ?? 'cargando')
  const [sub, setSub] = useState<Subtitulo | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const [ahora, setAhora] = useState<Date | null>(null)
  const [confirmar, setConfirmar] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [destello, setDestello] = useState(false)
  const [conAudio, setConAudio] = useState(!!demo)

  const faseRef = useRef<FaseVoz>(fase)
  const audio = useRef<HTMLAudioElement | null>(null)
  const escuchas = useRef<AbortController | null>(null)
  const objeto = useRef<string | null>(null)
  const contexto = useRef<AudioContext | null>(null)
  const analizador = useRef<AnalyserNode | null>(null)
  const conectado = useRef<HTMLAudioElement | null>(null)
  const textos = useRef<string[]>([])
  const inicios = useRef<number[]>([])
  const claveSub = useRef('')
  const esMac = useRef(false)
  const refrescado = useRef(false)
  const relojAviso = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const lienzo = useRef<HTMLDivElement>(null)
  const nucleo = useRef<HTMLDivElement>(null)
  const onda = useRef<SVGGElement>(null)
  const ondaDentro = useRef<SVGGElement>(null)
  const arcoVoz = useRef<SVGPathElement>(null)
  const punta = useRef<SVGGElement>(null)
  const barra = useRef<HTMLElement>(null)
  const tiempo = useRef<HTMLElement>(null)
  // El mismo objeto siempre: así el núcleo no se vuelve a dibujar con cada palabra del subtítulo
  const refs: RefsHud = useMemo(
    () => ({ nucleo, onda, ondaDentro, arco: arcoVoz, punta, barra, tiempo }),
    [],
  )

  const ponerFase = useCallback((f: FaseVoz) => {
    faseRef.current = f
    setFase(f)
  }, [])

  const mostrarAviso = useCallback((texto: string) => {
    clearTimeout(relojAviso.current)
    setAviso(texto)
    relojAviso.current = setTimeout(() => setAviso(null), 9000)
  }, [])

  // Audio ---------------------------------------------------------------------------------------------------------

  const detener = useCallback(() => {
    escuchas.current?.abort()
    escuchas.current = null
    audio.current?.pause()
    if (objeto.current) URL.revokeObjectURL(objeto.current)
    audio.current = null
    objeto.current = null
    analizador.current = null
    setConAudio(false)
  }, [])

  // Con un toque (o en la app de Mac) el contexto de audio arranca: así la onda sale de la voz de verdad
  const despertarAudio = useCallback(() => {
    try {
      const Contexto = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!Contexto) return
      const ctx = contexto.current ?? new Contexto()
      contexto.current = ctx
      if (ctx.state !== 'running') void ctx.resume()
    } catch {
      // sin Web Audio, la onda se dibuja sola
    }
  }, [])

  // Solo se conecta si el contexto ya corre: conectado a uno detenido, el audio no suena
  const conectarOnda = useCallback(async () => {
    const a = audio.current
    if (!a || conectado.current === a) return
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
      // La voz de ElevenLabs viene fuerte: con el techo más arriba, la onda no se llena toda
      an.minDecibels = -88
      an.maxDecibels = -12
      fuente.connect(an)
      an.connect(ctx.destination)
      analizador.current = an
      conectado.current = a
    } catch {
      analizador.current = null
    }
  }, [])

  const reproducir = useCallback(
    async (conToque: boolean) => {
      const a = audio.current
      if (!a) return
      if (a.ended) a.currentTime = 0
      const directo = conToque || esMac.current
      try {
        if (directo) await conectarOnda()
        await a.play()
        if (!directo) void conectarOnda()
        ponerFase('hablando')
      } catch {
        // El navegador no deja sonar sin un toque
        ponerFase('esperando')
      }
    },
    [conectarOnda, ponerFase],
  )

  const preparar = useCallback(
    async (r: Reporte, hablar: boolean, conToque = false) => {
      detener()
      textos.current = r.secciones.map((s) => s.texto)
      inicios.current = r.inicios
      claveSub.current = ''
      setSub(null)
      if (!r.conAudio) return ponerFase('terminado')
      const res = await fetch(`/api/knox/audio/${r.id}`).catch(() => null)
      if (!res?.ok) return ponerFase('terminado')
      objeto.current = URL.createObjectURL(await res.blob())
      const a = new Audio(objeto.current)
      a.preload = 'auto'
      const control = new AbortController()
      escuchas.current = control
      a.addEventListener(
        'ended',
        () => {
          marcarEscuchado(r.id)
          ponerFase('terminado')
        },
        { signal: control.signal },
      )
      a.addEventListener('pause', () => !a.ended && ponerFase('pausado'), { signal: control.signal })
      a.addEventListener('play', () => ponerFase('hablando'), { signal: control.signal })
      audio.current = a
      setConAudio(true)
      if (hablar) await reproducir(conToque)
      else ponerFase('terminado')
    },
    [detener, ponerFase, reproducir],
  )

  // Datos ---------------------------------------------------------------------------------------------------------

  const cargarCentro = useCallback(async () => {
    try {
      const res = await fetch('/api/knox/centro', { cache: 'no-store' })
      if (res.status === 401) {
        window.location.href = '/login'
        return
      }
      if (!res.ok) return
      const j = (await res.json()) as { centro?: Centro }
      if (j.centro) setCentro(j.centro)
    } catch {
      // la próxima vuelta lo intenta de nuevo
    }
  }, [])

  useEffect(() => {
    escalar()
    window.addEventListener('resize', escalar)
    return () => window.removeEventListener('resize', escalar)
  }, [])

  useEffect(() => {
    if (demo) return setAhora(new Date(demo.ahora))
    setAhora(new Date())
    const id = setInterval(() => setAhora(new Date()), 15_000)
    return () => clearInterval(id)
  }, [demo])

  useEffect(() => {
    if (demo) return
    void cargarCentro()
    const id = setInterval(() => document.visibilityState === 'visible' && void cargarCentro(), CADA_MS)
    return () => clearInterval(id)
  }, [demo, cargarCentro])

  // Al abrir: el último reporte; si está viejo, uno nuevo (una sola vez). Después, a hablar
  useEffect(() => {
    if (demo) return
    esMac.current = navigator.userAgent.includes('KnoxMac')
    let vivo = true
    const demora = setTimeout(() => vivo && faseRef.current === 'cargando' && ponerFase('revisando'), 2500)
    ;(async () => {
      const forzar = new URLSearchParams(window.location.search).has('hablar')
      try {
        let r = await pedirReporte('GET')
        if (!vivo) return
        setReporte(r)
        if (!refrescado.current && reporteViejo(r, new Date())) {
          refrescado.current = true
          ponerFase('revisando')
          try {
            r = await pedirReporte('POST')
            if (!vivo) return
            setReporte(r)
          } catch {
            mostrarAviso('Knox no pudo revisar de nuevo. Te cuento lo último que tengo.')
          }
        }
        clearTimeout(demora)
        await preparar(r, forzar || !yaEscuchado(r.id))
      } catch (e) {
        if (!vivo) return
        setError(e instanceof Error ? e.message : 'Knox no respondió.')
        ponerFase('error')
      }
    })()
    return () => {
      vivo = false
      clearTimeout(demora)
      detener()
    }
  }, [demo, detener, mostrarAviso, ponerFase, preparar])

  // Cuadro a cuadro: la onda (de la voz de verdad si hay analizador), el anillo de avance, el tiempo y el subtítulo
  useEffect(() => {
    const lineas = Array.from(refs.onda.current?.children ?? []) as SVGLineElement[]
    const internas = Array.from(refs.ondaDentro.current?.children ?? []) as SVGLineElement[]
    const previos = new Float32Array(BARRAS.length)
    const bins = new Uint8Array(64)
    const reducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let textoTiempo = '-'
    let arcoVisible = true
    let nivelPrevio = -1
    let vuelta = 0
    let raf = 0

    const pintarBarra = (i: number, v: number) => {
      const L = 3 + 42 * Math.max(0, Math.min(1, v))
      const ln = lineas[i]
      const li = internas[i]
      if (ln) {
        ln.setAttribute('x2', (C + (180 + L) * COS[i]).toFixed(1))
        ln.setAttribute('y2', (C + (180 + L) * SIN[i]).toFixed(1))
        ln.setAttribute('stroke-opacity', (0.28 + (0.72 * L) / 45).toFixed(2))
      }
      if (li) {
        const r = 175 - L * 0.22
        li.setAttribute('x2', (C + r * COS[i]).toFixed(1))
        li.setAttribute('y2', (C + r * SIN[i]).toFixed(1))
      }
    }

    const cuadro = (ms: number) => {
      const t = demo ? demo.segundo : ms / 1000
      const a = audio.current
      const f = demo ? demo.fase : faseRef.current
      const an = demo ? null : analizador.current
      const sonando = demo ? f === 'hablando' : !!a && !a.paused && !a.ended
      const pos = demo ? demo.segundo : (a?.currentTime ?? 0)
      const dur = demo ? demo.duracion : a && Number.isFinite(a.duration) ? a.duration : Number.NaN
      const hayAudio = demo ? true : !!a
      const busca = f === 'revisando' || f === 'cargando'
      if (an && sonando) an.getByteFrequencyData(bins)

      // La onda: quieta con poco movimiento si no habla; cada 3 cuadros basta
      vuelta++
      if (demo || sonando || busca || vuelta % 3 === 0) {
        for (let i = 0; i < BARRAS.length; i++) {
          const { j, grados } = BARRAS[i]
          let v: number
          if (sonando && an) {
            // La voz vive entre ~300 Hz y ~4,5 kHz (los primeros 12 casilleros de 375 Hz): ahí se reparten las rayas
            const a1 = bins[1 + ((j * 7) % 12)]
            const a2 = bins[1 + Math.round((Math.abs(j - 45) / 45) * 5)]
            v = Math.min(1, Math.pow((0.6 * a1 + 0.4 * a2) / 255, 1.15) * 1.3) * ENV[j]
          } else if (sonando && !demo) {
            v = (0.25 + 0.6 * Math.abs(Math.sin(t * 7.3 + j * 0.21)) * (0.6 + 0.4 * Math.sin(t * 2.1 + j * 0.5))) * ENV[j]
          } else if (sonando) {
            v = QUIETA[j] * ENV[j]
          } else if (busca && !reducido) {
            const s = (t * 140) % 360
            const d = Math.min(Math.abs(grados - s), 360 - Math.abs(grados - s))
            v = QUIETA[j] * ENV[j] * 0.22 + 0.62 * Math.max(0, 1 - d / 46) ** 2
          } else {
            v = QUIETA[j] * ENV[j] * (0.3 + (reducido ? 0 : 0.06 * Math.sin(t * 1.3)))
          }
          previos[i] = demo ? v : previos[i] + (v - previos[i]) * (sonando ? 0.5 : 0.18)
          pintarBarra(i, previos[i])
        }
      }

      // Qué tan fuerte suena (el brillo naranja de atrás)
      let nivel = 0
      if (sonando && an) {
        let suma = 0
        for (let k = 1; k <= 16; k++) suma += bins[k]
        nivel = suma / 16 / 255
      } else if (sonando) nivel = demo ? 0.5 : 0.35 + 0.15 * Math.sin(t * 6)
      if (Math.abs(nivel - nivelPrevio) > 0.01) {
        lienzo.current?.style.setProperty('--kc-nivel', nivel.toFixed(3))
        nivelPrevio = nivel
      }

      // El anillo de avance y el tiempo
      const fraccion = dur > 0 ? Math.min(1, Math.max(0, pos / dur)) : 0
      const verArco = hayAudio && pos > 0.05 && !busca && f !== 'error'
      const arcoEl = refs.arco.current
      const puntaEl = refs.punta.current
      if (arcoEl && puntaEl) {
        if (verArco) {
          const g = fraccion * 360
          arcoEl.setAttribute('d', g >= 359.5 ? CIRCULO : arco(C, C, 226, 0, Math.max(0.5, g)))
          const [x, y] = P(C, C, 226, g)
          puntaEl.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)})`)
          if (!arcoVisible) puntaEl.style.display = ''
          arcoVisible = true
        } else if (arcoVisible) {
          arcoEl.setAttribute('d', '')
          puntaEl.style.display = 'none'
          arcoVisible = false
        }
      }
      if (refs.barra.current) refs.barra.current.style.width = `${(fraccion * 100).toFixed(2)}%`
      const texto = hayAudio && !busca && f !== 'error' ? `${minutosYSegundos(pos)} / ${Number.isFinite(dur) ? minutosYSegundos(dur) : '--:--'}` : ''
      if (texto !== textoTiempo && refs.tiempo.current) {
        refs.tiempo.current.textContent = texto
        textoTiempo = texto
      }

      // El subtítulo cambia cuando cambia la palabra
      if (f === 'hablando' || f === 'pausado') {
        const s = enVivo(textos.current, inicios.current, dur, pos)
        if (s) {
          const clave = `${s.seccion}-${s.trozo}-${s.palabras.findIndex((p) => p.estado === 'actual')}`
          if (clave !== claveSub.current) {
            claveSub.current = clave
            setSub(s)
          }
        }
      }
      if (!demo) raf = requestAnimationFrame(cuadro)
    }

    if (demo) {
      textos.current = demo.reporte.secciones.map((s) => s.texto)
      inicios.current = demo.reporte.inicios
      cuadro(0)
      return
    }
    raf = requestAnimationFrame(cuadro)
    return () => cancelAnimationFrame(raf)
    // Las refs no cambian: el cuadro a cuadro arranca una vez
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demo])

  // Acciones ------------------------------------------------------------------------------------------------------

  const alOrbe = useCallback(() => {
    const a = audio.current
    if (!a) return
    if (faseRef.current === 'hablando') a.pause()
    else void reproducir(true)
  }, [reproducir])

  const escuchar = useCallback(() => {
    const a = audio.current
    if (!a) return
    a.currentTime = 0
    void reproducir(true)
  }, [reproducir])

  const actualizar = useCallback(async () => {
    despertarAudio()
    detener()
    setError(null)
    ponerFase('revisando')
    try {
      const r = await pedirReporte('POST')
      setReporte(r)
      await preparar(r, true, true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Knox no respondió.')
      ponerFase('error')
    }
  }, [despertarAudio, detener, ponerFase, preparar])

  const aprobar = useCallback(async () => {
    const ids = centro?.esperando?.borradores ?? []
    if (ids.length === 0) return setConfirmar(false)
    setEnviando(true)
    try {
      const res = await fetch('/api/knox/centro/aprobar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      })
      const j = (await res.json().catch(() => ({}))) as { enviadas?: number; fallidas?: number; error?: string }
      mostrarAviso(res.ok ? resultadoAprobar({ enviadas: j.enviadas ?? 0, fallidas: j.fallidas ?? 0 }) : (j.error ?? 'No se pudieron mandar. Prueba desde Mensajes.'))
    } catch {
      mostrarAviso('No hubo conexión. Prueba de nuevo.')
    } finally {
      setEnviando(false)
      setConfirmar(false)
      void cargarCentro()
    }
  }, [centro, cargarCentro, mostrarAviso])

  const cancelar = useCallback(() => setConfirmar(false), [])

  const verConexiones = useCallback(() => {
    setDestello(false)
    requestAnimationFrame(() => setDestello(true))
    setTimeout(() => setDestello(false), 1900)
  }, [])

  // Lo que se ve -----------------------------------------------------------------------------------------------------

  const borradores = centro?.esperando?.borradores.length ?? 0
  const hablando = fase === 'hablando' || fase === 'pausado'
  const tarjeta = hablando && sub ? reporte?.secciones[sub.seccion]?.tarjeta : undefined
  const hablaDe = tarjeta ? (PANEL_DE[tarjeta] ?? null) : null

  const estado: Estado = useMemo(() => {
    if (fase === 'hablando') return { texto: 'Knox está hablando', late: true, barra: 'avance' }
    if (fase === 'pausado') return { texto: 'Knox en pausa', late: false, barra: 'avance' }
    if (fase === 'revisando' || fase === 'cargando') return { texto: 'Knox está revisando', late: true, barra: 'busca' }
    if (fase === 'esperando') return { texto: 'Knox tiene tu resumen', late: true, barra: 'avance' }
    if (fase === 'error') return { texto: 'Knox no respondió', late: false, barra: null }
    return { texto: reporte ? `Resumen de las ${hora(reporte.creadoEn)}` : 'Resumen de hoy', late: false, barra: conAudio || demo ? 'avance' : null }
  }, [fase, reporte, conAudio, demo])

  const subtitulo = useMemo(() => {
    if (aviso) return { clave: `aviso-${aviso}`, palabras: fijo(aviso), tenue: false }
    if (fase === 'hablando' || fase === 'pausado') return sub ? { clave: `${sub.seccion}-${sub.trozo}`, palabras: sub.palabras, tenue: false } : null
    if (fase === 'revisando') return { clave: 'revisando', palabras: fijo('Knox está revisando tus fuentes…'), tenue: true }
    if (fase === 'cargando') return null
    if (fase === 'esperando') return { clave: 'esperando', palabras: fijo('Tengo listo tu resumen de hoy.'), tenue: false }
    if (fase === 'error') return { clave: 'error', palabras: fijo(error ?? 'Knox no respondió.'), tenue: true }
    if (borradores > 0) {
      const o = ofrecerRespuestas(borradores)
      return { clave: `ofrece-${borradores}`, palabras: [...fijo(o.dice), ...fijo(o.pregunta).map((p) => ({ ...p, estado: 'falta' as const }))], tenue: false }
    }
    const cierre = reporte?.secciones[reporte.secciones.length - 1]?.texto
    if (!cierre) return null
    const partes = trozos(cierre)
    return { clave: 'cierre', palabras: fijo(cierre.length <= 160 ? cierre : partes[partes.length - 1]), tenue: false }
  }, [aviso, fase, sub, error, borradores, reporte])

  const reviso: Anotacion = reporte
    ? { valor: `${fuentesRevisadas(reporte.datos?.faltan)} fuentes`, detalle: fase === 'revisando' ? 'revisando ahora…' : `a las ${hora(reporte.creadoEn)}` }
    : { valor: RAYA, detalle: fase === 'revisando' || fase === 'cargando' ? 'revisando…' : '' }
  const modo: Anotacion = centro?.modo ? { valor: MODO_CENTRO[centro.modo].nombre, detalle: MODO_CENTRO[centro.modo].detalle } : { valor: RAYA, detalle: '' }
  const siguiente = centro?.dia && ahora ? proximo(centro.dia.items, ahora) : null
  const prox: Anotacion = siguiente ? { valor: hora(siguiente.en), detalle: textoProximo(siguiente) } : { valor: RAYA, detalle: centro?.dia ? 'nada más hoy' : '' }

  return (
    <div className="kc">
      <div className="lienzo" ref={lienzo}>
        <Polvo />
        <div className="orb o1" />
        <div className="orb o2" />
        <div className="orb o3" />
        <div className="orb o4" />
        <div className="orb ocore" />
        <div className="floor" />
        <svg className="bg" viewBox="0 0 1920 1080" aria-hidden dangerouslySetInnerHTML={{ __html: FONDO }} />
        <svg className="bg" viewBox="0 0 1920 1080" aria-hidden dangerouslySetInnerHTML={{ __html: FLUJOS }} />

        <Cabecera
          centro={centro}
          iniciales={iniciales}
          ahora={ahora}
          relojFijo={demo ? new Date(demo.ahora) : null}
          hablaDolar={hablaDe === 'dolar'}
          onConexiones={verConexiones}
        />

        <section className="col left" aria-label="Clientes y ventas">
          <Clientes datos={centro?.clientes ?? null} habla={hablaDe === 'clientes'} />
          <Esperando datos={centro?.esperando ?? null} ahora={ahora} habla={hablaDe === 'esperando'} />
          <Embudo datos={centro?.embudo ?? null} />
        </section>

        <Hud
          fase={fase}
          refs={refs}
          estado={estado}
          subtitulo={subtitulo}
          reviso={reviso}
          modo={modo}
          proximo={prox}
          borradores={borradores}
          conAudio={conAudio}
          confirmar={confirmar ? { pregunta: preguntaAprobar(borradores), uno: borradores === 1 } : null}
          enviando={enviando}
          onOrbe={demo ? () => undefined : conAudio ? alOrbe : null}
          onEscuchar={escuchar}
          onActualizar={() => void actualizar()}
          onPedirAprobar={() => setConfirmar(true)}
          onAprobar={() => void aprobar()}
          onCancelar={cancelar}
        />

        <section className="col right" aria-label="Redes y agenda">
          <Instagram datos={centro?.instagram ?? null} habla={hablaDe === 'instagram'} />
          <Mejor datos={centro ? centro.mejor : null} habla={hablaDe === 'mejor'} />
          <TuDia datos={centro?.dia ?? null} ahora={ahora} habla={hablaDe === 'dia'} />
        </section>

        <Pulso datos={centro?.pulso ?? null} conexiones={centro?.conexiones ?? null} ahora={ahora} destello={destello} />

        <div className="vignette" />
        <div className="grain" />
        <div className="frame">
          <i className="fc tl" />
          <i className="fc tr" />
          <i className="fc bl" />
          <i className="fc br" />
          <div className="fcoord" style={{ left: 48 }}>
            9.9281° N · 84.0907° O · San José, Costa Rica
          </div>
          <div className="fcoord" style={{ right: 48 }}>
            Knox OS 1.0 · Bralto
          </div>
        </div>
      </div>
    </div>
  )
}
