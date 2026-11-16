'use client'

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { EstadoIdea, EstadoOficina, LineaTertulia, Marca, RespuestaOficina, Social } from '@/lib/oficina/tipos'
import { alFallar, conOptimistas, copiaSocial, marcasNuevas, soltarOptimistas, urlOficina, type CopiaSocial, type Optimista } from '@/lib/oficina/pagina'

// Los datos de la Oficina: pide /api/oficina al abrir y cada 15 s (no mientras la pestaña no se ve; al volver, de una vez).
// El foro, las ideas y las fotos viajan solo cuando cambian (urlOficina manda la firma de la copia que ya tenemos).
// «Me sirve», «No va» y el me gusta se ven al tiro (conOptimistas / soltarOptimistas); si no se guardan, vuelve lo que
// va a tener el servidor (alFallar). Desde aquí solo se escribe lo que la Oficina puede escribir: el «visto», el modo
// dormir, «Me sirve» / «No va» y el me gusta.

const CADA_MS = 15_000
const RELOJ_MS = 30_000
const AVISO_MS = 4_200
const SIN_CONEXION = 'No se pudo conectar. Prueba de nuevo en un rato.'
const NO_SE_PUDO = 'No se pudo cambiar el estado de la oficina. Prueba de nuevo en un rato.'
const NO_SE_GUARDO = 'No se pudo guardar. Prueba de nuevo.'

type Aviso = { id: number; texto: string }

const esLista = (x: unknown) => Array.isArray(x)

function esRespuesta(j: unknown): j is RespuestaOficina {
  if (!j || typeof j !== 'object') return false
  const r = j as Record<string, unknown>
  return typeof r.ahora === 'string' && !!r.oficina && typeof r.oficina === 'object' &&
    esLista(r.agentes) && esLista(r.marcas) && esLista(r.paraTi) && esLista(r.proximos) && esLista(r.chat) && esLista(r.pubs) &&
    esLista(r.teToca) && typeof r.firmaSocial === 'string' && typeof r.social === 'object' // social: el bloque o null
}

const json = (body: unknown): RequestInit => ({ method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })

