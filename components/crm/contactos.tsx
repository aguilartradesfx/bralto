import Link from 'next/link'
import { ArrowUpRight, CalendarDays, ChevronLeft, ChevronRight, Inbox, ListTodo, Mail, MessageSquare, Phone, UserPlus, UsersRound, type LucideIcon } from 'lucide-react'
import { enlaceLista, totalPaginas } from '@/lib/crm/busqueda'
import { haceCuanto } from '@/lib/crm/fechas'
import type { ContactoLista, Ficha } from '@/lib/crm/vista'
import type { Actividad, Borrador, Resumen } from '@/lib/panel/contactos'
import { Buscador } from '@/components/crm/buscador'
import { Avatar, CanalIcono, Etiqueta, ICONO, Vacio } from '@/components/crm/piezas'
import { Pildora } from '@/components/internal/inicio/graficas'
import { PanelContacto } from '@/components/crm/panel-contacto'
import { ProximosPasos } from '@/components/crm/proximos-pasos'

interface Props {
  filas: ContactoLista[]
  total: number
  pagina: number
  q: string
  etiqueta: string
  etiquetas: { etiqueta: string; total: number }[]
  actividad: Record<string, Actividad>
  resumen: Resumen
  abierto: { ficha: Ficha; borrador: Borrador | null } | null
  ahora: string
}

