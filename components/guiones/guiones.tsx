'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { contarFiltros, debeRefrescar, enFiltro, FILTRO_LABEL, FILTROS, filtroDe, firmaGuiones, REFRESCAR_MS, resumenGuiones, type Filtro } from '@/lib/guiones/reglas'
import type { GuionFila } from '@/lib/guiones/tipos'
import { idDeAncla } from '@/lib/guiones/vista'
import { Encabezado, Vacio } from '@/components/crm/piezas'
import { Lector } from './lector'
import { usarSubidas } from './subidas'
import { TarjetaGuion } from './tarjeta'

const VACIO: Record<Filtro, string> = {
  grabar: 'No hay guiones por grabar. Cada noche llega uno nuevo.',
  editando: 'Ahora no se está editando ningún video.',
  listos: 'Todavía no hay guiones con sus versiones programadas.',
  todos: 'Todavía no hay guiones. Cada noche llega uno para que lo grabes a cámara.',
}

const RESALTAR_MS = 3_000

const urlDe = (f: Filtro) => (f === 'grabar' ? '/guiones' : `/guiones?f=${f}`)

// «Guiones»: el guion de cada noche para grabar a cámara. Las pestañas filtran en el teléfono (sin ir al servidor) y
// cada guion tiene su ancla #<id>: el enlace de Telegram o de la Oficina abre la pestaña donde está y lo marca.
// Lo que acaba de cambiar (un video subido, un descarte) se queda a la vista hasta cambiar de pestaña.
export function Guiones({ guiones, filtro: inicial, hoy, ahora, error }: { guiones: GuionFila[]; filtro: Filtro; hoy: string; ahora: string; error?: string }) {
  const router = useRouter()
  const [filtro, setFiltro] = useState<Filtro>(inicial)
  const [fijos, setFijos] = useState<ReadonlySet<string>>(() => new Set())
  const [resaltado, setResaltado] = useState<string | null>(null)
  const [leyendo, setLeyendo] = useState<string | null>(null)

  // La última vez que él hizo algo en la página (la que se pone al día sola deja de preguntar si nadie hace nada)
  const actividad = useRef(0)
  const despertar = useCallback(() => {
    actividad.current = Date.now()
  }, [])

  const fijar = useCallback((id: string) => setFijos((s) => (s.has(id) ? s : new Set(s).add(id))), [])
  const subidas = usarSubidas({ alTerminar: fijar })

  const elegir = useCallback(
    (f: Filtro) => {
      despertar()
      setFiltro(f)
      setFijos(new Set())
      window.history.replaceState(null, '', urlDe(f))
    },
    [despertar],
  )

  // El ancla: al abrir la página y cuando cambia el #
  const lista = useRef(guiones)
  lista.current = guiones
  const actual = useRef(filtro)
  actual.current = filtro
  useEffect(() => {
    let reloj: ReturnType<typeof setTimeout> | undefined
    const ir = () => {
      const id = idDeAncla(window.location.hash)
      const g = id ? lista.current.find((x) => x.id === id) : undefined
      if (!g) return
      if (!enFiltro(g.estado, actual.current)) {
        const nuevo = filtroDe(g.estado)
        setFiltro(nuevo)
        window.history.replaceState(null, '', `${urlDe(nuevo)}#${g.id}`)
      }
      setResaltado(g.id)
      clearTimeout(reloj)
      reloj = setTimeout(() => setResaltado(null), RESALTAR_MS)
      requestAnimationFrame(() => requestAnimationFrame(() => document.getElementById(g.id)?.scrollIntoView({ block: 'start' })))
    }
    ir()
    window.addEventListener('hashchange', ir)
    return () => {
      window.removeEventListener('hashchange', ir)
      clearTimeout(reloj)
    }
  }, [])

  // Mientras el servidor edita, la página se pone al día sola cada 30 s para ver cuándo queda lista. Si en 15 minutos no
  // cambió nada ni él hizo nada, deja de preguntar; al volver a la página (o al tocar algo) se pone al día otra vez.
  const firma = firmaGuiones(guiones)
  const cambio = useRef({ firma: '', en: 0 })
  useEffect(() => {
    if (cambio.current.firma !== firma) cambio.current = { firma, en: Date.now() }
  }, [firma])
  const editando = guiones.some((g) => g.estado === 'subido' || g.estado === 'editando')
  useEffect(() => {
    if (!editando) return
    despertar()
    let dormida = false
    const t = setInterval(() => {
      const ok = debeRefrescar({ ahora: Date.now(), visible: document.visibilityState === 'visible', ultimoCambio: cambio.current.en, ultimaActividad: actividad.current })
      dormida = !ok
      if (ok) router.refresh()
    }, REFRESCAR_MS)
    const volver = () => {
      if (document.visibilityState !== 'visible') return
      despertar()
      if (dormida) {
        dormida = false
        router.refresh()
      }
    }
    window.addEventListener('focus', volver)
    document.addEventListener('visibilitychange', volver)
    return () => {
      clearInterval(t)
      window.removeEventListener('focus', volver)
      document.removeEventListener('visibilitychange', volver)
    }
  }, [editando, router, despertar])

  const cuentas = useMemo(() => contarFiltros(guiones), [guiones])
  const visibles = guiones.filter((g) => enFiltro(g.estado, filtro) || fijos.has(g.id))
  const ahoraFecha = useMemo(() => new Date(ahora), [ahora])
  const enLectura = leyendo ? (guiones.find((g) => g.id === leyendo) ?? null) : null

  return (
    <div className="max-w-3xl px-4 pb-16 md:px-8">
      <Encabezado titulo="Guiones" resumen={error ? undefined : resumenGuiones(guiones)} />

      {error ? (
        <Vacio>{error}</Vacio>
      ) : (
        <>
          <nav aria-label="Filtrar guiones" className="-mx-4 mb-4 overflow-x-auto px-4 [scrollbar-width:none] md:mx-0 md:px-0 [&::-webkit-scrollbar]:hidden">
            <div className="pn-tabs w-max">
              {FILTROS.map((f) => (
                <a
                  key={f}
                  href={urlDe(f)}
                  aria-current={f === filtro ? 'page' : undefined}
                  onClick={(e) => {
                    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return
                    e.preventDefault()
                    elegir(f)
                  }}
                  className="pn-tab inline-flex min-h-10 items-center gap-1.5 !px-2.5 sm:!px-3"
                >
                  {FILTRO_LABEL[f]}
                  <span className="tabular-nums text-fg/40">{cuentas[f]}</span>
                </a>
              ))}
            </div>
          </nav>

          {visibles.length === 0 ? (
            <Vacio>{VACIO[filtro]}</Vacio>
          ) : (
            <ul className="space-y-4">
              {visibles.map((g) => (
                <li key={g.id}>
                  <TarjetaGuion
                    guion={g}
                    hoy={hoy}
                    ahora={ahoraFecha}
                    resaltado={resaltado === g.id}
                    subidas={subidas.porGuion(g.id)}
                    alLeer={() => {
                      despertar()
                      setLeyendo(g.id)
                    }}
                    alSubir={(archivos) => {
                      despertar()
                      fijar(g.id)
                      subidas.subir(g.id, archivos)
                    }}
                    alReintentar={(clave) => {
                      despertar()
                      subidas.reintentar(clave)
                    }}
                    alQuitar={subidas.quitar}
                    alCerrarSubidas={() => subidas.limpiar(g.id)}
                    alCambiar={() => {
                      despertar()
                      fijar(g.id)
                    }}
                  />
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      <Lector guion={enLectura} cerrar={() => setLeyendo(null)} />
    </div>
  )
}