export function usarOficina(
  inicial: RespuestaOficina | null,
  op: { alNuevas(marcas: Marca[], lineas: LineaTertulia[], r: RespuestaOficina): void },
) {
  const [r, setR] = useState<RespuestaOficina | null>(inicial)
  const [cargando, setCargando] = useState(inicial == null)
  const [sinSenal, setSinSenal] = useState(false)
  // la primera vez, la hora del servidor (así la página del servidor y la del navegador dicen lo mismo); después, la del reloj
  const [ahoraMs, setAhoraMs] = useState(() => (inicial ? Date.parse(inicial.ahora) : 0))
  const [ocultos, setOcultos] = useState<ReadonlySet<string>>(() => new Set())
  const [datosSocial, setDatosSocial] = useState<Social | null>(inicial?.social ?? null)
  // llegó una respuesta sin el foro y no hay copia: el servidor no lo pudo armar (se vuelve a pedir en cada consulta)
  const [sinSocial, setSinSocial] = useState(false)
  const [versionOptimista, setVersionOptimista] = useState(0)
  const [confirma, setConfirma] = useState(false)
  const [cambiando, setCambiando] = useState(false)
  const [errorSwitch, setErrorSwitch] = useState<string | null>(null)
  const [avisos, setAvisos] = useState<Aviso[]>([])

  const rRef = useRef<RespuestaOficina | null>(inicial)
  const primera = useRef(inicial) // la foto con que se abrió la página
  const copia = useRef<CopiaSocial | null>(null) // se arma al empezar a pedir: cuenta desde que la página abre
  const marcasVistas = useRef<Set<string> | null>(inicial ? new Set(inicial.marcas.map((m) => m.id)) : null)
  const lineasVistas = useRef<Set<string> | null>(inicial ? new Set(inicial.chat.map((l) => l.id)) : null)
  // lo que se ve encima de la copia del servidor (uno por idea o post) y, de cada uno, las escrituras que siguen en pie
  // (mandadas, en camino o ya guardadas, en el orden en que se mandaron)
  const optimista = useRef({ ideas: new Map<string, Optimista<EstadoIdea>>(), likes: new Map<string, Optimista<boolean>>() })
  const vivas = useRef({ ideas: new Map<string, Optimista<EstadoIdea>[]>(), likes: new Map<string, Optimista<boolean>[]>() })
  const generacion = useRef(0)
  const pedirYa = useRef<() => void>(() => {})
  const avisoId = useRef(0)
  const alNuevas = useRef(op.alNuevas)
  useLayoutEffect(() => {
    alNuevas.current = op.alNuevas
  })

  const avisar = useCallback((texto: string) => {
    setAvisos((cola) => [...cola, { id: ++avisoId.current, texto }].slice(-5))
  }, [])

  const aplicar = useCallback((nuevo: RespuestaOficina) => {
    const previo = rRef.current
    // con la base caída la ruta contesta sin agentes: si ya había datos, se queda lo último bueno
    if (!nuevo.agentes.length && previo && previo.agentes.length) {
      setSinSenal(true)
      return
    }
    const ahora = Date.now()
    if (nuevo.social) {
      copia.current = copiaSocial(nuevo, ahora)
      setDatosSocial(nuevo.social)
      setSinSocial(false)
    } else if (!copia.current?.firma) setSinSocial(true)
    // con social null y la misma firma (o '' si el servidor no pudo), se queda la copia que hay
    const marcas = marcasVistas.current ? marcasNuevas(marcasVistas.current, nuevo.marcas) : []
    marcasVistas.current = new Set(nuevo.marcas.map((m) => m.id))
    const vistas = lineasVistas.current
    const lineas = vistas ? nuevo.chat.filter((l) => !vistas.has(l.id)) : []
    lineasVistas.current = new Set(nuevo.chat.map((l) => l.id))
    rRef.current = nuevo
    setR(nuevo)
    setSinSenal(false)
    setCargando(false)
    setAhoraMs(ahora)
    // lo que ya abriste y el servidor ya no manda deja de estar oculto
    const pendientes = new Set(nuevo.paraTi.map((m) => m.id))
    setOcultos((prev) => {
      const quedan = [...prev].filter((id) => pendientes.has(id))
      return quedan.length === prev.size ? prev : new Set(quedan)
    })
    if (marcas.length || lineas.length) alNuevas.current(marcas, lineas, nuevo)
  }, [])

  // Pedir la foto al abrir y cada 15 s; mientras la pestaña no se ve no se pide, y al volver se pide de una vez
  useEffect(() => {
    let vivo = true
    let enCurso: AbortController | null = null
    if (!copia.current) copia.current = copiaSocial(primera.current, Date.now())
    async function pedir() {
      if (!vivo || enCurso || document.hidden) return
      const ctrl = new AbortController()
      enCurso = ctrl
      const gen = generacion.current
      const url = urlOficina(copia.current, Date.now())
      try {
        const res = await fetch(url, { cache: 'no-store', signal: ctrl.signal, headers: { accept: 'application/json' } })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const j: unknown = await res.json()
        if (!esRespuesta(j)) throw new Error('respuesta sin forma de oficina')
        if (vivo && gen === generacion.current) aplicar(j)
      } catch {
        if (vivo && !ctrl.signal.aborted) {
          setSinSenal(true)
          setCargando(false)
        }
      } finally {
        if (enCurso === ctrl) enCurso = null
      }
    }
    pedirYa.current = () => {
      enCurso?.abort()
      enCurso = null
      void pedir()
    }
    void pedir()
    const reloj = setInterval(() => void pedir(), CADA_MS)
    const alVer = () => {
      if (!document.hidden) void pedir()
    }
    document.addEventListener('visibilitychange', alVer)
    return () => {
      vivo = false
      clearInterval(reloj)
      document.removeEventListener('visibilitychange', alVer)
      enCurso?.abort()
      pedirYa.current = () => {}
    }
  }, [aplicar])

  // el reloj de la página (lo próximo, las horas del chat, la línea de ahora)
  useEffect(() => {
    setAhoraMs(Date.now())
    const t = setInterval(() => setAhoraMs(Date.now()), RELOJ_MS)
    return () => clearInterval(t)
  }, [])

  // lo optimista se suelta cuando el servidor ya lo confirma (o pasó demasiado); con él, sus escrituras: lo que quede
  // en camino ya no puede volver a taparlo
  useEffect(() => {
    const ahora = Date.now()
    const { ideas, likes } = optimista.current
    const a = soltarOptimistas(ideas, (id) => datosSocial?.ideas.find((i) => i.id === id)?.estado, ahora)
    const b = soltarOptimistas(likes, (id) => datosSocial?.foro.find((p) => p.id === id)?.te_gusta, ahora)
    for (const id of [...vivas.current.ideas.keys()]) if (!ideas.has(id)) vivas.current.ideas.delete(id)
    for (const id of [...vivas.current.likes.keys()]) if (!likes.has(id)) vivas.current.likes.delete(id)
    if (a || b) setVersionOptimista((v) => v + 1)
  }, [datosSocial, ahoraMs])

  // lo optimista vive en un ref: su versión avisa que cambió
  const social = useMemo<Social | null>(
    () => (datosSocial ? conOptimistas(datosSocial, optimista.current.ideas, optimista.current.likes) : null),
    [datosSocial, versionOptimista],
  )

  // Cambia al tiro y, si no se guarda, vuelve a lo que va a tener el servidor (la última escritura que sigue en pie, o
  // la copia del servidor si no queda ninguna) con un aviso. Dice si se guardó.
  const optimistaEn = useCallback(
    async <T,>(m: Map<string, Optimista<T>>, vivasDe: Map<string, Optimista<T>[]>, id: string, valor: T, url: string, cuerpo: unknown) => {
      const mio: Optimista<T> = { valor, desde: Date.now() }
      m.set(id, mio)
      vivasDe.set(id, [...(vivasDe.get(id) ?? []), mio])
      setVersionOptimista((v) => v + 1)
      try {
        const res = await fetch(url, json(cuerpo))
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        pedirYa.current()
        return true
      } catch {
        const antes = m.get(id)
        const r = alFallar(vivasDe.get(id) ?? [], antes, mio)
        if (r.vivas.length) vivasDe.set(id, r.vivas)
        else vivasDe.delete(id)
        if (r.visible !== (antes ?? null)) {
          if (r.visible) m.set(id, r.visible)
          else m.delete(id)
          setVersionOptimista((v) => v + 1)
        }
        avisar(NO_SE_GUARDO)
        return false
      }
    },
    [avisar],
  )

  const decidirIdea = useCallback(
    (id: string, accion: 'sirve' | 'no_va' | 'deshacer') =>
      optimistaEn(optimista.current.ideas, vivas.current.ideas, id, accion === 'deshacer' ? 'nueva' : accion, `/api/oficina/ideas/${encodeURIComponent(id)}`, { accion }),
    [optimistaEn],
  )

  const meGusta = useCallback(
    (id: string, si: boolean) =>
      optimistaEn(optimista.current.likes, vivas.current.likes, id, si, `/api/oficina/foro/${encodeURIComponent(id)}/me-gusta`, { si }),
    [optimistaEn],
  )

  // «Ver»: el enlace se abre solo (es un <a>); se marca como visto sin esperar y sale de «Para ti».
  // Se quita en la siguiente vuelta: si el <a> desaparece durante el clic, el navegador no lo abre.
  const ver = useCallback((m: Marca) => {
    setTimeout(() => setOcultos((prev) => new Set(prev).add(m.id)), 0)
    fetch('/api/oficina/visto', { ...json({ id: m.id }), keepalive: true })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
      })
      .catch(() => {
        // no se guardó: vuelve a aparecer para que no se pierda
        setTimeout(
          () =>
            setOcultos((prev) => {
              if (!prev.has(m.id)) return prev
              const n = new Set(prev)
              n.delete(m.id)
              return n
            }),
          0,
        )
      })
  }, [])

  // El switch de dormir: confirma en la página, espera la respuesta y vuelve a pedir la foto
  const cambiandoRef = useRef(false)
  const cambiar = useCallback(async () => {
    const actual = rRef.current
    if (!actual || cambiandoRef.current) return
    const dormir = !actual.oficina.dormida
    cambiandoRef.current = true
    setCambiando(true)
    setErrorSwitch(null)
    try {
      let res: Response
      try {
        res = await fetch('/api/oficina/dormir', json({ dormida: dormir }))
      } catch {
        throw new Error(SIN_CONEXION)
      }
      const j = (await res.json().catch(() => null)) as (Partial<EstadoOficina> & { error?: unknown }) | null
      if (!res.ok || !j || typeof j.dormida !== 'boolean') throw new Error(j && typeof j.error === 'string' && j.error ? j.error : NO_SE_PUDO)
      const estado: EstadoOficina = { dormida: j.dormida, desde: j.desde ?? null, por: j.por ?? null }
      // lo que venía en camino es de antes del cambio: no se usa
      generacion.current++
      const ultimo = rRef.current
      if (ultimo) {
        const nuevo = { ...ultimo, oficina: estado }
        rRef.current = nuevo
        setR(nuevo)
      }
      setConfirma(false)
      pedirYa.current()
    } catch (e) {
      setErrorSwitch(e instanceof Error && e.message ? e.message : NO_SE_PUDO)
    } finally {
      cambiandoRef.current = false
      setCambiando(false)
    }
  }, [])

  const dormir = useMemo(
    () => ({
      confirma,
      cambiando,
      error: errorSwitch,
      abrir: () => {
        setErrorSwitch(null)
        setConfirma(true)
      },
      cerrar: () => {
        if (!cambiandoRef.current) setConfirma(false)
      },
      cambiar,
    }),
    [confirma, cambiando, errorSwitch, cambiar],
  )

  // los avisos de abajo, uno a la vez
  const aviso = avisos[0] ?? null
  useEffect(() => {
    if (!aviso) return
    const t = setTimeout(() => setAvisos((c) => c.slice(1)), AVISO_MS)
    return () => clearTimeout(t)
  }, [aviso])

  const paraTi = useMemo(() => (r ? r.paraTi.filter((m) => !ocultos.has(m.id)) : []), [r, ocultos])
  const ahora = useMemo(() => new Date(ahoraMs), [ahoraMs])

  return { r, social, cargando, sinSenal, sinSocial, ahora, paraTi, ver, dormir, decidirIdea, meGusta, aviso, avisar }
}
