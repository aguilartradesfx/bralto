'use client'

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { Silkscreen } from 'next/font/google'
import type { EstadoAgente, EstadoOficina, Marca, Snapshot } from '@/lib/oficina/tipos'
import { crearMundo } from '@/lib/oficina/mundo'
import { FRASES_SUENO } from '@/lib/oficina/frases-sueno'
import { avisoDormida, chipsDe, encabezadoCR, lasCR, marcasNuevas, nombreDe, recortar, textoPlano, trabajandoAhora } from '@/lib/oficina/pagina'
import { crearPlano } from './pixel/plano'
import { COL, crearVista } from './pixel/vista'
import { Ficha } from './ficha'
import { LineaDia } from './linea-dia'
import { Panel } from './panel'
import './oficina.css'

// La Oficina de Knox: el loft en pixel art con los 24 Knox, el plano, la línea del día, el panel de al lado y la ficha.
// Lee /api/oficina cada 15 s (no mientras la pestaña no se ve), anima las marcas nuevas y tiene el switch de dormir.
// Solo lee, abre enlaces y cambia el modo dormir: no publica, no aprueba ni borra nada.

const pixel = Silkscreen({ weight: '400', subsets: ['latin'], variable: '--of-pixel', display: 'swap' })

type Vista = 'maqueta' | 'plano' | 'dia'
const VISTAS: [Vista, string][] = [['maqueta', 'Maqueta'], ['plano', 'Plano'], ['dia', 'Maqueta y día']]
const CLAVE_VISTA = 'oficina-vista'
const CADA_MS = 15_000
const FRESCA_MS = 10 * 60_000 // las marcas más viejas no se animan (ya pasaron)
const AVISO_MS = 4_200
const SIN_CONEXION = 'No se pudo conectar. Prueba de nuevo en un rato.'
const NO_SE_PUDO = 'No se pudo cambiar el estado de la oficina. Prueba de nuevo en un rato.'

type Vista2D = ReturnType<typeof crearVista>
type Plano2D = ReturnType<typeof crearPlano>

function esSnapshot(j: unknown): j is Snapshot {
  if (!j || typeof j !== 'object') return false
  const s = j as Record<string, unknown>
  return typeof s.ahora === 'string' && !!s.oficina && typeof s.oficina === 'object' &&
    Array.isArray(s.agentes) && Array.isArray(s.marcas) && Array.isArray(s.paraTi) && Array.isArray(s.proximos)
}

