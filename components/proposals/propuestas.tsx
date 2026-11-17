'use client'

import { useMemo, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check, ChevronDown, Clock, Copy, ExternalLink, FileText, Pencil, Plus, Upload, X } from 'lucide-react'
import { DeleteProposalButton } from '@/components/proposals/delete-proposal-button'
import { Aviso, Boton, CAMPO, ETIQUETA, Encabezado, ICONO, Seccion, Vacio } from '@/components/crm/piezas'
import { actualizarPropuesta, borrarArchivo, crearPropuestaPdf } from '@/app/(internal)/propuestas/actions'
import { enDias, ESTADO_LABEL, ESTADOS, peso, ultimoDia, vigente, type EstadoPropuesta } from '@/lib/proposals/archivos-reglas'

export type ArchivoFila = { id: string; etiqueta: string; nombre: string; bytes: number | null }

export type FilaPropuesta = {
  id: string
  slug: string
  url: string
  cliente: string
  proyecto: string
  creada: string
  expira: string
  autor: string
  estado: EstadoPropuesta
  monto: string | null
  enviadaA: string | null
  tienePagina: boolean
  // Las que salieron del formulario de solicitudes: su estado y servicios vienen de ahí
  solicitud: { estado: string; servicios: string[] } | null
  archivos: ArchivoFila[]
}

export type Filtro = 'vigentes' | 'vencidas' | 'todas'
const FILTROS: Filtro[] = ['vigentes', 'vencidas', 'todas']
const FILTRO_LABEL: Record<Filtro, string> = { vigentes: 'Vigentes', vencidas: 'Vencidas', todas: 'Todas' }
const VACIO: Record<Filtro, string> = {
  vigentes: 'No hay propuestas con el link activo.',
  vencidas: 'No hay propuestas vencidas.',
  todas: 'Todavía no hay propuestas.',
}
const urlDe = (f: Filtro) => (f === 'vigentes' ? '/propuestas' : `/propuestas?f=${f}`)

const ESTADO_TONO: Record<EstadoPropuesta, string> = {
  borrador: 'bg-fg/[0.06] text-fg/60',
  enviada: 'bg-fg/[0.08] text-fg/80',
  aceptada: 'bg-emerald-400/10 text-emerald-400',
  rechazada: 'bg-red-400/10 text-red-300',
}

// '2026-12-15' → '15 dic 2026'
function dia(d: string): string {
  const [y, m, n] = d.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, n)).toLocaleDateString('es-CR', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
}

// Pide al servidor y devuelve el JSON, o lanza el error que mandó
async function pedir<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  const data = (await res.json().catch(() => null)) as (T & { error?: string }) | null
  if (res.status === 401) throw new Error('Se cerró tu sesión. Vuelve a entrar al panel.')
  if (!res.ok || !data) throw new Error(data?.error ?? 'No se pudo. Prueba de nuevo.')
  return data
}

// Sube un PDF directo a Storage y lo anota en la propuesta
async function subirPdf(propuestaId: string, archivo: File) {
  const { ruta, url } = await pedir<{ ruta: string; url: string }>(`/api/proposals/${propuestaId}/archivos`, { nombre: archivo.name, bytes: archivo.size })
  let res: Response
  try {
    res = await fetch(url, { method: 'PUT', headers: { 'Content-Type': 'application/pdf', 'x-upsert': 'false' }, body: archivo })
  } catch {
    throw new Error(`Se cortó la subida de ${archivo.name}. Prueba de nuevo.`)
  }
  if (!res.ok) throw new Error(`No se pudo subir ${archivo.name}.`)
  await pedir(`/api/proposals/${propuestaId}/archivos/listo`, { ruta, nombre: archivo.name })
}

