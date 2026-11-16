'use client'

import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { Silkscreen } from 'next/font/google'
import type { Foto, LineaTertulia, Marca, RespuestaOficina } from '@/lib/oficina/tipos'
import { lineasDelChat, type LineaChat } from '@/lib/oficina/chat'
import { DE_LADO, escribirDireccion, estadoConMarca, leerDireccion, type Direccion, type Pestana, type Seccion } from '@/lib/oficina/direccion'
import { contarIdeas, filtrarIdeas, filtroDeVerIdeas, marcaVisto, nuevosDelForo, type FiltroIdeas } from '@/lib/oficina/foro'
import { FRASES_SUENO } from '@/lib/oficina/frases-sueno'
import { avisoDormida, nombreDe, recortar, textoPlano, type Chip } from '@/lib/oficina/pagina'
import { repartirSala } from '@/lib/oficina/sala'
import { Cabecera } from './cabecera'
import { Ahora, Chat, ParaTi, type Tamano } from './columna'
import { Ficha } from './ficha'
import { Foro, traerYBrillar } from './foro'
import { Capa, ClaseCapa, Grande, Lado, NOMBRE, TITULO } from './grande'
import { IdeasEquipo } from './ideas-equipo'
import { Hueco, Maqueta, Plano } from './lienzos'
import { LineaDia } from './linea-dia'
import type { crearVista } from './pixel/vista'
import { usarOficina } from './usar-oficina'
import { Visor } from './visor'
import './oficina.css'

// La Oficina de Knox: la maqueta grande en pixel art con los 24 Knox (o el plano), la línea del día y, a la derecha,
// Para ti (con «Te toca»), el chat y Ahora / Falló / Lo próximo; y en sus pestañas, el Foro y las Ideas del equipo.
// Se actualiza cada 15 s (usarOficina), anima lo nuevo y tiene el switch de dormir. Solo escribe el «visto», el modo
// dormir, «Me sirve» / «No va» y el me gusta.
// Cada sección se ve también al lado (el tercio de la derecha, en la compu) o en grande. Con conDireccion (su pestaña
// propia) eso, la pestaña y lo que se pidió ver del foro o de las ideas van en el # de la dirección: cambiar de pestaña
// o pedir ver algo agrega una entrada, así «atrás» vuelve a lo de antes; un enlace guardado lo abre. Sin # (el centro
// de Knox), todo funciona igual desde el estado.

const pixel = Silkscreen({ weight: '400', subsets: ['latin'], variable: '--of-pixel', display: 'swap' })

type Vista2D = ReturnType<typeof crearVista>
type Modo = 'lado' | 'grande'
const FRESCA_MS = 10 * 60_000 // lo más viejo no se anima (ya pasó)
const SUENO_PRIMERO_MS = 4_000
const SUENOS_MAX = 20
const TELEFONO = '(max-width: 760px)'
// «al lado» necesita la columna a la derecha: desde 1241 px (más angosta, la columna baja y «al lado» se ve en grande)
const ANCHO_LADO = '(min-width: 1241px)'
const CERRADA: Direccion = { pestana: 'oficina', modo: null, seccion: null, foco: null }
// En history.state: esta entrada la agregó esta página al abrir una sección (cerrarla es volver atrás). Lleva la marca
// de esta carga: después de recargar, la entrada de antes es de otra carga y volver a ella recargaría la página.
const LLAVE = 'oficinaAbrio'
const ESTA_CARGA = Math.random().toString(36).slice(2)
// hasta dónde viste el foro (lo nuevo, en la pestaña, se cuenta desde ahí)
const VISTO_FORO = 'oficina-foro-visto'

// Una consulta de medidas para lo que no cambia el HTML (solo el dibujo): por eso se puede leer ya en el primer render
// del navegador sin que la página del servidor y la del navegador dejen de coincidir.
function usarMedia(consulta: string): boolean {
  const [si, setSi] = useState(() => typeof window !== 'undefined' && window.matchMedia(consulta).matches)
  useEffect(() => {
    const m = window.matchMedia(consulta)
    const alCambiar = () => setSi(m.matches)
    alCambiar()
    m.addEventListener('change', alCambiar)
    return () => m.removeEventListener('change', alCambiar)
  }, [consulta])
  return si
}