export function Oficina({ inicial }: { inicial: Snapshot | null }) {
  const [snap, setSnap] = useState<Snapshot | null>(inicial)
  const [cargando, setCargando] = useState(inicial == null)
  const [sinSenal, setSinSenal] = useState(false)
  const [ahoraMs, setAhoraMs] = useState(() => (inicial ? Date.parse(inicial.ahora) : 0))
  const [vista, setVista] = useState<Vista>('maqueta')
  const [ficha, setFicha] = useState<{ id: string | null; abierta: boolean }>({ id: null, abierta: false })
  const [ocultos, setOcultos] = useState<ReadonlySet<string>>(() => new Set())
  const [confirma, setConfirma] = useState(false)
  const [cambiando, setCambiando] = useState(false)
  const [errorSwitch, setErrorSwitch] = useState<string | null>(null)
  const [avisos, setAvisos] = useState<{ id: number; texto: string }[]>([])

  const snapRef = useRef<Snapshot | null>(inicial)
  const ocultosRef = useRef<ReadonlySet<string>>(ocultos)
  const vistaRef = useRef<Vista2D | null>(null)
  const planoRef = useRef<Plano2D | null>(null)
  const textosPlanoRef = useRef<Record<string, string>>({})
  const vistas = useRef<Set<string> | null>(inicial ? new Set(inicial.marcas.map((m) => m.id)) : null)
  const dormidaVista = useRef<boolean | null>(null)
  const generacion = useRef(0)
  const pedirYa = useRef<() => void>(() => {})
  const avisoId = useRef(0)
  const cvRef = useRef<HTMLCanvasElement>(null)
  const cvpRef = useRef<HTMLCanvasElement>(null)
  const escenaRef = useRef<HTMLDivElement>(null)
  const planoBoxRef = useRef<HTMLDivElement>(null)
  const fichaRef = useRef<HTMLElement | null>(null)
  const switchRef = useRef<HTMLButtonElement>(null)
  const idVistas = useId(), idConfirma = useId()

  const abrir = useCallback((id: string) => setFicha({ id, abierta: true }), [])
  const cerrar = useCallback(() => setFicha((f) => (f.abierta ? { ...f, abierta: false } : f)), [])
  const tocar = useCallback((id: string | null) => (id ? abrir(id) : cerrar()), [abrir, cerrar])

  const avisar = useCallback((textos: string[]) => {
    setAvisos((cola) => [...cola, ...textos.map((texto) => ({ id: ++avisoId.current, texto }))].slice(-5))
  }, [])

  // Las marcas nuevas desde la última consulta: «pasa» camina a la oficina del otro (o lo dice en voz alta),
  // «entrega» camina a tu oficina y avisa abajo. Las de antes de abrir la página ya cuentan como vistas.
  const animar = useCallback((nuevas: Marca[], s: Snapshot) => {
    const v = vistaRef.current
    const ids = new Set(s.agentes.map((a) => a.id))
    const ahora = Date.parse(s.ahora)
    const textos: string[] = []
    for (const m of nuevas) {
      const fresca = ahora - Date.parse(m.creado_en) <= FRESCA_MS
      const dice = recortar(m.texto, 40)
      if (m.tipo === 'pasa' && fresca && v) {
        if (m.para && ids.has(m.para)) v.visita(m.agente, m.para, dice)
        else v.decir(m.agente, dice)
      } else if (m.tipo === 'entrega') {
        if (fresca && v) v.visita(m.agente, 'ale', dice)
        textos.push(`${nombreDe(m.agente, s.agentes)} te dejó algo en tu oficina: ${m.texto}`)
      }
    }
    if (textos.length) avisar(textos)
  }, [avisar])

  const aplicar = useCallback((nuevo: Snapshot) => {
    const previo = snapRef.current
    // con la base caída la ruta contesta sin agentes: si ya había datos, se queda lo último bueno
    if (!nuevo.agentes.length && previo && previo.agentes.length) {
      setSinSenal(true)
      return
    }
    const nuevas = vistas.current ? marcasNuevas(vistas.current, nuevo.marcas) : []
    vistas.current = new Set(nuevo.marcas.map((m) => m.id))
    snapRef.current = nuevo
    setSnap(nuevo)
    setSinSenal(false)
    setCargando(false)
    setAhoraMs(Date.now())
    // lo que ya abriste y el servidor ya no manda deja de estar oculto
    const pendientes = new Set(nuevo.paraTi.map((m) => m.id))
    setOcultos((prev) => {
      const quedan = [...prev].filter((id) => pendientes.has(id))
      return quedan.length === prev.size ? prev : new Set(quedan)
    })
    if (nuevas.length) animar(nuevas, nuevo)
  }, [animar])

  // Pedir la foto cada 15 s; mientras la pestaña no se ve no se pide, y al volver se pide de una vez
  useEffect(() => {
    let vivo = true
    let enCurso: AbortController | null = null
    async function pedir() {
      if (!vivo || enCurso || document.hidden) return
      const ctrl = new AbortController()
      enCurso = ctrl
      const gen = generacion.current
      try {
        const r = await fetch('/api/oficina', { cache: 'no-store', signal: ctrl.signal, headers: { accept: 'application/json' } })
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        const j: unknown = await r.json()
        if (!esSnapshot(j)) throw new Error('respuesta sin forma de oficina')
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
    if (!snapRef.current) void pedir()
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

  // el reloj de la página (la hora de arriba, la línea de ahora y «Lo próximo» de las fichas)
  useEffect(() => {
    setAhoraMs(Date.now())
    const t = setInterval(() => setAhoraMs(Date.now()), 30_000)
    return () => clearInterval(t)
  }, [])

  // la pestaña que eligió la última vez
  useEffect(() => {
    try {
      const g = localStorage.getItem(CLAVE_VISTA)
      if (g === 'maqueta' || g === 'plano' || g === 'dia') setVista(g)
    } catch {
      /* sin almacenamiento: arranca en Maqueta */
    }
  }, [])
  const elegir = (v: Vista) => {
    setVista(v)
    try {
      localStorage.setItem(CLAVE_VISTA, v)
    } catch {
      /* no se pudo guardar: no pasa nada */
    }
  }

  // un lienzo creado mientras estaba escondido mide 1×1: se vuelve a medir al mostrarse
  useEffect(() => {
    const r = requestAnimationFrame(() => {
      vistaRef.current?.medir()
      planoRef.current?.medir()
    })
    return () => cancelAnimationFrame(r)
  }, [vista])

  // los textos de debajo de cada carita del plano (se calculan con cada foto y cada medio minuto, no en cada cuadro)
  const textosPlano = useMemo(() => {
    const t: Record<string, string> = {}
    if (snap) {
      const ahora = new Date(ahoraMs || Date.parse(snap.ahora))
      for (const a of snap.agentes) t[a.id] = textoPlano(a, snap.marcas, snap.paraTi, ahora)
    }
    return t
  }, [snap, ahoraMs])
  useEffect(() => {
    textosPlanoRef.current = textosPlano
  }, [textosPlano])

  // estados, bandeja «PARA TI» y modo dormir, a la maqueta y al plano
  const alimentar = useCallback((s: Snapshot | null, ocultosAhora: ReadonlySet<string>) => {
    const v = vistaRef.current, p = planoRef.current
    if (!s) return
    const estados: Record<string, EstadoAgente> = {}
    for (const a of s.agentes) estados[a.id] = a.estado
    v?.estados(estados)
    p?.estados(estados)
    if (v) {
      v.bandeja(s.paraTi.filter((m) => !ocultosAhora.has(m.id)).length)
      if (dormidaVista.current !== s.oficina.dormida) {
        v.dormir(s.oficina.dormida)
        dormidaVista.current = s.oficina.dormida
      }
    }
  }, [])
  useEffect(() => {
    ocultosRef.current = ocultos
    alimentar(snap, ocultos)
  }, [snap, ocultos, alimentar])

  // La maqueta y el plano se crean una vez por catálogo (se rehacen solo si cambian los agentes o sus puestos)
  const catalogo = useMemo(
    () => (snap ? JSON.stringify(snap.agentes.map((a) => [a.id, a.puesto, a.nombre, a.area, a.aspecto, a.despierto_siempre, a.estado_fijo])) : ''),
    [snap],
  )
  useEffect(() => {
    const s = snapRef.current, cv = cvRef.current, cvp = cvpRef.current
    if (!s || !s.agentes.length || !cv || !cvp) return
    const mundo = crearMundo(s.agentes)
    // el aviso de la entrega lo pone la página al ver la marca (alAvisar de la maqueta no se usa)
    const v = crearVista(cv, mundo, s.agentes, { alTocar: tocar, alAvisar: () => {} })
    const p = crearPlano(cvp, s.agentes, (id) => textosPlanoRef.current[id] ?? '', tocar)
    vistaRef.current = v
    planoRef.current = p
    dormidaVista.current = null
    alimentar(s, ocultosRef.current)
    const escena = escenaRef.current, planoBox = planoBoxRef.current
    const ro = new ResizeObserver((cambios) => {
      for (const c of cambios) {
        if (c.target === escena) v.medir()
        else if (c.target === planoBox) p.medir()
      }
    })
    if (escena) ro.observe(escena)
    if (planoBox) ro.observe(planoBox)
    return () => {
      ro.disconnect()
      v.destruir()
      p.destruir()
      if (vistaRef.current === v) vistaRef.current = null
      if (planoRef.current === p) planoRef.current = null
    }
  }, [catalogo, alimentar, tocar])

  // Dormida: cada 25 a 45 s un Knox dormido dice algo entre sueños (nunca los que siguen despiertos)
  const dormida = !!snap?.oficina.dormida
  const hayAgentes = !!snap && snap.agentes.length > 0
  useEffect(() => {
    if (!dormida || !hayAgentes) return
    let t: ReturnType<typeof setTimeout> | undefined
    let ultima = -1
    const murmurar = () => {
      const v = vistaRef.current, s = snapRef.current
      if (!v || !s || !s.oficina.dormida || document.hidden) return
      const dormidos = s.agentes.filter((a) => !a.despierto_siempre && a.puesto >= 0 && a.puesto < 24)
      if (!dormidos.length) return
      const k = dormidos[Math.floor(Math.random() * dormidos.length)]
      let i = Math.floor(Math.random() * FRASES_SUENO.length)
      if (i === ultima && FRASES_SUENO.length > 1) i = (i + 1) % FRASES_SUENO.length
      ultima = i
      v.decir(k.id, FRASES_SUENO[i])
    }
    const programar = () => {
      t = setTimeout(() => {
        murmurar()
        programar()
      }, 25_000 + Math.random() * 20_000)
    }
    programar()
    return () => {
      if (t) clearTimeout(t)
    }
  }, [dormida, hayAgentes])

  // los avisos de abajo, uno a la vez
  const avisoActual = avisos[0]
  useEffect(() => {
    if (!avisoActual) return
    const t = setTimeout(() => setAvisos((c) => c.slice(1)), AVISO_MS)
    return () => clearTimeout(t)
  }, [avisoActual])

  // la ficha se cierra con Esc o tocando afuera (la maqueta, el plano y el panel abren otra en su lugar)
  useEffect(() => {
    if (!ficha.abierta && !confirma) return
    const alClic = (e: MouseEvent) => {
      if (!ficha.abierta) return
      const t = e.target
      if (!(t instanceof Element) || fichaRef.current?.contains(t) || t.closest('[data-of-ficha]')) return
      cerrar()
    }
    const alTecla = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (confirma && !cambiando) {
        setConfirma(false)
        switchRef.current?.focus({ preventScroll: true })
      } else if (ficha.abierta) cerrar()
    }
    document.addEventListener('click', alClic)
    document.addEventListener('keydown', alTecla)
    return () => {
      document.removeEventListener('click', alClic)
      document.removeEventListener('keydown', alTecla)
    }
  }, [ficha.abierta, confirma, cambiando, cerrar])

  // «Ver»: el enlace se abre solo (es un <a>); se marca como visto sin esperar y sale de «Para ti».
  // Se quita en la siguiente vuelta: si el <a> desaparece durante el clic, el navegador no lo abre.
  const ver = useCallback((m: Marca) => {
    setTimeout(() => setOcultos((prev) => new Set(prev).add(m.id)), 0)
    fetch('/api/oficina/visto', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id: m.id }), keepalive: true })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
      })
      .catch(() => {
        // no se guardó: vuelve a aparecer para que no se pierda
        setTimeout(() => setOcultos((prev) => {
          if (!prev.has(m.id)) return prev
          const n = new Set(prev)
          n.delete(m.id)
          return n
        }), 0)
      })
  }, [])

  // El switch de dormir: confirma en la misma página, espera la respuesta y vuelve a pedir la foto
  async function cambiar() {
    const s = snapRef.current
    if (!s || cambiando) return
    const dormir = !s.oficina.dormida
    let listo = false
    setCambiando(true)
    setErrorSwitch(null)
    try {
      let r: Response
      try {
        r = await fetch('/api/oficina/dormir', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ dormida: dormir }) })
      } catch {
        throw new Error(SIN_CONEXION)
      }
      const j = (await r.json().catch(() => null)) as (Partial<EstadoOficina> & { error?: unknown }) | null
      if (!r.ok || !j || typeof j.dormida !== 'boolean') throw new Error(j && typeof j.error === 'string' && j.error ? j.error : NO_SE_PUDO)
      const estado: EstadoOficina = { dormida: j.dormida, desde: j.desde ?? null, por: j.por ?? null }
      generacion.current++
      const actual = snapRef.current
      if (actual) {
        const nuevo = { ...actual, oficina: estado }
        snapRef.current = nuevo
        setSnap(nuevo)
      }
      vistaRef.current?.dormir(estado.dormida)
      dormidaVista.current = estado.dormida
      setConfirma(false)
      listo = true
      pedirYa.current()
    } catch (e) {
      setErrorSwitch(e instanceof Error && e.message ? e.message : NO_SE_PUDO)
    } finally {
      setCambiando(false)
      // el foco vuelve al switch cuando ya está habilitado otra vez
      if (listo) requestAnimationFrame(() => switchRef.current?.focus({ preventScroll: true }))
    }
  }

  const raiz = `of-raiz ${pixel.variable}`

  if (!snap || !snap.agentes.length) {
    return (
      <div className={raiz}>
        <section className="of" aria-label="La oficina de Knox">
          <div className="of-vacio" role="status">
            <h1 className="of-titulo">La oficina de Knox</h1>
            <p style={{ margin: 0 }}>{cargando ? 'Abriendo la oficina…' : 'Todavía no hay datos. Apenas los agentes empiecen a anotar, aparecen aquí.'}</p>
          </div>
        </section>
      </div>
    )
  }

  const ahora = new Date(ahoraMs || Date.parse(snap.ahora))
  const paraTi = snap.paraTi.filter((m) => !ocultos.has(m.id))
  const agenteFicha = ficha.id ? snap.agentes.find((a) => a.id === ficha.id) ?? null : null
  const vivo = sinSenal
    ? `Sin conexión · datos de ${lasCR(new Date(snap.ahora))}`
    : dormida
      ? 'La oficina duerme'
      : `${trabajandoAhora(snap.agentes)} trabajando`

  return (
    <div className={raiz}>
      <section className="of" aria-label="La oficina de Knox">
        <header className="of-cab">
          <h1 className="of-titulo">La oficina de Knox</h1>
          <div className={`of-vivo${sinSenal ? ' sin' : dormida ? ' noche' : ''}`}>
            <i aria-hidden="true" />
            <span>{vivo}</span>
          </div>
          <div className="of-acciones">
            <div className="of-tabs" role="tablist" aria-label="Cómo ver la oficina">
              {VISTAS.map(([v, texto]) => (
                <button key={v} type="button" role="tab" aria-selected={vista === v} aria-controls={idVistas} onClick={() => elegir(v)}>
                  {texto}
                </button>
              ))}
            </div>
            <button
              ref={switchRef}
              type="button"
              className={`of-switch${dormida ? ' noche' : ''}`}
              aria-expanded={confirma}
              aria-controls={confirma ? idConfirma : undefined}
              disabled={cambiando}
              onClick={() => {
                setErrorSwitch(null)
                setConfirma((c) => !c)
              }}
            >
              <span className={dormida ? 'of-sol' : 'of-luna'} aria-hidden="true" />
              {dormida ? 'Despertar' : 'A dormir'}
            </button>
          </div>
        </header>

        {confirma && (
          <Confirmacion
            id={idConfirma}
            dormida={dormida}
            cambiando={cambiando}
            error={errorSwitch}
            si={() => void cambiar()}
            no={() => {
              setConfirma(false)
              switchRef.current?.focus({ preventScroll: true })
            }}
          />
        )}

        <div className="of-chips">
          <span className="of-hora">{encabezadoCR(ahora)}</span>
          {chipsDe(snap.agentes, dormida).map((c) => (
            <span key={c.estado} className="of-chip">
              <span className="of-dot" style={{ background: COL[c.estado] }} />
              {c.texto}
            </span>
          ))}
        </div>

        {dormida && (
          <p className="of-dormida">
            <span className="of-luna" aria-hidden="true" />
            {avisoDormida(snap.oficina, ahora)}
          </p>
        )}

        <div id={idVistas} className={`of-vistas v-${vista}`} role="tabpanel" aria-label={VISTAS.find(([v]) => v === vista)?.[1]}>
          <div className="of-escena" ref={escenaRef} data-of-ficha>
            <canvas ref={cvRef} role="img" aria-label="La oficina de los Knox en pixel art. Toca una oficina para ver su ficha." />
            <div className="of-zoom">
              <button type="button" aria-label="Acercar" onClick={() => vistaRef.current?.acercar()}>
                +
              </button>
              <button type="button" aria-label="Alejar" onClick={() => vistaRef.current?.alejar()}>
                −
              </button>
              <button type="button" onClick={() => vistaRef.current?.verTodo()}>
                Ver todo
              </button>
            </div>
          </div>
          <div className="of-plano" ref={planoBoxRef} data-of-ficha>
            <canvas ref={cvpRef} role="img" aria-label="El plano de la oficina: cada Knox con su anillo de estado. Toca uno para ver su ficha." />
          </div>
          <Panel agentes={snap.agentes} marcas={snap.marcas} paraTi={paraTi} proximos={snap.proximos} dormida={dormida} ahora={ahora} abrir={abrir} ver={ver} />
          {vista === 'dia' && <LineaDia agentes={snap.agentes} marcas={snap.marcas} proximos={snap.proximos} oficina={snap.oficina} ahora={ahora} />}
        </div>

        <p className="of-nota">
          {vista === 'plano'
            ? 'Toca una carita o un nombre para ver su ficha.'
            : 'Toca una oficina o un nombre para ver su ficha. Para acercar: los botones, Ctrl o Cmd con la rueda, o dos dedos.'}
        </p>
      </section>

      <Ficha
        agente={agenteFicha}
        abierta={ficha.abierta}
        marcas={snap.marcas}
        paraTi={paraTi}
        dormida={dormida}
        ahora={ahora}
        cerrar={cerrar}
        ver={ver}
        refFicha={fichaRef}
      />

      <div role="status" aria-live="polite">
        {avisoActual && (
          <div key={avisoActual.id} className="of-aviso">
            {avisoActual.texto}
          </div>
        )}
      </div>
    </div>
  )
}