// «Propuestas»: las vigentes arriba (el link todavía abre), las vencidas aparte. Cada una con su estado, monto, a
// quién se envió, sus PDF y cuándo vence el link.
export function Propuestas({ filas, filtro: inicial, ahora, labels }: { filas: FilaPropuesta[]; filtro: Filtro; ahora: string; labels: Record<string, string> }) {
  const [filtro, setFiltro] = useState<Filtro>(inicial)
  const [creando, setCreando] = useState(false)
  const fecha = useMemo(() => new Date(ahora), [ahora])

  const cuentas = useMemo(() => {
    const vig = filas.filter((f) => vigente(f.expira, fecha)).length
    return { vigentes: vig, vencidas: filas.length - vig, todas: filas.length }
  }, [filas, fecha])
  const visibles = filas.filter((f) => filtro === 'todas' || (filtro === 'vigentes') === vigente(f.expira, fecha))

  const elegir = (f: Filtro) => {
    setFiltro(f)
    window.history.replaceState(null, '', urlDe(f))
  }

  return (
    <div className="max-w-4xl px-4 pb-16 md:px-8">
      <Encabezado titulo="Propuestas" resumen={`${cuentas.vigentes} con el link activo · ${cuentas.vencidas} vencidas`}>
        {!creando && (
          <Boton principal onClick={() => setCreando(true)}>
            <Plus size={15} {...ICONO} />
            Nueva propuesta
          </Boton>
        )}
      </Encabezado>

      {creando && <NuevaPropuesta hoy={fecha} cerrar={() => setCreando(false)} />}

      <nav aria-label="Filtrar propuestas" className="-mx-4 mb-4 overflow-x-auto px-4 [scrollbar-width:none] md:mx-0 md:px-0 [&::-webkit-scrollbar]:hidden">
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
        <ul className="space-y-3">
          {visibles.map((f) => (
            <li key={f.id}>
              <Tarjeta fila={f} ahora={fecha} labels={labels} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function Tarjeta({ fila: f, ahora, labels }: { fila: FilaPropuesta; ahora: Date; labels: Record<string, string> }) {
  const router = useRouter()
  const [editando, setEditando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pendiente, empezar] = useTransition()
  const activa = vigente(f.expira, ahora)
  const abre = activa && (f.tienePagina || f.archivos.length > 0)

  const guardar = (cambios: Parameters<typeof actualizarPropuesta>[1], despues?: () => void) =>
    empezar(async () => {
      setError(null)
      const r = await actualizarPropuesta(f.id, cambios)
      if (!r.ok) return setError(r.error)
      despues?.()
      router.refresh()
    })

  return (
    <article className="pn-glass rounded-[20px] p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold leading-snug text-fg">{f.cliente}</h2>
          {f.proyecto !== f.cliente && <p className="mt-0.5 text-[13px] text-fg/55">{f.proyecto}</p>}
        </div>
        {f.solicitud ? (
          <span className="rounded-full bg-fg/[0.06] px-2.5 py-1 text-xs text-fg/70">{f.solicitud.estado}</span>
        ) : (
          <span className="relative inline-flex">
            <select
              aria-label="Estado de la propuesta"
              value={f.estado}
              disabled={pendiente}
              onChange={(e) => guardar({ status: e.target.value as EstadoPropuesta })}
              className={`cursor-pointer appearance-none rounded-full border-0 py-1 pl-2.5 pr-6 text-xs font-medium focus:outline-none disabled:opacity-50 ${ESTADO_TONO[f.estado]}`}
            >
              {ESTADOS.map((e) => (
                <option key={e} value={e} className="bg-solid text-fg">
                  {ESTADO_LABEL[e]}
                </option>
              ))}
            </select>
            <ChevronDown size={12} {...ICONO} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-fg/50" />
          </span>
        )}
      </div>

      <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-[12.5px]">
        <Dato label="Monto">{f.monto ?? <span className="text-fg/35">—</span>}</Dato>
        {f.enviadaA && <Dato label="Para">{f.enviadaA}</Dato>}
        <Dato label="Creada">{dia(f.creada.slice(0, 10))}</Dato>
        <Dato label={activa ? 'Vence' : 'Venció'}>
          <span className={activa ? '' : 'text-red-300'}>{dia(ultimoDia(f.expira))}</span>
        </Dato>
        <Dato label="Por">{f.autor}</Dato>
      </dl>

      {f.solicitud && f.solicitud.servicios.length > 0 && (
        <p className="mt-2 flex flex-wrap gap-1">
          {f.solicitud.servicios.map((s) => (
            <span key={s} className="rounded bg-fg/[0.05] px-1.5 py-0.5 text-[11px] text-fg/55">
              {labels[s] ?? s}
            </span>
          ))}
        </p>
      )}

      {editando && <Editar fila={f} pendiente={pendiente} cancelar={() => setEditando(false)} guardar={(c) => guardar(c, () => setEditando(false))} />}

      <Archivos fila={f} />

      {error && (
        <div className="mt-2">
          <Aviso>{error}</Aviso>
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-fg/[0.06] pt-3 text-[12.5px]">
        {f.tienePagina ? <span className="text-fg/45">Página web</span> : <span className="text-fg/45">Solo PDF</span>}
        {abre && (
          <a href={f.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-fg/60 transition-colors hover:text-fg">
            <ExternalLink size={13} {...ICONO} />
            Abrir link
          </a>
        )}
        {abre && <CopiarLink url={f.url} />}
        <span className="ml-auto flex items-center gap-4">
          {!editando && (
            <button type="button" onClick={() => setEditando(true)} className="inline-flex items-center gap-1.5 text-fg/60 transition-colors hover:text-fg">
              <Pencil size={13} {...ICONO} />
              Editar
            </button>
          )}
          {activa && (
            <button
              type="button"
              disabled={pendiente}
              onClick={() => confirm(`¿Vencer ya el link de «${f.proyecto}»? Se puede volver a activar cambiando la fecha.`) && guardar({ vence: 'ya' })}
              className="inline-flex items-center gap-1.5 text-fg/60 transition-colors hover:text-fg disabled:opacity-40"
            >
              <Clock size={13} {...ICONO} />
              Vencer ya
            </button>
          )}
          <DeleteProposalButton slug={f.slug} />
        </span>
      </div>
    </article>
  )
}

function CopiarLink({ url }: { url: string }) {
  const [copiado, setCopiado] = useState(false)
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(url)
        setCopiado(true)
        setTimeout(() => setCopiado(false), 2000)
      }}
      className="inline-flex items-center gap-1.5 text-fg/60 transition-colors hover:text-fg"
    >
      {copiado ? <Check size={13} {...ICONO} className="text-emerald-400" /> : <Copy size={13} {...ICONO} />}
      {copiado ? 'Copiado' : 'Copiar link'}
    </button>
  )
}

function Dato({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <dt className="text-fg/40">{label}</dt>
      <dd className="text-fg/80">{children}</dd>
    </div>
  )
}

function Editar({ fila: f, pendiente, cancelar, guardar }: { fila: FilaPropuesta; pendiente: boolean; cancelar: () => void; guardar: (c: Parameters<typeof actualizarPropuesta>[1]) => void }) {
  const [monto, setMonto] = useState(f.monto ?? '')
  const [para, setPara] = useState(f.enviadaA ?? '')
  const [vence, setVence] = useState(ultimoDia(f.expira))
  return (
    <form
      className="mt-3 grid gap-3 rounded-2xl bg-fg/[0.03] p-3 sm:grid-cols-3"
      onSubmit={(e) => {
        e.preventDefault()
        guardar({ amount: monto, sentTo: para, ...(vence !== ultimoDia(f.expira) ? { vence } : {}) })
      }}
    >
      <label className="block">
        <span className={ETIQUETA}>Monto</span>
        <input value={monto} onChange={(e) => setMonto(e.target.value)} placeholder="$3,000 + $500/mes" className={CAMPO} />
      </label>
      <label className="block">
        <span className={ETIQUETA}>Enviada a</span>
        <input value={para} onChange={(e) => setPara(e.target.value)} placeholder="correo o nombre" className={CAMPO} />
      </label>
      <label className="block">
        <span className={ETIQUETA}>El link sirve hasta</span>
        <input type="date" required value={vence} onChange={(e) => setVence(e.target.value)} className={CAMPO} />
      </label>
      <div className="flex gap-2 sm:col-span-3">
        <Boton principal type="submit" disabled={pendiente}>
          Guardar
        </Boton>
        <Boton onClick={cancelar} disabled={pendiente}>
          Cancelar
        </Boton>
      </div>
    </form>
  )
}

function Archivos({ fila: f }: { fila: FilaPropuesta }) {
  const router = useRouter()
  const input = useRef<HTMLInputElement>(null)
  const [subiendo, setSubiendo] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pendiente, empezar] = useTransition()

  async function subir(lista: FileList | null) {
    if (!lista?.length) return
    setError(null)
    try {
      for (const a of Array.from(lista)) {
        setSubiendo(a.name)
        await subirPdf(f.id, a)
      }
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo subir el PDF.')
    } finally {
      setSubiendo(null)
      if (input.current) input.current.value = ''
    }
  }

  const quitar = (a: ArchivoFila) => {
    if (!confirm(`¿Borrar «${a.nombre}»? No se puede deshacer.`)) return
    empezar(async () => {
      const r = await borrarArchivo(a.id)
      if (!r.ok) return setError(r.error)
      router.refresh()
    })
  }

  return (
    <div className="mt-3">
      <div className="flex flex-wrap items-center gap-2">
        {f.archivos.map((a) => (
          <span key={a.id} className="pn-btn-glass inline-flex items-center gap-1.5 !py-1.5 pl-3 pr-1.5 text-[12.5px]">
            <a href={`/api/proposals/archivos/${a.id}`} title={a.nombre} className="inline-flex items-center gap-1.5 text-fg/80 hover:text-fg">
              <FileText size={13} {...ICONO} />
              {a.etiqueta}
              {a.bytes ? <span className="text-fg/40">{peso(a.bytes)}</span> : null}
            </a>
            <button type="button" aria-label={`Borrar ${a.nombre}`} disabled={pendiente} onClick={() => quitar(a)} className="rounded-full p-1 text-fg/35 hover:text-red-400 disabled:opacity-40">
              <X size={12} {...ICONO} />
            </button>
          </span>
        ))}
        <button
          type="button"
          disabled={!!subiendo}
          onClick={() => input.current?.click()}
          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[12.5px] text-fg/55 transition-colors hover:bg-fg/[0.05] hover:text-fg disabled:opacity-50"
        >
          <Upload size={13} {...ICONO} />
          {subiendo ? `Subiendo ${subiendo}…` : 'Subir PDF'}
        </button>
        <input ref={input} type="file" accept="application/pdf,.pdf" multiple hidden onChange={(e) => subir(e.target.files)} />
      </div>
      {error && (
        <div className="mt-2">
          <Aviso>{error}</Aviso>
        </div>
      )}
    </div>
  )
}

function NuevaPropuesta({ hoy, cerrar }: { hoy: Date; cerrar: () => void }) {
  const router = useRouter()
  const [cliente, setCliente] = useState('')
  const [proyecto, setProyecto] = useState('')
  const [monto, setMonto] = useState('')
  const [para, setPara] = useState('')
  const [estado, setEstado] = useState<EstadoPropuesta>('enviada')
  const [vence, setVence] = useState(() => enDias(hoy, 14))
  const [archivos, setArchivos] = useState<File[]>([])
  const [paso, setPaso] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function crear(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setPaso('Creando…')
    try {
      const r = await crearPropuestaPdf({ cliente, proyecto, monto, enviadaA: para, estado, vence })
      if (!r.ok) throw new Error(r.error)
      for (const a of archivos) {
        setPaso(`Subiendo ${a.name}…`)
        await subirPdf(r.id, a)
      }
      router.refresh()
      cerrar()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear la propuesta.')
      router.refresh()
    } finally {
      setPaso(null)
    }
  }

  return (
    <div className="mb-5">
      <Seccion
        titulo="Nueva propuesta"
        accion={
          <button type="button" onClick={cerrar} aria-label="Cerrar" className="rounded-full p-1.5 text-fg/45 hover:bg-fg/[0.05] hover:text-fg">
            <X size={15} {...ICONO} />
          </button>
        }
      >
        <p className="mb-3 text-[13px] text-fg/50">Para las propuestas hechas a mano (deck o PDF). Las del formulario de solicitudes se guardan solas.</p>
        <form onSubmit={crear} className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className={ETIQUETA}>Cliente</span>
            <input required value={cliente} onChange={(e) => setCliente(e.target.value)} placeholder="Nombre del cliente" className={CAMPO} />
          </label>
          <label className="block">
            <span className={ETIQUETA}>Proyecto</span>
            <input value={proyecto} onChange={(e) => setProyecto(e.target.value)} placeholder="Qué se le propone" className={CAMPO} />
          </label>
          <label className="block">
            <span className={ETIQUETA}>Monto</span>
            <input value={monto} onChange={(e) => setMonto(e.target.value)} placeholder="$3,000 + $500/mes" className={CAMPO} />
          </label>
          <label className="block">
            <span className={ETIQUETA}>Enviada a</span>
            <input value={para} onChange={(e) => setPara(e.target.value)} placeholder="correo o nombre" className={CAMPO} />
          </label>
          <label className="block">
            <span className={ETIQUETA}>Estado</span>
            <select value={estado} onChange={(e) => setEstado(e.target.value as EstadoPropuesta)} className={CAMPO}>
              {ESTADOS.map((x) => (
                <option key={x} value={x}>
                  {ESTADO_LABEL[x]}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className={ETIQUETA}>El link sirve hasta</span>
            <input type="date" required value={vence} onChange={(e) => setVence(e.target.value)} className={CAMPO} />
          </label>
          <label className="block sm:col-span-2">
            <span className={ETIQUETA}>PDF (uno por idioma)</span>
            <input
              type="file"
              accept="application/pdf,.pdf"
              multiple
              onChange={(e) => setArchivos(Array.from(e.target.files ?? []))}
              className="block w-full text-sm text-fg/70 file:mr-3 file:rounded-full file:border-0 file:bg-fg/[0.08] file:px-3 file:py-1.5 file:text-sm file:text-fg"
            />
          </label>
          {error && (
            <div className="sm:col-span-2">
              <Aviso>{error}</Aviso>
            </div>
          )}
          <div className="flex items-center gap-3 sm:col-span-2">
            <Boton principal type="submit" disabled={!!paso}>
              {paso ?? 'Guardar propuesta'}
            </Boton>
            <Boton onClick={cerrar} disabled={!!paso}>
              Cancelar
            </Boton>
          </div>
        </form>
      </Seccion>
    </div>
  )
}
