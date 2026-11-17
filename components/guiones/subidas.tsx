'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, RotateCcw, X } from 'lucide-react'
import { avanceLegible, comoReintentar, EN_CURSO, errorDeSubida, revisarArchivo, SE_CORTO, type Fase, type TipoVideo } from '@/lib/guiones/subida'
import { tamanoLegible } from '@/lib/guiones/vista'
import { Boton, ICONO } from '@/components/crm/piezas'
import { usarPantallaPrendida } from './pantalla-prendida'

// Las subidas de videos desde el teléfono. Cada archivo: pide la URL firmada (POST /api/guiones/<id>/subida; el servidor
// lo anota como pendiente y no edita el guion mientras tanto), sube el archivo con XHR directo a Supabase Storage (el
// avance de verdad) y avisa que terminó (POST …/subida/lista). «Reintentar» hace solo lo que falta (lib/guiones/subida.ts:
// comoReintentar); «Cancelar» y «Quitar» le avisan al servidor que ya no la espere. Mientras sube, la pantalla no se
// apaga y cerrar la página pide confirmar.

// `yaSubio`: el PUT llegó a Storage (si algo falló después, «Reintentar» solo avisa)
export type Subida = { clave: string; guion: string; nombre: string; bytes: number; fase: Fase; progreso: number; error: string | null; invalida: boolean; yaSubio: boolean }

type Interna = Subida & { archivo: File; tipo: TipoVideo | null; ruta: string | null; xhr: XMLHttpRequest | null; cancelada: boolean; avisada: boolean }

const A_LA_VEZ = 3
const PINTAR_CADA_MS = 200
const SIN_SESION = 'Se cerró tu sesión. Vuelve a entrar al panel y toca «Reintentar».'

const enCurso = (s: Pick<Subida, 'fase'>) => EN_CURSO.includes(s.fase)

type FallaApi = Error & { codigo?: string }

async function pedir<T>(url: string, body: unknown): Promise<T> {
  let res: Response
  try {
    res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  } catch {
    throw new Error(SE_CORTO)
  }
  if (res.status === 401) throw new Error(SIN_SESION)
  const data = (await res.json().catch(() => null)) as (T & { error?: unknown; codigo?: unknown }) | null
  if (!res.ok || !data) {
    const e: FallaApi = new Error(typeof data?.error === 'string' ? data.error : 'No se pudo. Toca «Reintentar».')
    if (typeof data?.codigo === 'string') e.codigo = data.codigo
    throw e
  }
  return data
}