// La confirmación del switch, dentro de la página (nunca el cuadro de diálogo del navegador)
function Confirmacion(p: { id: string; dormida: boolean; cambiando: boolean; error: string | null; si(): void; no(): void }) {
  const cancelar = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    cancelar.current?.focus({ preventScroll: true })
  }, [])
  return (
    <div id={p.id} className="of-confirma" role="alertdialog" aria-labelledby={`${p.id}-pregunta`} aria-describedby={p.error ? `${p.id}-error` : undefined}>
      <p id={`${p.id}-pregunta`}>
        {p.dormida ? '¿Despertamos la oficina? Retoman donde quedaron.' : '¿Dormimos la oficina? Nadie empieza nada nuevo hasta que la despiertes.'}
      </p>
      <div className="of-botones">
        <button type="button" className="of-boton si" onClick={p.si} disabled={p.cambiando}>
          {p.cambiando ? 'Un momento…' : p.dormida ? 'Sí, despertar' : 'Sí, a dormir'}
        </button>
        <button ref={cancelar} type="button" className="of-boton" onClick={p.no} disabled={p.cambiando}>
          Cancelar
        </button>
      </div>
      {p.error && (
        <p id={`${p.id}-error`} className="of-error" role="alert">
          {p.error}
        </p>
      )}
    </div>
  )
}