// Igual, para lo que sí cambia el HTML (los botones «Al lado»): en el servidor y al hidratar dice que no; después, lo real
function usarMediaDespues(consulta: string): boolean {
  const suscribir = useCallback(
    (avisar: () => void) => {
      const m = window.matchMedia(consulta)
      m.addEventListener('change', avisar)
      return () => m.removeEventListener('change', avisar)
    },
    [consulta],
  )
  return useSyncExternalStore(suscribir, () => window.matchMedia(consulta).matches, () => false)
}

const abrioLaPagina = () => (window.history.state as Record<string, unknown> | null)?.[LLAVE] === ESTA_CARGA
// el estado de la entrada que se escribe: el que ya tenía (las llaves de Next.js no se pierden) con la marca puesta o quitada
const conMarca = (abrio: boolean) => estadoConMarca(window.history.state, LLAVE, abrio ? ESTA_CARGA : null)

export function Oficina({
  inicial,
  enMarco = false,
  conDireccion = false,
}: {
  inicial: RespuestaOficina | null
  enMarco?: boolean
  conDireccion?: boolean
}) {
  const vista2d = useRef<Vista2D | null>(null)
  const avisarRef = useRef<(t: string) => void>(() => {})
  const raiz = useRef<HTMLDivElement>(null)
  const fichaRef = useRef<HTMLElement | null>(null)
  const idPanel = useId()
  const [dir, setDir] = useState<Direccion>(CERRADA)
  // sube cada vez que se pide ver algo del foro o de las ideas: pedir otra vez lo mismo lo vuelve a traer
  const [vez, setVez] = useState(0)
  const [filtroIdeas, setFiltroIdeas] = useState<FiltroIdeas>('todas')
  const [vistoForo, setVistoForo] = useState<string | null | undefined>(undefined) // undefined: todavía no se leyó
  const [ficha, setFicha] = useState<{ id: string | null; abierta: boolean }>({ id: null, abierta: false })
  const [foto, setFoto] = useState<Foto | null>(null) // la que se ve en el visor
  const [suenos, setSuenos] = useState<LineaChat[]>([])
  const [quienSuena, setQuienSuena] = useState<string | null>(null)
  const telefono = usarMedia(TELEFONO)
  const puedeLado = usarMediaDespues(ANCHO_LADO) && conDireccion && !enMarco

  // Lo que se ve: la pestaña y, en la oficina o el plano, la sección al lado o en grande («al lado» donde no se puede,
  // en una ventana angosta o en el centro de Knox, se ve en grande)
  const vista = dir.pestana
  const seccion = dir.seccion
  const modo = seccion ? (dir.modo === 'lado' && !puedeLado ? 'grande' : dir.modo) : null
  const enLado = modo === 'lado' ? seccion : null
  const enGrande = modo === 'grande' ? seccion : null

  // Lo nuevo desde la última consulta: «pasa» camina a la oficina del otro (o lo dice en voz alta), «entrega» camina a
  // tu oficina y avisa abajo, y cada línea de la tertulia que recién sale va en nube sobre quien la dice.
  const alNuevas = useCallback((marcas: Marca[], lineas: LineaTertulia[], r: RespuestaOficina) => {
    const v = vista2d.current
    const ahora = Date.parse(r.ahora)
    const ids = new Set(r.agentes.map((a) => a.id))
    for (const m of marcas) {
      const fresca = ahora - Date.parse(m.creado_en) <= FRESCA_MS
      const dice = recortar(m.texto, 40)
      if (m.tipo === 'pasa' && fresca && v) {
        if (m.para && ids.has(m.para)) v.visita(m.agente, m.para, dice)
        else v.decir(m.agente, dice)
      } else if (m.tipo === 'entrega') {
        if (fresca && v) v.visita(m.agente, 'ale', dice)
        avisarRef.current(`${nombreDe(m.agente, r.agentes)} te dejó algo en tu oficina: ${m.texto}`)
      }
    }
    for (const l of lineas) {
      if (v && ahora - Date.parse(l.mostrar_desde) < FRESCA_MS) v.decir(l.de, recortar(l.texto, 40))
    }
  }, [])

  const o = usarOficina(inicial, { alNuevas })
  const { r, social, ahora, avisar, decidirIdea, meGusta } = o
  useEffect(() => {
    avisarRef.current = avisar
  }, [avisar])
  const socialRef = useRef(social)
  useEffect(() => {
    socialRef.current = social
  }, [social])
  const dormida = !!r?.oficina.dormida
  const hayAgentes = !!r && r.agentes.length > 0
  const agentesRef = useRef(r?.agentes ?? [])
  useEffect(() => {
    agentesRef.current = r?.agentes ?? []
  }, [r])

  const ponerApi = useCallback((v: Vista2D | null) => {
    vista2d.current = v
  }, [])
  const abrir = useCallback((id: string) => setFicha({ id, abierta: true }), [])
  const cerrar = useCallback(() => setFicha((f) => (f.abierta ? { ...f, abierta: false } : f)), [])
  const abrirFoto = useCallback((f: Foto) => setFoto(f), [])
  const cerrarFoto = useCallback(() => setFoto(null), [])

  // ---------- Las pestañas, al lado y en grande, y el # ----------
  // Cambia lo que se ve y, con conDireccion, el # (push agrega una entrada, así «atrás» vuelve a lo de antes; replace la
  // cambia). Siempre con el estado que ya tenía la entrada (conMarca): las llaves de Next.js nunca se pierden.
  // abrio: esta entrada la agregó la página al abrir una sección (cerrarla es volver atrás); cambiar de pestaña lo quita,
  // porque la entrada de antes ya no es esta misma vista sin la sección.
  const volviendo = useRef(false) // ya se pidió «atrás» y todavía no llegó (cerrar dos veces no retrocede dos)
  const abridor = useRef<{ seccion: Seccion; modo: Modo } | null>(null)
  const ultima = useRef<Seccion | null>(null)
  const trasIr = useRef<(() => void) | null>(null) // lo que se hace cuando ya se ve la pestaña nueva
  // Lo que se ve. Si pide ver algo del foro o de las ideas (foco), sube la vez; y si el filtro de las ideas la esconde,
  // vuelve a «Todas». Así funciona igual con el # que desde el estado (el centro de Knox no tiene #).
  const ponerDir = useCallback((d: Direccion) => {
    setDir(d)
    if (!d.foco) return
    setVez((v) => v + 1)
    const idea = d.pestana === 'ideas' ? socialRef.current?.ideas.find((i) => i.id === d.foco) : undefined
    if (idea) setFiltroIdeas((f) => (filtrarIdeas([idea], f).length ? f : 'todas'))
  }, [])
  const ir = useCallback(
    (d: Direccion, como: 'push' | 'replace', abrio: boolean) => {
      ponerDir(d)
      if (!conDireccion) return
      if (como === 'push') window.history.pushState(conMarca(abrio), '', escribirDireccion(d))
      else window.history.replaceState(conMarca(abrio), '', escribirDireccion(d))
    },
    [conDireccion, ponerDir],
  )
  const sigueAbierta = useCallback(() => conDireccion && abrioLaPagina(), [conDireccion])

  // abrir desde la columna agrega una entrada; cambiar entre al lado y en grande (o de sección), la cambia
  const abrirSeccion = useCallback(
    (s: Seccion, m: Modo) => {
      const d: Direccion = { pestana: vista, modo: m, seccion: s, foco: null }
      if (seccion) return ir(d, 'replace', sigueAbierta())
      abridor.current = { seccion: s, modo: m }
      volviendo.current = false
      ir(d, 'push', true)
    },
    [vista, seccion, ir, sigueAbierta],
  )
  const cambiarSeccion = useCallback(
    (s: Seccion) => {
      if (dir.modo) ir({ pestana: vista, modo: dir.modo, seccion: s, foco: null }, 'replace', sigueAbierta())
    },
    [dir.modo, vista, ir, sigueAbierta],
  )
  const cerrarSeccion = useCallback(() => {
    if (volviendo.current) return
    const d: Direccion = { pestana: vista, modo: null, seccion: null, foco: null }
    if (!sigueAbierta()) return ir(d, 'replace', false)
    volviendo.current = true
    setDir(d)
    window.history.back()
  }, [vista, ir, sigueAbierta])
  // Cambiar de pestaña agrega una entrada: «atrás» vuelve a la de antes. La sección al lado sigue abierta entre la
  // oficina y el plano (va en las dos); el foro y las ideas no tienen secciones.
  const cambiarPestana = useCallback(
    (v: Pestana) => {
      if (v === vista) return
      const s = (v === 'oficina' || v === 'plano') && seccion && DE_LADO.includes(seccion) ? seccion : null
      ir({ pestana: v, modo: s ? dir.modo : null, seccion: s, foco: null }, 'push', false)
    },
    [vista, seccion, dir.modo, ir],
  )
  // Ver algo del foro o de las ideas: cierra la ficha y va a esa pestaña, a lo que se pidió (#foro/<id>, #ideas/<id>).
  // Agrega una entrada, salvo que ya se esté viendo eso mismo: entonces solo lo vuelve a traer.
  const irA = useCallback(
    (pestana: 'foro' | 'ideas', foco: string | null) => {
      cerrar()
      const mismo = dir.pestana === pestana && dir.foco === foco
      ir({ pestana, modo: null, seccion: null, foco }, mismo ? 'replace' : 'push', false)
    },
    [cerrar, dir.pestana, dir.foco, ir],
  )
  // «Ver en el Foro» (la ficha), «Ir al debate» y el post de donde salió una idea
  const irPost = useCallback((id: string) => irA('foro', id), [irA])
  // «💡 Idea» (el chat y el foro)
  const irIdea = useCallback((id: string) => irA('ideas', id), [irA])
  // «Ver ideas» («Te toca» y el foro): la pestaña Ideas, en Nuevas (en Todas si no queda ninguna nueva). El botón que
  // lo pidió ya no está: el foco pasa al título de las ideas.
  const irIdeas = useCallback(() => {
    setFiltroIdeas(filtroDeVerIdeas(socialRef.current?.ideas ?? []))
    trasIr.current = () => raiz.current?.querySelector<HTMLElement>('.of-ideas-cab h2')?.focus()
    irA('ideas', null)
  }, [irA])

  // Con conDireccion: lo que dice el # al abrir y cada vez que cambia («atrás», «adelante» o un enlace). Al abrir solo se
  // lee (un # que no se entiende es #oficina, sin tocarlo): con la página del servidor esto corre antes de que Next.js
  // termine de preparar la historia, y escribirla aquí borraba sus llaves (al volver a esa entrada, recargaba la página).
  useLayoutEffect(() => {
    if (!conDireccion) return
    const leer = () => {
      volviendo.current = false
      ponerDir(leerDireccion(window.location.hash))
    }
    leer()
    window.addEventListener('popstate', leer)
    window.addEventListener('hashchange', leer)
    return () => {
      window.removeEventListener('popstate', leer)
      window.removeEventListener('hashchange', leer)
    }
  }, [conDireccion, ponerDir])

  // Al cerrar, el foco vuelve al botón que la abrió (si se abrió con un enlace, al de su sección), salvo que ya esté en
  // otra parte de la página
  useLayoutEffect(() => {
    if (seccion) {
      ultima.current = seccion
      return
    }
    const a = abridor.current, s = ultima.current
    abridor.current = null
    ultima.current = null
    const activo = document.activeElement
    if (!s || (activo && activo !== document.body && activo.isConnected)) return
    const caja = raiz.current
    const boton =
      (a && caja?.querySelector<HTMLElement>(`[data-of-abre="${a.seccion}-${a.modo}"]`)) ||
      caja?.querySelector<HTMLElement>(`[data-of-abre^="${s}-"]`)
    boton?.focus({ preventScroll: true })
  }, [seccion])

  // El panel de al lado se queda a la vista debajo de la cabecera: su alto depende del de ella
  useLayoutEffect(() => {
    const caja = raiz.current
    const cab = caja?.querySelector<HTMLElement>('.of-cab')
    if (!caja || !cab) return
    const medir = () => caja.style.setProperty('--of-cab-h', `${Math.round(cab.getBoundingClientRect().height)}px`)
    medir()
    const ro = new ResizeObserver(medir)
    ro.observe(cab)
    return () => ro.disconnect()
  }, [hayAgentes])

  // baja hasta una caja de la columna y la hace brillar
  const irCaja = useCallback((caja: 'parati' | 'ahora') => {
    const el = raiz.current?.querySelector<HTMLElement>(`[data-of-caja="${caja}"]`)
    if (el) traerYBrillar(el, { block: 'center' })
  }, [])

  // Después de cambiar de pestaña: lo que quedó pendiente (bajar a una caja de la columna, el foco al título de las
  // ideas) o, si la página ya estaba bajada, volver a su comienzo (la pestaña nueva arranca arriba). Lo que se pidió ver
  // (foco) lo trae su pestaña.
  const pestanaVista = useRef(vista)
  useLayoutEffect(() => {
    const antes = pestanaVista.current
    pestanaVista.current = vista
    const tras = trasIr.current
    trasIr.current = null
    if (tras) return tras()
    if (antes === vista || dir.foco) return
    const caja = raiz.current
    if (caja && caja.getBoundingClientRect().top < 0) caja.scrollIntoView({ block: 'start' })
  }, [vista, dir])

  // tocar la maqueta o el plano: un Knox abre su ficha; tu oficina lleva a «Para ti» (con algo abierto, ahí mismo; si
  // no, baja hasta su caja); lo demás cierra la ficha
  const tocar = useCallback(
    (id: string | null) => {
      if (id === 'ale') {
        cerrar()
        if (seccion) cambiarSeccion('parati')
        else irCaja('parati')
      } else if (id) abrir(id)
      else cerrar()
    },
    [abrir, cerrar, irCaja, seccion, cambiarSeccion],
  )

  // las cuentas de arriba: «te dejó algo» → Para ti; «falló» → su ficha si es uno; lo demás → Ahora. Con «al lado»
  // abierto cambian la sección del panel en vez de bajar a la caja; desde el foro o las ideas, primero vuelven a la
  // oficina (con una entrada nueva, como cualquier cambio de pestaña).
  const alChip = useCallback(
    (clave: Chip['clave']) => {
      if (clave === 'fallo') {
        const fallaron = (r?.agentes ?? []).filter((a) => a.estado === 'fallo')
        if (fallaron.length === 1) return abrir(fallaron[0].id)
      }
      const caja = clave === 'listo' ? 'parati' : 'ahora'
      if (vista === 'foro' || vista === 'ideas') {
        trasIr.current = () => irCaja(caja)
        return ir({ pestana: 'oficina', modo: null, seccion: null, foco: null }, 'push', false)
      }
      if (enLado) cambiarSeccion(caja)
      else irCaja(caja)
    },
    [r, abrir, irCaja, enLado, cambiarSeccion, vista, ir],
  )

  // «Me sirve» / «No va» (tocar el que está puesto lo deshace): se ve al tiro y, cuando se guarda, un aviso
  const decidir = useCallback(
    (id: string, accion: 'sirve' | 'no_va' | 'deshacer') => {
      const de = socialRef.current?.ideas.find((i) => i.id === id)?.de
      void decidirIdea(id, accion).then((ok) => {
        if (!ok) return
        if (accion === 'sirve') avisar(`Anotado: te sirve.${de ? ` ${nombreDe(de, agentesRef.current)} se va a poner feliz.` : ''}`)
        else if (accion === 'no_va') avisar('Anotado: no va. Queda guardada por si acaso.')
        else avisar('La idea vuelve a estar nueva.')
      })
    },
    [decidirIdea, avisar],
  )

  // Hasta dónde viste el foro: se lee al abrir (después de montar, así la página del servidor y la del navegador
  // coinciden) y, mientras el Foro está a la vista, se va corriendo con lo que llega
  useEffect(() => {
    try {
      setVistoForo(localStorage.getItem(VISTO_FORO))
    } catch {
      setVistoForo(null) // sin almacenamiento: cuenta lo de las últimas 24 h
    }
  }, [])
  useEffect(() => {
    if (vista !== 'foro' || !social || vistoForo === undefined) return
    const hasta = marcaVisto(social.foro, ahora)
    if (vistoForo && Date.parse(vistoForo) >= Date.parse(hasta)) return
    setVistoForo(hasta)
    try {
      localStorage.setItem(VISTO_FORO, hasta)
    } catch {
      /* no se pudo guardar: al volver a abrir, se cuenta de nuevo */
    }
  }, [vista, social, ahora, vistoForo])

  // Dormida: cada 25 a 45 s un Knox dormido dice algo entre sueños (nunca los que siguen despiertos), en nube y en el
  // chat. El primero sale a los pocos segundos; abajo del chat se ve quién va a hablar dormido.
  useEffect(() => {
    if (!dormida || !hayAgentes) {
      setQuienSuena(null)
      return
    }
    let t: ReturnType<typeof setTimeout> | undefined
    let ultimaFrase = -1
    let n = 0
    const elegir = () => {
      const dormidos = agentesRef.current.filter((a) => !a.despierto_siempre && a.puesto >= 0 && a.puesto < 24)
      return dormidos.length ? dormidos[Math.floor(Math.random() * dormidos.length)].id : null
    }
    let quien = elegir()
    setQuienSuena(quien)
    const murmurar = () => {
      if (quien && !document.hidden) {
        let i = Math.floor(Math.random() * FRASES_SUENO.length)
        if (i === ultimaFrase && FRASES_SUENO.length > 1) i = (i + 1) % FRASES_SUENO.length
        ultimaFrase = i
        const texto = FRASES_SUENO[i]
        vista2d.current?.decir(quien, texto)
        const linea: LineaChat = { id: `sueno-${Date.now()}-${++n}`, de: quien, para: null, texto, cuando: new Date().toISOString(), tipo: 'sueno', idea_id: null }
        setSuenos((s) => [...s, linea].slice(-SUENOS_MAX))
      }
      quien = elegir()
      setQuienSuena(quien)
    }
    const programar = (ms: number) => {
      t = setTimeout(() => {
        murmurar()
        programar(25_000 + Math.random() * 20_000)
      }, ms)
    }
    programar(SUENO_PRIMERO_MS)
    return () => {
      if (t) clearTimeout(t)
    }
  }, [dormida, hayAgentes])

  // el chat: lo que pasó hoy, la tertulia y lo que dijeron dormidos, por hora (con su tope). «💡 Idea» solo en las
  // líneas cuya idea ya se ve en la pestaña Ideas (una línea puede salir antes que el post de donde sale su idea).
  const lineas = useMemo(() => {
    if (!r) return []
    const ideas = new Set((social?.ideas ?? []).map((i) => i.id))
    return lineasDelChat(r.marcas, r.chat, ahora, suenos).map((l) => (l.idea_id && !ideas.has(l.idea_id) ? { ...l, idea_id: null } : l))
  }, [r, ahora, suenos, social])

  // los retratos que ya existen (enlaces firmados); los demás se ven en pixel
  const retratos = useMemo(() => {
    const m: Record<string, string> = {}
    for (const f of social?.fotos ?? []) if (f.tipo === 'retrato' && f.agentes[0]) m[f.agentes[0]] = f.url
    return m
  }, [social])

  // quién está en la sala y dónde (con cada foto y cada medio minuto): la maqueta, el plano y sus textos lo usan
  const sala = useMemo(
    () => (r ? repartirSala({ agentes: r.agentes, lineas: r.chat, ahora, dormida: r.oficina.dormida }) : {}),
    [r, ahora],
  )

  // los textos de debajo de cada carita del plano (con cada foto y cada medio minuto, no en cada cuadro)
  const textos = useMemo(() => {
    const t: Record<string, string> = {}
    if (r && vista === 'plano') for (const a of r.agentes) t[a.id] = textoPlano(a, r.marcas, r.paraTi, ahora, sala[a.id])
    return t
  }, [r, ahora, vista, sala])

  // la ficha se cierra con Esc o tocando afuera (la maqueta, el plano y las listas abren otra en su lugar; lo que se toca
  // en el visor es del visor)
  const confirmaAbierta = o.dormir.confirma
  const fotoAbierta = foto != null
  useEffect(() => {
    if (!ficha.abierta) return
    const alClic = (e: MouseEvent) => {
      const t = e.target
      if (!(t instanceof Element) || fichaRef.current?.contains(t) || t.closest('[data-of-ficha], [data-of-visor]')) return
      cerrar()
    }
    const alTecla = (e: KeyboardEvent) => {
      // con la confirmación del switch o el visor abiertos, Esc los cierra a ellos primero
      if (e.key === 'Escape' && !confirmaAbierta && !fotoAbierta) cerrar()
    }
    document.addEventListener('click', alClic)
    document.addEventListener('keydown', alTecla)
    return () => {
      document.removeEventListener('click', alClic)
      document.removeEventListener('keydown', alTecla)
    }
  }, [ficha.abierta, confirmaAbierta, fotoAbierta, cerrar])

  // Esc cierra lo de al lado o en grande, pero primero la confirmación del switch, el visor y la ficha (cada uno se
  // cierra con su propio Esc)
  useEffect(() => {
    if (!seccion) return
    const alTecla = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !confirmaAbierta && !fotoAbierta && !ficha.abierta) cerrarSeccion()
    }
    document.addEventListener('keydown', alTecla)
    return () => document.removeEventListener('keydown', alTecla)
  }, [seccion, confirmaAbierta, fotoAbierta, ficha.abierta, cerrarSeccion])

  const raizClase = `of-raiz ${pixel.variable}${dormida ? ' of-dormida' : ''}`
  const clase = `${raizClase}${enMarco ? ' of-en-marco' : ''}`

  if (!r || !r.agentes.length) {
    return (
      <div className={clase} ref={raiz}>
        <div className="of-vacio-pagina" role="status">
          <h1 className="of-titulo">La Oficina de Knox</h1>
          <p>{o.cargando ? 'Abriendo la oficina…' : 'Todavía no hay datos. Apenas los agentes empiecen a anotar, aparecen aquí.'}</p>
        </div>
      </div>
    )
  }

  const paraTiN = o.paraTi.length + r.teToca.length
  const agenteFicha = ficha.id ? r.agentes.find((a) => a.id === ficha.id) ?? null : null
  const Cuerpo = enMarco ? 'div' : 'main'
  // lo nuevo del foro desde la última vez que lo abriste (en el Foro mismo, nada: ya lo estás viendo)
  const nuevosForo = social && vistoForo !== undefined && vista !== 'foro' ? nuevosDelForo(social.foro, vistoForo, ahora) : 0

  // cada sección en su tamaño: en la página ('normal'), al lado o en grande
  const marco = (s: Seccion, t: Tamano) => ({ tamano: t, puedeLado, abrir: (m: Modo) => abrirSeccion(s, m), cerrar: cerrarSeccion })
  const seccionEn = (s: Seccion, t: Tamano) => {
    switch (s) {
      case 'parati':
        return (
          <ParaTi
            entregas={o.paraTi}
            teToca={r.teToca}
            agentes={r.agentes}
            retratos={retratos}
            ahora={ahora}
            ver={o.ver}
            abrirFicha={abrir}
            irIdeas={irIdeas}
            {...marco(s, t)}
          />
        )
      case 'chat':
        return (
          <Chat
            lineas={lineas}
            escribiendo={dormida ? quienSuena : r.escribiendo}
            dormida={dormida}
            agentes={r.agentes}
            retratos={retratos}
            ahora={ahora}
            abrirFicha={abrir}
            irIdea={irIdea}
            {...marco(s, t)}
          />
        )
      case 'ahora':
        return (
          <Ahora
            agentes={r.agentes}
            marcas={r.marcas}
            paraTi={o.paraTi}
            proximos={r.proximos}
            pubs={r.pubs}
            sala={sala}
            dormida={dormida}
            ahora={ahora}
            abrirFicha={abrir}
            {...marco(s, t)}
          />
        )
      case 'dia':
        return (
          <LineaDia agentes={r.agentes} marcas={r.marcas} proximos={r.proximos} oficina={r.oficina} ahora={ahora} abrirFicha={abrir} {...marco(s, t)} />
        )
      case 'maqueta':
        return (
          <Maqueta
            agentes={r.agentes}
            bandeja={paraTiN}
            dormida={dormida}
            sala={sala}
            aLoAlto={telefono}
            alTocar={tocar}
            api={ponerApi}
            enGrande={t === 'normal' ? () => abrirSeccion('maqueta', 'grande') : undefined}
            cartel={dormida ? avisoDormida(r.oficina, ahora) : null}
          />
        )
      case 'plano':
        return (
          <Plano
            agentes={r.agentes}
            textos={textos}
            sala={sala}
            alTocar={tocar}
            enGrande={t === 'normal' ? () => abrirSeccion('plano', 'grande') : undefined}
          />
        )
    }
  }

  return (
    <ClaseCapa.Provider value={`${raizClase} of-capa`}>
      {/* con algo en grande, la página de atrás no se toca ni se le llega con el teclado */}
      <div className={clase} ref={raiz} inert={enGrande ? true : undefined}>
        <Cabecera
          agentes={r.agentes}
          dormida={dormida}
          sinSenal={o.sinSenal}
          datosDe={r.ahora}
          ahora={ahora}
          enMarco={enMarco}
          pestana={vista}
          idPanel={idPanel}
          nuevosForo={nuevosForo}
          ideasNuevas={social ? contarIdeas(social.ideas).nueva : 0}
          cambiarPestana={cambiarPestana}
          alChip={alChip}
          dormir={o.dormir}
        />

        <Cuerpo className="of-ancho of-gut of-main">
          {vista === 'foro' || vista === 'ideas' ? (
            <section id={idPanel} className="of-social" role="tabpanel" aria-label={vista === 'foro' ? 'El foro' : 'Las ideas del equipo'}>
              {!social ? (
                // sin el foro todavía: abriendo o, si ya llegó una respuesta sin él (o no hay conexión), que no se
                // pudo; la consulta de cada 15 s lo vuelve a pedir
                <p className="of-vacio of-abriendo" role="status">
                  {o.sinSocial || o.sinSenal
                    ? vista === 'foro'
                      ? 'No se pudo abrir el foro. Prueba de nuevo en un rato.'
                      : 'No se pudieron abrir las ideas. Prueba de nuevo en un rato.'
                    : vista === 'foro'
                      ? 'Abriendo el foro…'
                      : 'Abriendo las ideas…'}
                </p>
              ) : vista === 'foro' ? (
                <Foro
                  social={social}
                  agentes={r.agentes}
                  retratos={retratos}
                  ahora={ahora}
                  foco={dir.foco}
                  vez={vez}
                  abrirFicha={abrir}
                  abrirFoto={abrirFoto}
                  irIdea={irIdea}
                  irIdeas={irIdeas}
                  irPost={irPost}
                  meGusta={meGusta}
                />
              ) : (
                <IdeasEquipo
                  ideas={social.ideas}
                  foro={social.foro}
                  agentes={r.agentes}
                  retratos={retratos}
                  ahora={ahora}
                  foco={dir.foco}
                  vez={vez}
                  filtro={filtroIdeas}
                  cambiarFiltro={setFiltroIdeas}
                  abrirFicha={abrir}
                  irPost={irPost}
                  decidir={decidir}
                />
              )}
            </section>
          ) : (
          <section
            id={idPanel}
            className={`of-vista${enLado ? ' of-con-lado' : ''}`}
            role="tabpanel"
            aria-label={vista === 'plano' ? 'El plano' : 'La oficina'}
          >
            {/* la maqueta (o el plano) nunca se vuelve a crear por abrir algo al lado: solo se mide de nuevo. En grande,
                la de la página se desmonta y deja su lugar vacío (un solo dibujo andando) */}
            <div className="of-izq">
              {vista === 'oficina' ? (
                <>
                  {enGrande === 'maqueta' ? <Hueco de="maqueta" /> : seccionEn('maqueta', 'normal')}
                  {seccionEn('dia', 'normal')}
                </>
              ) : enGrande === 'plano' ? (
                <Hueco de="plano" />
              ) : (
                seccionEn('plano', 'normal')
              )}
            </div>
            {enLado ? (
              <Lado seccion={enLado} cuentas={{ parati: paraTiN }} cambiar={cambiarSeccion}>
                {seccionEn(enLado, 'lado')}
              </Lado>
            ) : (
              <aside className="of-lado" aria-label="Para ti, el chat y lo de ahora">
                {seccionEn('parati', 'normal')}
                {seccionEn('chat', 'normal')}
                {seccionEn('ahora', 'normal')}
              </aside>
            )}
          </section>
          )}
        </Cuerpo>
      </div>

      {/* la ficha y los avisos van encima de todo, también de lo que está en grande (el visor, encima de la ficha) */}
      <Capa>
        <Ficha
          agente={agenteFicha}
          abierta={ficha.abierta}
          agentes={r.agentes}
          marcas={r.marcas}
          paraTi={o.paraTi}
          pubs={r.pubs}
          lineas={lineas}
          fotos={social?.fotos ?? []}
          foro={social?.foro ?? []}
          lugar={agenteFicha ? sala[agenteFicha.id] ?? null : null}
          dormida={dormida}
          ahora={ahora}
          cerrar={cerrar}
          ver={o.ver}
          abrirFoto={abrirFoto}
          irPost={irPost}
          refFicha={fichaRef}
        />
        <div className="of-avisos" role="status" aria-live="polite">
          {o.aviso && (
            <div key={o.aviso.id} className="of-aviso">
              {o.aviso.texto}
            </div>
          )}
        </div>
      </Capa>

      {enGrande && (
        <Grande
          titulo={TITULO[enGrande]}
          nombre={NOMBRE[enGrande]}
          cerrar={cerrarSeccion}
          alLado={puedeLado && DE_LADO.includes(enGrande) ? () => abrirSeccion(enGrande, 'lado') : undefined}
        >
          {seccionEn(enGrande, 'grande')}
        </Grande>
      )}

      <Visor foto={foto} agentes={r.agentes} cerrar={cerrarFoto} abrirFicha={abrir} />
    </ClaseCapa.Provider>
  )
}
