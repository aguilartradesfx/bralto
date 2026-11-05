'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowUpRight, ChevronDown, EllipsisVertical, Search } from 'lucide-react'
import { dinero } from '@/lib/crm/tablero'
import { haceCuanto } from '@/lib/crm/fechas'
import type { Tono } from '@/lib/panel/inicio/calculos'
import type { FilaOportunidad } from '@/lib/panel/inicio/servidor'
import { TRAZO } from '@/components/internal/shell/iconos'
import { Pildora } from './graficas'

const GRUPOS: { tono: Tono | 'todas'; label: string }[] = [
  { tono: 'todas', label: 'Todas' },
  { tono: 'gris', label: 'Nuevas' },
  { tono: 'ambar', label: 'Seguimiento' },
  { tono: 'azul', label: 'Con cita' },
  { tono: 'morado', label: 'Interesados' },
  { tono: 'verde', label: 'Ganando' },
  { tono: 'rojo', label: 'En riesgo' },
]

const plano = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
const POR_VEZ = 8

// Las oportunidades abiertas: por grupo de etapa, con buscador y orden
export function TablaOportunidades({ filas, total, ahora }: { filas: FilaOportunidad[]; total: number; ahora: string }) {
  const [grupo, setGrupo] = useState<Tono | 'todas'>('todas')
  const [q, setQ] = useState('')
  const [orden, setOrden] = useState<'reciente' | 'valor'>('reciente')
  const [cuantas, setCuantas] = useState(POR_VEZ)
  const hoy = new Date(ahora)

  const cuenta = useMemo(() => {
    const c = new Map<string, number>([['todas', filas.length]])
    for (const f of filas) c.set(f.tono, (c.get(f.tono) ?? 0) + 1)
    return c
  }, [filas])

  const visibles = useMemo(() => {
    const t = plano(q.trim())
    const lista = filas.filter((f) => (grupo === 'todas' || f.tono === grupo) && (!t || plano(`${f.contacto?.nombre ?? ''} ${f.nombre} ${f.etapa}`).includes(t)))
    return orden === 'valor' ? [...lista].sort((a, b) => b.valor - a.valor) : lista
  }, [filas, grupo, q, orden])

  return (
    <section className="pn-glass pn-rise rounded-[14px] pt-5" style={{ '--i': 6 } as React.CSSProperties}>
      <div className="px-5">
        <h2 className="text-[15px] font-medium text-fg">Oportunidades abiertas</h2>
        <p className="mt-1 text-[12.5px] text-fg/45">
          Las {total.toLocaleString('es-CR')} del pipeline, de la que se movió más reciente a la más vieja{filas.length < total ? ` (se ven las ${filas.length} más recientes)` : ''}.
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="pn-tabs max-w-full overflow-x-auto [scrollbar-width:none]" role="tablist" aria-label="Grupos de etapas">
            {GRUPOS.filter((g) => (cuenta.get(g.tono) ?? 0) > 0).map((g) => (
              <button
                key={g.tono}
                type="button"
                role="tab"
                aria-selected={grupo === g.tono}
                onClick={() => {
                  setGrupo(g.tono)
                  setCuantas(POR_VEZ)
                }}
                className="pn-tab"
              >
                {g.label}
                <span className="ml-1.5 tabular-nums text-fg/35">{cuenta.get(g.tono)}</span>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <label className="pn-solid flex h-8 items-center gap-2 rounded-[9px] px-2.5">
              <span className="sr-only">Buscar</span>
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Busca por nombre" className="w-36 bg-transparent text-[13px] text-fg placeholder:text-fg/35 focus:!shadow-none sm:w-44" />
              <Search size={14} {...TRAZO} className="text-fg/40" />
            </label>
            <label className="pn-solid relative flex h-8 items-center rounded-[9px] pl-2.5 pr-7 text-[13px] text-fg/50">
              <span className="sr-only">Ordenar</span>
              <select value={orden} onChange={(e) => setOrden(e.target.value as typeof orden)} className="appearance-none bg-transparent text-fg/80 focus:!shadow-none">
                <option value="reciente">Más recientes</option>
                <option value="valor">Mayor valor</option>
              </select>
              <ChevronDown size={13} {...TRAZO} className="pointer-events-none absolute right-2 text-fg/40" />
            </label>
          </div>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-[13px]">
          <thead>
            <tr className="border-b border-fg/[0.07] text-[12px] text-fg/40">
              <th className="py-2.5 pl-5 pr-3 font-normal">Contacto</th>
              <th className="px-3 py-2.5 font-normal">Oportunidad</th>
              <th className="px-3 py-2.5 font-normal">Etapa</th>
              <th className="px-3 py-2.5 text-right font-normal">Valor</th>
              <th className="px-3 py-2.5 font-normal">Se movió</th>
              <th className="w-12 py-2.5 pr-4" aria-label="Abrir" />
            </tr>
          </thead>
          <tbody>
            {visibles.slice(0, cuantas).map((f) => (
              <tr key={f.id} className="pn-row border-b border-fg/[0.05] last:border-0">
                <td className="max-w-[220px] py-3 pl-5 pr-3">
                  {f.contacto ? (
                    <Link href={`/crm?c=${f.contacto.id}`} className="truncate text-fg underline decoration-fg/25 underline-offset-[3px] transition-colors hover:decoration-[var(--pn-accent)]">
                      {f.contacto.nombre}
                    </Link>
                  ) : (
                    <span className="text-fg/45">Sin contacto</span>
                  )}
                </td>
                <td className="max-w-[240px] truncate px-3 py-3 text-fg/60">{f.nombre && f.nombre !== f.contacto?.nombre ? f.nombre : <span className="text-fg/30">—</span>}</td>
                <td className="px-3 py-3">
                  <Pildora tono={f.tono}>{f.etapa}</Pildora>
                </td>
                <td className="px-3 py-3 text-right tabular-nums text-fg/80">{f.valor ? dinero(f.valor) : <span className="text-fg/30">—</span>}</td>
                <td className="px-3 py-3 text-fg/50">{f.movida ? haceCuanto(f.movida, hoy) : '—'}</td>
                <td className="py-3 pr-4 text-right">
                  {f.contacto && (
                    <Link href={`/crm/${f.contacto.id}`} className="inline-grid h-7 w-7 place-items-center rounded-md text-fg/40 transition-colors hover:bg-fg/[0.06] hover:text-fg" aria-label={`Abrir la ficha de ${f.contacto.nombre}`} title="Abrir la ficha">
                      <EllipsisVertical size={15} {...TRAZO} />
                    </Link>
                  )}
                </td>
              </tr>
            ))}
            {visibles.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-sm text-fg/45">
                  {q ? `Nadie con «${q}».` : 'Nada en este grupo.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-fg/[0.06] px-5 py-3 text-[12.5px]">
        <span className="text-fg/40 tabular-nums">
          {Math.min(cuantas, visibles.length)} de {visibles.length}
        </span>
        <div className="flex items-center gap-2">
          {cuantas < visibles.length && (
            <button type="button" onClick={() => setCuantas((n) => n + POR_VEZ * 2)} className="pn-btn-glass px-3 py-1.5 text-[12.5px]">
              Ver más
            </button>
          )}
          <Link href="/crm/pipeline" className="inline-flex items-center gap-1 px-2 py-1.5 text-fg/60 transition-colors hover:text-fg">
            Abrir el pipeline
            <ArrowUpRight size={13} {...TRAZO} />
          </Link>
        </div>
      </div>
    </section>
  )
}
