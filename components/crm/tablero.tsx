'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronDown } from 'lucide-react'
import { armarTablero, dinero, type Columna } from '@/lib/crm/tablero'
import { ESTADO_OPORTUNIDAD_LABEL, ESTADOS_OPORTUNIDAD, type EstadoOportunidad } from '@/lib/crm/tipos'
import type { PipelineVista, TarjetaVista } from '@/lib/crm/vista'
import { Aviso, Encabezado, ICONO, SubMenu, Vacio } from '@/components/crm/piezas'

const PLURAL: Record<EstadoOportunidad, string> = { abierta: 'Abiertas', ganada: 'Ganadas', perdida: 'Perdidas', abandonada: 'Abandonadas' }

type Cambio = { etapa_id: string } | { estado: EstadoOportunidad }

interface Props {
  pipelines: PipelineVista[]
  pipeline: PipelineVista
  estado: EstadoOportunidad
  tarjetas: TarjetaVista[]
}

// El tablero de un pipeline: una columna por etapa con lo que suma. En el teléfono se elige la etapa arriba y cada
// tarjeta se mueve con «Mover a…»; desde md, las columnas van lado a lado y también se puede arrastrar
export function Tablero({ pipelines, pipeline, estado, tarjetas }: Props) {
  const router = useRouter()
  const [refrescando, startRefresh] = useTransition()
  const [movidas, setMovidas] = useState<Record<string, Cambio>>({})
  const [error, setError] = useState<string | null>(null)
  const [arrastrando, setArrastrando] = useState<string | null>(null)

  // Cuando llega el tablero al día, los cambios que se mostraban antes de tiempo ya están en él
  useEffect(() => setMovidas({}), [tarjetas])

  const visibles = useMemo(
    () =>
      tarjetas
        .map((t) => ({ ...t, ...movidas[t.id] }))
        .filter((t) => t.estado === estado),
    [tarjetas, movidas, estado],
  )
  const columnas = armarTablero(pipeline.etapas, visibles)
  const [etapaTelefono, setEtapaTelefono] = useState(() => columnas.find((c) => c.tarjetas.length > 0)?.etapa.id ?? columnas[0]?.etapa.id ?? '')
  const enTelefono = columnas.find((c) => c.etapa.id === etapaTelefono) ?? columnas[0]
  const suma = columnas.reduce((n, c) => n + c.suma, 0)

  async function mover(t: TarjetaVista, cambio: Cambio) {
    if ('etapa_id' in cambio && cambio.etapa_id === t.etapa_id) return
    setError(null)
    setMovidas((m) => ({ ...m, [t.id]: cambio }))
    try {
      const res = await fetch(`/api/crm/oportunidades/${t.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cambio) })
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null
        throw new Error(data?.error ?? 'No se pudo mover. Prueba de nuevo.')
      }
      startRefresh(() => router.refresh())
    } catch (e) {
      setMovidas((m) => {
        const { [t.id]: _quitar, ...resto } = m
        return resto
      })
      // fetch avisa que no hay conexión con un TypeError; lo demás es el error que dio la API
      setError(e instanceof TypeError || !(e instanceof Error) ? 'Sin conexión. Prueba de nuevo.' : e.message)
    }
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <Encabezado
        titulo="Pipeline"
        resumen={`${pipelines.length === 1 ? `${pipeline.nombre} · ` : ''}${visibles.length} ${(visibles.length === 1 ? ESTADO_OPORTUNIDAD_LABEL[estado] : PLURAL[estado]).toLowerCase()}${suma > 0 ? ` · ${dinero(suma)}` : ''}${refrescando ? ' · guardando…' : ''}`}
      >
        {pipelines.length > 1 && (
          <label>
            <span className="sr-only">Pipeline</span>
            <select
              value={pipeline.id}
              onChange={(e) => router.push(`/crm/pipeline?pipeline=${e.target.value}`)}
              className="w-full rounded-lg border border-fg/[0.1] bg-solid px-3 py-2 text-sm text-fg focus:border-fg/50 focus:outline-none"
            >
              {pipelines.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </select>
          </label>
        )}
      </Encabezado>
      <SubMenu activa="/crm/pipeline" />

      <nav aria-label="Qué oportunidades ver" className="mb-4 flex flex-wrap gap-1.5">
        {ESTADOS_OPORTUNIDAD.map((e) => (
          <Link
            key={e}
            href={`/crm/pipeline?pipeline=${pipeline.id}${e === 'abierta' ? '' : `&estado=${e}`}`}
            aria-current={e === estado ? 'page' : undefined}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${e === estado ? 'pn-chip-on text-fg' : 'text-fg/50 ring-1 ring-inset ring-fg/10 hover:text-fg'}`}
          >
            {PLURAL[e]}
          </Link>
        ))}
      </nav>

      {error && (
        <div className="mb-3">
          <Aviso>{error}</Aviso>
        </div>
      )}

      {pipeline.etapas.length === 0 ? (
        <Vacio>Este pipeline no tiene etapas.</Vacio>
      ) : (
        <>
          {/* Teléfono: la etapa arriba (desliza para ver todas) y sus tarjetas debajo */}
          <div className="md:hidden">
            <div role="tablist" aria-label="Etapas" className="-mx-4 mb-3 flex gap-1.5 overflow-x-auto px-4 pb-1">
              {columnas.map((c) => {
                const on = c.etapa.id === enTelefono?.etapa.id
                return (
                  <button
                    key={c.etapa.id}
                    type="button"
                    role="tab"
                    aria-selected={on}
                    onClick={() => setEtapaTelefono(c.etapa.id)}
                    className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${on ? 'pn-chip-on text-fg' : 'text-fg/55 ring-1 ring-inset ring-fg/10'}`}
                  >
                    {c.etapa.nombre} <span className="tabular-nums text-fg/40">{c.tarjetas.length}</span>
                  </button>
                )
              })}
            </div>
            {enTelefono && <ColumnaTarjetas columna={enTelefono} etapas={pipeline.etapas} estado={estado} mover={mover} />}
          </div>

          {/* Desde md: las columnas lado a lado */}
          <div className="hidden gap-3 overflow-x-auto pb-3 md:flex">
            {columnas.map((c) => (
              <section
                key={c.etapa.id}
                aria-label={c.etapa.nombre}
                onDragOver={(e) => {
                  if (arrastrando) e.preventDefault()
                }}
                onDrop={(e) => {
                  e.preventDefault()
                  const t = visibles.find((x) => x.id === arrastrando)
                  setArrastrando(null)
                  if (t) void mover(t, { etapa_id: c.etapa.id })
                }}
                className="pn-glass flex max-h-[calc(100dvh-15rem)] w-[272px] shrink-0 flex-col rounded-[18px]"
              >
                <header className="flex items-baseline justify-between gap-2 border-b border-fg/[0.06] px-3.5 py-2.5">
                  <h2 className="min-w-0 truncate text-[13px] font-medium text-fg" title={c.etapa.nombre}>
                    {c.etapa.nombre}
                  </h2>
                  <span className="shrink-0 text-[11px] tabular-nums text-fg/45">
                    {c.tarjetas.length}
                    {c.suma > 0 && ` · ${dinero(c.suma)}`}
                  </span>
                </header>
                <div className="min-h-[72px] flex-1 overflow-y-auto p-2">
                  <ColumnaTarjetas columna={c} etapas={pipeline.etapas} estado={estado} mover={mover} onArrastrar={setArrastrando} compacta />
                </div>
              </section>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

interface ColumnaProps {
  columna: Columna<TarjetaVista>
  etapas: PipelineVista['etapas']
  estado: EstadoOportunidad
  mover: (t: TarjetaVista, cambio: Cambio) => Promise<void>
  onArrastrar?: (id: string | null) => void
  compacta?: boolean
}

function ColumnaTarjetas({ columna, etapas, estado, mover, onArrastrar, compacta }: ColumnaProps) {
  if (columna.tarjetas.length === 0) {
    return <p className={`text-center text-xs text-fg/35 ${compacta ? 'py-4' : 'pn-glass rounded-[16px] py-8'}`}>Nada en esta etapa</p>
  }
  const lista = (
    <ul className="space-y-2">
      {columna.tarjetas.map((t) => (
        <Tarjeta key={t.id} t={t} etapas={etapas} estado={estado} mover={mover} onArrastrar={onArrastrar} />
      ))}
    </ul>
  )
  // En el teléfono la etapa va sola, en su caja de vidrio (en las columnas, la caja es la columna)
  return compacta ? lista : <div className="pn-glass rounded-[18px] p-2">{lista}</div>
}

function Tarjeta({
  t,
  etapas,
  estado,
  mover,
  onArrastrar,
}: {
  t: TarjetaVista
  etapas: PipelineVista['etapas']
  estado: EstadoOportunidad
  mover: ColumnaProps['mover']
  onArrastrar?: (id: string | null) => void
}) {
  const otroNombre = t.nombre.trim() !== t.contacto.nombre.trim()
  return (
    <li
      draggable={!!onArrastrar}
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'move'
        e.dataTransfer.setData('text/plain', t.id)
        onArrastrar?.(t.id)
      }}
      onDragEnd={() => onArrastrar?.(null)}
      className={`rounded-[14px] bg-fg/[0.05] p-3 ring-1 ring-inset ring-fg/[0.06] ${onArrastrar ? 'cursor-grab active:cursor-grabbing' : ''}`}
    >
      <Link href={`/crm/${t.contacto.id}`} className="block break-words text-sm font-medium text-fg underline-offset-2 hover:underline">
        {otroNombre ? t.nombre : t.contacto.nombre}
      </Link>
      {otroNombre && <p className="mt-0.5 truncate text-xs text-fg/55">{t.contacto.nombre}</p>}
      <div className="mt-2.5 flex items-center justify-between gap-2">
        <span className="text-xs tabular-nums text-fg/65">{t.valor > 0 ? dinero(t.valor) : ''}</span>
        <label className="relative shrink-0">
          <span className="sr-only">{`Mover ${t.nombre}`}</span>
          {/* El ancho fijo: si no, el select toma el de la etapa con el nombre más largo */}
          <select
            value=""
            onChange={(e) => {
              const [tipo, valor] = e.target.value.split(':')
              if (tipo === 'etapa') void mover(t, { etapa_id: valor })
              if (tipo === 'estado') void mover(t, { estado: valor as EstadoOportunidad })
            }}
            className="pn-btn-glass w-[7.5rem] cursor-pointer appearance-none truncate py-1 pl-3 pr-7 text-xs font-medium"
          >
            <option value="" disabled>
              Mover a…
            </option>
            <optgroup label="Etapa">
              {etapas
                .filter((s) => s.id !== t.etapa_id)
                .map((s) => (
                  <option key={s.id} value={`etapa:${s.id}`}>
                    {s.nombre}
                  </option>
                ))}
            </optgroup>
            <optgroup label="Marcar como">
              {ESTADOS_OPORTUNIDAD.filter((e) => e !== estado).map((e) => (
                <option key={e} value={`estado:${e}`}>
                  {e === 'abierta' ? 'Abierta otra vez' : ESTADO_OPORTUNIDAD_LABEL[e]}
                </option>
              ))}
            </optgroup>
          </select>
          <ChevronDown size={12} {...ICONO} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-fg/50" />
        </label>
      </div>
    </li>
  )
}