// Que el servidor ya no espere esa subida (y borre el archivo si alcanzó a llegar sin anotarse). Si falla, la
// pendiente vence sola a las 2 horas.
function soltarEnServidor(guion: string, ruta: string) {
  void fetch(`/api/guiones/${guion}/subida/cancelar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ruta }),
    keepalive: true,
  }).catch(() => {})
}

export function usarSubidas({ alTerminar }: { alTerminar(guion: string): void }) {
  const router = useRouter()
  const items = useRef<Interna[]>([])
  const cuenta = useRef(0)
  const [, setVersion] = useState(0)
  const repintar = useCallback(() => setVersion((v) => v + 1), [])
  const terminar = useRef(alTerminar)
  terminar.current = alTerminar

  const cambiar = useCallback(
    (it: Interna, cambios: Partial<Interna>) => {
      Object.assign(it, cambios)
      repintar()
    },
    [repintar],
  )

  const subirArchivo = useCallback(
    (it: Interna, url: string) =>
      new Promise<void>((resolver, rechazar) => {
        const xhr = new XMLHttpRequest()
        it.xhr = xhr
        let pintado = 0
        xhr.upload.onprogress = (e) => {
          if (!e.lengthComputable) return
          it.progreso = e.loaded / e.total
          const t = Date.now()
          if (t - pintado > PINTAR_CADA_MS) {
            pintado = t
            repintar()
          }
        }
        xhr.upload.onload = () => cambiar(it, { progreso: 1 })
        xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolver() : rechazar(new Error(errorDeSubida(xhr.status, xhr.responseText))))
        xhr.onerror = () => rechazar(new Error(SE_CORTO))
        xhr.onabort = () => rechazar(new Error('Cancelada'))
        xhr.open('PUT', url)
        // El archivo va tal cual (sin formulario): Storage guarda el tipo que dice este encabezado
        xhr.setRequestHeader('Content-Type', it.tipo ?? 'video/mp4')
        xhr.send(it.archivo)
      }),
    [cambiar, repintar],
  )

  // Cuando ya no queda nada subiendo de un guion y alguno llegó: se avisa una vez y la página se pone al día
  const revisarFin = useCallback(
    (guion: string) => {
      const suyas = items.current.filter((i) => i.guion === guion)
      if (suyas.some(enCurso)) return
      const nuevas = suyas.filter((i) => i.fase === 'lista' && !i.avisada)
      if (!nuevas.length) return
      for (const i of nuevas) i.avisada = true
      terminar.current(guion)
      router.refresh()
    },
    [router],
  )

  const siguiente = useRef<() => void>(() => {})

  const correr = useCallback(
    async (it: Interna) => {
      const avisar = (ruta: string) => pedir(`/api/guiones/${it.guion}/subida/lista`, { ruta })
      try {
        const plan = comoReintentar({ ruta: it.ruta, subido: it.yaSubio })
        let reemplaza: string | null = null
        if (plan.paso === 'subir') reemplaza = plan.reemplaza
        else {
          cambiar(it, { fase: 'revisando', progreso: 1, error: null })
          try {
            await avisar(plan.ruta)
            cambiar(it, { fase: 'lista' })
            return
          } catch (e) {
            // Se cortó sin saber si llegó: si el servidor dice que no está, se vuelve a subir soltando esa ruta
            if (plan.paso !== 'revisar' || (e as FallaApi).codigo !== 'no_esta') throw e
            reemplaza = plan.ruta
          }
        }
        cambiar(it, { fase: 'preparando', progreso: 0, error: null })
        const { ruta, url } = await pedir<{ ruta: string; url: string }>(`/api/guiones/${it.guion}/subida`, {
          nombre: it.archivo.name,
          bytes: it.archivo.size,
          tipo: it.tipo,
          ...(reemplaza ? { reemplaza } : {}),
        })
        it.ruta = ruta
        it.yaSubio = false
        if (it.cancelada) {
          soltarEnServidor(it.guion, ruta)
          return
        }
        cambiar(it, { fase: 'subiendo' })
        await subirArchivo(it, url)
        it.yaSubio = true
        if (it.cancelada) return
        cambiar(it, { fase: 'revisando', progreso: 1 })
        await avisar(ruta)
        cambiar(it, { fase: 'lista' })
      } catch (e) {
        if (!it.cancelada) cambiar(it, { fase: 'error', error: e instanceof Error ? e.message : 'No se pudo subir' })
      } finally {
        it.xhr = null
        revisarFin(it.guion)
        siguiente.current()
      }
    },
    [cambiar, revisarFin, subirArchivo],
  )

  // Hasta 3 a la vez; los demás esperan en fila
  siguiente.current = () => {
    let activas = items.current.filter((i) => enCurso(i) && i.fase !== 'esperando').length
    for (const it of items.current) {
      if (activas >= A_LA_VEZ) break
      if (it.fase !== 'esperando') continue
      activas++
      void correr(it)
    }
  }

  const subir = useCallback(
    (guion: string, archivos: File[]) => {
      for (const archivo of archivos) {
        const r = revisarArchivo(archivo)
        items.current.push({
          clave: `s${++cuenta.current}`,
          guion,
          nombre: archivo.name || 'video',
          bytes: archivo.size,
          archivo,
          tipo: r.ok ? r.tipo : null,
          fase: r.ok ? 'esperando' : 'error',
          progreso: 0,
          error: r.ok ? null : r.error,
          invalida: !r.ok,
          yaSubio: false,
          ruta: null,
          xhr: null,
          cancelada: false,
          avisada: false,
        })
      }
      repintar()
      siguiente.current()
    },
    [repintar],
  )

  const reintentar = useCallback(
    (clave: string) => {
      const it = items.current.find((i) => i.clave === clave)
      if (!it || it.fase !== 'error' || it.invalida) return
      cambiar(it, { fase: 'esperando', progreso: it.yaSubio ? 1 : 0, error: null, avisada: false })
      siguiente.current()
    },
    [cambiar],
  )

  const quitar = useCallback(
    (clave: string) => {
      const it = items.current.find((i) => i.clave === clave)
      if (!it || it.fase === 'revisando' || it.fase === 'lista') return
      it.cancelada = true
      it.xhr?.abort()
      if (it.ruta) soltarEnServidor(it.guion, it.ruta)
      items.current = items.current.filter((i) => i !== it)
      repintar()
      revisarFin(it.guion)
      siguiente.current()
    },
    [repintar, revisarFin],
  )

  // «Cerrar»: se va lo que ya terminó de ese guion
  const limpiar = useCallback(
    (guion: string) => {
      items.current = items.current.filter((i) => i.guion !== guion || enCurso(i))
      repintar()
    },
    [repintar],
  )

  const activas = items.current.filter(enCurso).length
  usarPantallaPrendida(activas > 0)

  useEffect(() => {
    if (!activas) return
    const avisar = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', avisar)
    return () => window.removeEventListener('beforeunload', avisar)
  }, [activas])

  const porGuion = (guion: string): Subida[] =>
    items.current
      .filter((i) => i.guion === guion)
      .map(({ archivo: _a, xhr: _x, cancelada: _c, avisada: _v, tipo: _t, ruta: _r, ...s }) => s)

  return { porGuion, subir, reintentar, quitar, limpiar, activas }
}

// La lista de videos de un guion, con el avance de cada uno
export function ListaSubidas(p: { subidas: Subida[]; alReintentar(clave: string): void; alQuitar(clave: string): void; alCerrar(): void }) {
  const { subidas } = p
  if (!subidas.length) return null
  const subiendo = subidas.some(enCurso)
  const listas = subidas.filter((s) => s.fase === 'lista').length
  // Un archivo que no era video no frena el «Listo»: los videos sí subieron
  const fallidas = subidas.filter((s) => s.fase === 'error' && !s.invalida).length
  const todoListo = !subiendo && listas > 0 && fallidas === 0

  return (
    <div className="mt-4 rounded-[14px] bg-fg/[0.03] p-3 ring-1 ring-inset ring-fg/[0.06] sm:p-4">
      <ul className="space-y-4">
        {subidas.map((s) => {
          const pct = Math.floor(s.progreso * 100)
          return (
            <li key={s.clave}>
              <div className="flex items-baseline justify-between gap-3">
                <p className="min-w-0 truncate text-sm text-fg/85">
                  {s.nombre}
                  <span className="ml-2 text-[12px] text-fg/40">{tamanoLegible(s.bytes)}</span>
                </p>
                <p className={`flex shrink-0 items-center gap-1 text-[13px] tabular-nums ${s.fase === 'error' ? 'text-red-300' : s.fase === 'lista' ? 'text-fg' : 'text-fg/60'}`}>
                  {s.fase === 'lista' && <Check size={14} {...ICONO} />}
                  {avanceLegible(s.fase, s.progreso, s.yaSubio)}
                </p>
              </div>
              {enCurso(s) && (
                <div className="flex items-center gap-1">
                  <div
                    className="pn-meter pn-meter--accent !h-1.5 flex-1"
                    role="progressbar"
                    aria-label={`Subiendo ${s.nombre}`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={s.fase === 'subiendo' || s.fase === 'revisando' ? pct : 0}
                  >
                    <span style={{ width: `${s.fase === 'subiendo' || s.fase === 'revisando' ? pct : 0}%` }} />
                  </div>
                  {s.fase === 'revisando' ? (
                    <span className="h-11 w-11 shrink-0" />
                  ) : (
                    <button
                      type="button"
                      onClick={() => p.alQuitar(s.clave)}
                      aria-label={`Cancelar ${s.nombre}`}
                      title="Cancelar"
                      className="-mr-2 grid h-11 w-11 shrink-0 place-items-center rounded-full text-fg/50 hover:text-fg"
                    >
                      <X size={17} {...ICONO} />
                    </button>
                  )}
                </div>
              )}
              {s.error && (
                <p role="alert" className="mt-1.5 text-[13px] leading-snug text-red-300">
                  {s.error}
                </p>
              )}
              {s.fase === 'error' && s.yaSubio && <p className="mt-1 text-[13px] leading-snug text-fg/55">El video ya llegó: «Reintentar» solo le avisa al servidor.</p>}
              {s.fase === 'error' && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {!s.invalida && (
                    <Boton principal onClick={() => p.alReintentar(s.clave)} className="min-h-11">
                      <RotateCcw size={15} {...ICONO} />
                      Reintentar
                    </Boton>
                  )}
                  <Boton onClick={() => p.alQuitar(s.clave)} className="min-h-11 !border-transparent !bg-transparent !shadow-none text-fg/55 hover:text-fg">
                    <X size={15} {...ICONO} />
                    Quitar
                  </Boton>
                </div>
              )}
            </li>
          )
        })}
      </ul>
      {subiendo && (
        <p className="mt-4 text-[13px] leading-snug text-fg/70">Deja esta página abierta mientras sube: en el iPhone, si te sales de Safari, la subida se puede detener.</p>
      )}
      {todoListo && (
        <p role="status" className="mt-4 text-sm font-medium leading-snug text-fg">
          {listas === 1 ? 'Listo: ya está subido. El servidor lo edita y te aviso por Telegram.' : 'Listo: ya están subidos. El servidor los edita y te aviso por Telegram.'}
        </p>
      )}
      {!subiendo && (
        <button type="button" onClick={p.alCerrar} className="mt-3 min-h-11 text-[13px] font-medium text-fg/55 hover:text-fg">
          Cerrar
        </button>
      )}
    </div>
  )
}