// Contactos: los números de arriba, la tabla (los de actividad más reciente arriba, de a 30) y, al tocar a alguien,
// su historial a la derecha y lo que sigue con esa persona abajo
export function Contactos({ filas, total, pagina, q, etiqueta, etiquetas, actividad, resumen, abierto, ahora }: Props) {
  const paginas = totalPaginas(total)
  const filtrando = !!(q.trim() || etiqueta)
  const hoy = new Date(ahora)
  const c = abierto?.ficha.contacto.id
  const enlace = (extra: { pagina?: number; c?: string }) => enlaceLista({ q, etiqueta, pagina, ...extra })

  return (
    <div className={`px-4 pb-12 md:px-8 ${abierto ? 'lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(380px,0.8fr)] lg:items-start lg:gap-3 2xl:grid-cols-[minmax(0,1fr)_540px]' : ''}`}>
      <h1 className="sr-only">Contactos</h1>
      <div className="min-w-0 space-y-3">
        <div className={`grid grid-cols-2 gap-3 ${abierto ? 'sm:grid-cols-3' : 'xl:grid-cols-4'}`}>
          <Numero i={0} icono={UsersRound} titulo="Contactos" valor={total} sub={filtrando ? 'con esa búsqueda' : 'en tu CRM'} />
          <Numero i={1} icono={Inbox} titulo={abierto ? 'Esperando' : 'Te están esperando'} valor={resumen.esperando} sub="por contestar" acento={!!resumen.esperando} href="/crm/mensajes" />
          <Numero i={2} icono={ListTodo} titulo={abierto ? 'Tareas' : 'Tareas pendientes'} valor={resumen.tareas} sub={resumen.vencidas ? `${resumen.vencidas} vencidas` : 'al día'} alerta={resumen.vencidas > 0} href="/crm/tareas" />
          {!abierto && <Numero i={3} icono={ArrowUpRight} titulo="Oportunidades abiertas" valor={resumen.oportunidades} sub="en el pipeline" href="/crm/pipeline" />}
        </div>

        <section className="pn-glass pn-rise rounded-[14px]" style={{ '--i': 4 } as React.CSSProperties}>
          <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
            <Buscador q={q} etiqueta={etiqueta} etiquetas={etiquetas} className="min-w-0 flex-1" />
            <Link href="/crm/nuevo" className="pn-btn-solid inline-flex h-9 shrink-0 items-center justify-center gap-1.5 px-3.5 text-[13px] font-medium">
              <UserPlus size={14} {...ICONO} />
              Nuevo contacto
            </Link>
          </div>

          {filas.length === 0 ? (
            <div className="px-4 pb-4">
              <Vacio>
                {filtrando ? (
                  <>
                    No encontramos a nadie con eso.{' '}
                    <Link href="/crm" className="text-fg underline underline-offset-2">
                      Ver todos
                    </Link>
                  </>
                ) : (
                  'Todavía no hay contactos.'
                )}
              </Vacio>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className={`w-full text-left text-[13px] ${abierto ? 'min-w-[520px]' : 'min-w-[640px]'}`}>
                <thead>
                  <tr className="whitespace-nowrap border-y border-fg/[0.07] text-[12px] text-fg/40">
                    <th className="py-2.5 pl-4 pr-3 font-normal">Contacto</th>
                    <th className="px-3 py-2.5 font-normal">Etapa</th>
                    <th className="px-3 py-2.5 font-normal" title="Mensajes, llamadas, correos y citas de los últimos 90 días">
                      Actividad {!abierto && <span className="text-fg/25">· 90 días</span>}
                    </th>
                    <th className="px-3 py-2.5 font-normal">Último contacto</th>
                    {!abierto && <th className="px-3 py-2.5 font-normal">Etiquetas</th>}
                    <th className="w-10 py-2.5 pr-3" aria-label="Abrir" />
                  </tr>
                </thead>
                <tbody>
                  {filas.map((f) => (
                    <Fila key={f.id} f={f} a={actividad[f.id]} on={f.id === c} href={enlace({ c: f.id })} ahora={hoy} ancho={!abierto} />
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <nav aria-label="Páginas" className="flex items-center justify-between gap-3 border-t border-fg/[0.06] px-4 py-3 text-[12.5px]">
            <span className="tabular-nums text-fg/40">
              {filas.length ? `${(pagina - 1) * 30 + 1}–${(pagina - 1) * 30 + filas.length}` : 0} de {total.toLocaleString('es-CR')}
            </span>
            <div className="flex items-center gap-2">
              {pagina > 1 && (
                <Link href={enlace({ pagina: pagina - 1, c })} className="pn-btn-glass inline-flex items-center gap-1 px-3 py-1.5">
                  <ChevronLeft size={14} {...ICONO} />
                  Anterior
                </Link>
              )}
              {paginas > 1 && (
                <span className="tabular-nums text-fg/40">
                  Página {pagina} de {paginas}
                </span>
              )}
              {pagina < paginas && (
                <Link href={enlace({ pagina: pagina + 1, c })} className="pn-btn-glass inline-flex items-center gap-1 px-3 py-1.5">
                  Siguiente
                  <ChevronRight size={14} {...ICONO} />
                </Link>
              )}
            </div>
          </nav>
        </section>

      </div>

      {abierto && (
        <PanelContacto ficha={abierto.ficha} etapa={actividad[abierto.ficha.contacto.id]?.etapa ?? null} cerrar={enlace({})} ahora={ahora}>
          <ProximosPasos ficha={abierto.ficha} borrador={abierto.borrador} ahora={ahora} />
        </PanelContacto>
      )}
    </div>
  )
}

function Numero({ i, icono: Icono, titulo, valor, sub, acento = false, alerta = false, href }: { i: number; icono: LucideIcon; titulo: string; valor: number | null; sub: string; acento?: boolean; alerta?: boolean; href?: string }) {
  return (
    <section className="pn-glass pn-rise rounded-[14px] p-4" style={{ '--i': i } as React.CSSProperties}>
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-[13.5px] font-medium text-fg">
          <Icono size={14} {...ICONO} className="text-fg/45" />
          {titulo}
        </h2>
        {href && (
          <Link href={href} className="pn-icon-btn !h-7 !w-7" aria-label={`Abrir ${titulo.toLowerCase()}`}>
            <ArrowUpRight size={13} {...ICONO} />
          </Link>
        )}
      </div>
      <div className="mt-4 flex items-end justify-between gap-3">
        <p className="text-[26px] font-normal leading-none tracking-tight tabular-nums" style={{ color: acento ? 'var(--pn-accent-ink)' : undefined }}>
          {valor === null ? '—' : valor.toLocaleString('es-CR')}
        </p>
        <p className="text-[12px]" style={{ color: alerta ? 'var(--pn-bad)' : undefined }}>
          <span className={alerta ? '' : 'text-fg/45'}>{sub}</span>
        </p>
      </div>
    </section>
  )
}

function Fila({ f, a, on, href, ahora, ancho }: { f: ContactoLista; a: Actividad | undefined; on: boolean; href: string; ahora: Date; ancho: boolean }) {
  const chips: [LucideIcon, number, string][] = a
    ? ([
        [MessageSquare, a.mensajes, 'mensajes'],
        [Phone, a.llamadas, 'llamadas'],
        [Mail, a.correos, 'correos'],
        [CalendarDays, a.citas, 'citas'],
      ] as [LucideIcon, number, string][]).filter(([, n]) => n > 0)
    : []
  const sub = f.empresa ?? f.telefono ?? f.correo
  return (
    <tr className="pn-row group relative border-b border-fg/[0.05] last:border-0" data-on={on || undefined}>
      <td className="max-w-[260px] py-2.5 pl-4 pr-3">
        {/* Toda la fila abre el contacto (el enlace se estira sobre la fila) */}
        <Link href={href} scroll={false} aria-current={on || undefined} className="flex min-w-0 items-center gap-3 after:absolute after:inset-0 after:content-['']">
          <Avatar nombre={f.nombre} />
          <span className="min-w-0">
            <span className="block truncate text-fg">{f.nombre}</span>
            {sub && <span className="block truncate text-[12px] text-fg/45">{sub}</span>}
          </span>
        </Link>
      </td>
      <td className="px-3 py-2.5">{a?.etapa ? <Pildora tono={a.etapa.tono}>{a.etapa.nombre}</Pildora> : <span className="text-fg/30">—</span>}</td>
      <td className="px-3 py-2.5">
        {chips.length ? (
          <span className="flex items-center gap-1.5">
            {chips.map(([Icono, n, que]) => (
              <span key={que} className="pn-pill !gap-1 !px-1.5 tabular-nums text-fg/70" title={`${n} ${que}`}>
                <Icono size={12} {...ICONO} />
                {n}
              </span>
            ))}
            {f.canal && <CanalIcono canal={f.canal} size={13} className="ml-0.5 text-fg/35" />}
          </span>
        ) : (
          <span className="text-fg/30">—</span>
        )}
      </td>
      <td className="whitespace-nowrap px-3 py-2.5 text-fg/60">{haceCuanto(f.ultima_actividad, ahora)}</td>
      {ancho && (
        <td className="px-3 py-2.5">
          <span className="flex flex-wrap gap-1">
            {f.etiquetas.slice(0, 2).map((e) => (
              <Etiqueta key={e}>{e}</Etiqueta>
            ))}
            {f.etiquetas.length > 2 && <span className="text-[11px] text-fg/40">+{f.etiquetas.length - 2}</span>}
          </span>
        </td>
      )}
      <td className="py-2.5 pr-3 text-right">
        <ChevronRight size={15} {...ICONO} className={`inline transition-colors ${on ? 'text-[var(--pn-accent-ink)]' : 'text-fg/25 group-hover:text-fg/60'}`} />
      </td>
    </tr>
  )
}
