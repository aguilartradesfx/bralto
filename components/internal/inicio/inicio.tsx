import Link from 'next/link'
import { ArrowRight, ArrowUpRight, HeartPulse, Inbox, KanbanSquare, MessageSquareReply, MessagesSquare, UserPlus, type LucideIcon } from 'lucide-react'
import { dinero } from '@/lib/crm/tablero'
import { hoyCR, nombreDia, sumarDias } from '@/lib/calendario/fechas'
import { diaCorto } from '@/lib/crm/fechas'
import { PERIODOS, type Periodo } from '@/lib/panel/inicio/calculos'
import type { Inicio, Kpi } from '@/lib/panel/inicio/servidor'
import { TRAZO } from '@/components/internal/shell/iconos'
import { Barrita, Linea, Medidor, Pildora } from './graficas'
import { TablaOportunidades } from './tabla-oportunidades'

const PERIODO_LABEL: Record<Periodo, string> = { 7: '7 días', 30: '30 días', 90: '90 días' }

// El Inicio de los administradores: cuatro números, el camino a la venta, el puntaje de seguimiento y las oportunidades
export function TableroInicio({ datos, nombre, ahora }: { datos: Inicio; nombre: string; ahora: string }) {
  const hoy = hoyCR(new Date(ahora))
  const p = datos.periodo
  const dia = (i: number) => diaCorto(sumarDias(hoy, i - (p - 1)), hoy)
  return (
    <div className="space-y-3 px-4 pb-12 md:px-8">
      <h1 className="sr-only">Inicio</h1>
      <div className="flex flex-wrap items-end justify-between gap-3 pb-2">
        <p className="text-[13.5px] text-fg/50">
          {saludo(new Date(ahora))}
          {nombre ? `, ${nombre.split(' ')[0]}` : ''} · {nombreDia(hoy)}
        </p>
        <nav aria-label="Período" className="pn-tabs">
          {PERIODOS.map((n) => (
            <Link key={n} href={n === 30 ? '/admin' : `/admin?periodo=${n}`} className="pn-tab" aria-current={n === p ? 'page' : undefined} scroll={false}>
              {PERIODO_LABEL[n]}
            </Link>
          ))}
        </nav>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Tarjeta i={0} icono={UserPlus} titulo="Contactos nuevos" kpi={datos.contactos} periodo={p} etiqueta={(i, v) => `${dia(i)}: ${v}`} />
        <Tarjeta i={1} icono={MessagesSquare} titulo="Mensajes recibidos" kpi={datos.recibidos} periodo={p} etiqueta={(i, v) => `${dia(i)}: ${v}`} />
        <Tarjeta i={2} icono={MessageSquareReply} titulo="Mensajes enviados" kpi={datos.enviados} periodo={p} etiqueta={(i, v) => `${dia(i)}: ${v}`} />
        <Esperando i={3} datos={datos.esperando} />
      </div>

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <Embudo datos={datos.embudo} periodo={p} />
        <Seguimiento datos={datos.salud} />
      </div>

      <TablaOportunidades filas={datos.oportunidades} total={datos.embudo.abiertas} ahora={ahora} />
    </div>
  )
}

function saludo(ahora: Date): string {
  const h = Number(new Date(ahora.getTime() - 6 * 3600_000).toISOString().slice(11, 13))
  return h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches'
}

export function Cabeza({ icono: Icono, titulo, sub, accion }: { icono: LucideIcon; titulo: string; sub?: string; accion?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h2 className="flex items-center gap-2 text-[14px] font-medium text-fg">
          <Icono size={14} {...TRAZO} className="shrink-0 text-fg/45" />
          {titulo}
        </h2>
        {sub && <p className="mt-1 text-[12.5px] text-fg/45">{sub}</p>}
      </div>
      {accion}
    </div>
  )
}

function Cambio({ kpi, periodo }: { kpi: Kpi; periodo: Periodo }) {
  if (kpi.cambio === null) {
    return <p className="mt-1.5 text-[12px] text-fg/45">{kpi.actual > 0 ? `${kpi.anterior} en los ${periodo} días anteriores` : `Nada en los ${periodo} días anteriores`}</p>
  }
  const sube = kpi.cambio >= 0
  return (
    <p className="mt-1.5 text-[12px] text-fg/45">
      <span className="tabular-nums" style={{ color: kpi.cambio === 0 ? undefined : sube ? 'var(--pn-good)' : 'var(--pn-bad)' }}>
        {sube ? '+' : '−'}
        {Math.abs(kpi.cambio).toLocaleString('es-CR')} %
      </span>{' '}
      vs los {periodo} días anteriores
    </p>
  )
}

function Tarjeta({ i, icono, titulo, kpi, periodo, etiqueta }: { i: number; icono: LucideIcon; titulo: string; kpi: Kpi; periodo: Periodo; etiqueta: (i: number, v: number) => string }) {
  return (
    <section className="pn-glass pn-rise flex flex-col rounded-[14px] p-4" style={{ '--i': i } as React.CSSProperties}>
      <Cabeza icono={icono} titulo={titulo} accion={<span className="pn-count !text-[11px] !px-1.5 text-fg/50">{PERIODO_LABEL[periodo]}</span>} />
      <div className="mt-5 flex items-end justify-between gap-3">
        <div>
          <p className="text-[28px] font-normal leading-none tracking-tight text-fg tabular-nums">{kpi.actual.toLocaleString('es-CR')}</p>
          <Cambio kpi={kpi} periodo={periodo} />
        </div>
        <Linea serie={kpi.serie} etiqueta={etiqueta} className="shrink-0" />
      </div>
    </section>
  )
}

function Esperando({ i, datos }: { i: number; datos: Inicio['esperando'] }) {
  const total = datos?.total ?? 0
  return (
    <section className="pn-glass pn-rise relative flex flex-col overflow-hidden rounded-[14px] p-4" style={{ '--i': i } as React.CSSProperties}>
      {total > 0 && <div aria-hidden className="pointer-events-none absolute -right-10 -top-14 h-36 w-36 rounded-full" style={{ background: 'radial-gradient(closest-side, var(--pn-accent-glow), transparent)' }} />}
      <Cabeza
        icono={Inbox}
        titulo="Te están esperando"
        accion={
          <Link href="/crm/mensajes" className="pn-icon-btn !h-7 !w-7" aria-label="Abrir los mensajes">
            <ArrowUpRight size={13} {...TRAZO} />
          </Link>
        }
      />
      <div className="relative mt-5 flex items-end justify-between gap-3">
        <div>
          <p className="text-[28px] font-normal leading-none tracking-tight tabular-nums" style={{ color: total ? 'var(--pn-accent-ink)' : undefined }}>
            {datos ? total : '—'}
          </p>
          <p className="mt-1.5 text-[12px] text-fg/45">
            {datos === null ? 'No se pudo leer la bandeja' : total ? 'por contestar' : 'Nadie te está esperando'}
            {datos && datos.clientes > 0 ? <span className="text-fg/60"> · {datos.clientes === 1 ? '1 es cliente posible' : `${datos.clientes} son clientes posibles`}</span> : null}
          </p>
        </div>
        {!!datos?.conversaciones.length && (
          <div className="flex -space-x-2">
            {datos.conversaciones.slice(0, 4).map((c) => (
              <Link key={c.id} href={`/crm/mensajes/${c.id}`} title={c.nombre} className="grid h-8 w-8 place-items-center rounded-full bg-[var(--pn-raise-2)] text-[10.5px] font-medium text-fg/80 ring-2 ring-[var(--pn-card)] transition-transform hover:-translate-y-0.5">
                {c.iniciales}
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

function Embudo({ datos, periodo }: { datos: Inicio['embudo']; periodo: Periodo }) {
  const max = Math.max(1, ...datos.etapas.map((e) => e.cuantas))
  return (
    <section className="pn-glass pn-rise rounded-[14px] p-5" style={{ '--i': 4 } as React.CSSProperties}>
      <Cabeza
        icono={KanbanSquare}
        titulo="Camino a la venta"
        sub="Las oportunidades abiertas, por etapa del pipeline."
        accion={
          <Link href="/crm/pipeline" className="pn-icon-btn !h-7 !w-7" aria-label="Abrir el pipeline" title="Abrir el pipeline">
            <ArrowUpRight size={13} {...TRAZO} />
          </Link>
        }
      />
      <div className="mt-5 grid grid-cols-3 divide-x divide-fg/[0.07]">
        <Cifra valor={dinero(datos.valor)} label="Valor abierto" />
        <Cifra valor={datos.abiertas.toLocaleString('es-CR')} label="Oportunidades abiertas" />
        <Cifra valor={datos.ganadas.toLocaleString('es-CR')} label={`Ganadas en ${periodo} días`} extra={datos.ganadoValor ? dinero(datos.ganadoValor) : undefined} />
      </div>
      {datos.etapas.length === 0 ? (
        <p className="mt-8 text-center text-sm text-fg/45">Todavía no hay oportunidades abiertas.</p>
      ) : (
        <>
          <ul className="mt-6 space-y-2.5">
            {datos.etapas.map((e) => (
              <li key={e.id} className="grid grid-cols-[minmax(0,180px)_minmax(0,1fr)] items-center gap-4" title={`${e.nombre}: ${e.cuantas} ${e.cuantas === 1 ? 'oportunidad' : 'oportunidades'}${e.valor ? ` · ${dinero(e.valor)}` : ''}`}>
                <div className="min-w-0">
                  <p className="flex items-center gap-2 truncate text-[13px] text-fg/85">
                    <span className={`pn-pill !p-0 !shadow-none !bg-transparent`}>
                      <i className={e.tono} aria-hidden />
                    </span>
                    {e.nombre}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="relative h-[10px] flex-1">
                    <span className="absolute inset-y-0 left-0 rounded-[4px] bg-fg/55" style={{ width: `max(4px, ${(e.cuantas / max) * 100}%)` }} />
                  </span>
                  <span className="w-[92px] shrink-0 text-[12px] tabular-nums text-fg/55">
                    {e.cuantas}
                    {e.valor ? <span className="text-fg/35"> · {dinero(e.valor)}</span> : null}
                  </span>
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-[11px] text-fg/35">Cada barra es cuántas oportunidades hay en esa etapa; al lado, cuántas son y su valor.</p>
        </>
      )}
    </section>
  )
}

function Cifra({ valor, label, extra }: { valor: string; label: string; extra?: string }) {
  return (
    <div className="px-4 first:pl-0 last:pr-0">
      <p className="truncate text-[22px] font-normal leading-tight tracking-tight text-fg tabular-nums">{valor}</p>
      <p className="mt-1 truncate text-[12px] text-fg/45">
        {label}
        {extra ? ` · ${extra}` : ''}
      </p>
    </div>
  )
}

function Seguimiento({ datos }: { datos: Inicio['salud'] }) {
  return (
    <section className="pn-glass pn-rise rounded-[14px] p-5" style={{ '--i': 5 } as React.CSSProperties}>
      <Cabeza icono={HeartPulse} titulo="Salud del seguimiento" sub="Qué tan bien le das seguimiento a quien te escribe." />
      <div className="mt-4 grid items-center gap-5 sm:grid-cols-[172px_minmax(0,1fr)]">
        <Medidor valor={datos.puntaje} />
        <ul className="space-y-2.5">
          {datos.partes.map((p) => (
            <li key={p.id} className="grid grid-cols-[minmax(0,1fr)_88px_28px] items-center gap-3" title={p.detalle}>
              <p className="truncate text-[12.5px] text-fg/80">
                {p.nombre} <span className="text-fg/35 tabular-nums">{p.pesoReal ? `${p.pesoReal} %` : 'sin datos'}</span>
              </p>
              <Barrita valor={p.valor ?? 0} className={p.valor === null ? 'opacity-40' : ''} />
              <span className="text-right text-[12px] tabular-nums text-fg/60">{p.valor ?? '—'}</span>
            </li>
          ))}
        </ul>
      </div>
      {datos.mejoras.length > 0 && (
        <div className="mt-5 border-t border-fg/[0.07] pt-4">
          <p className="text-[12px] font-medium text-fg/50">Para subir el puntaje</p>
          <ul className="mt-2.5 space-y-1">
            {datos.mejoras.map((m) => (
              <li key={m.id}>
                <Link href={m.href} className="group -mx-2 flex items-start gap-3 rounded-[10px] px-2 py-2 transition-colors hover:bg-fg/[0.035]">
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] text-fg">{m.titulo}</p>
                    <p className="mt-0.5 text-[12px] text-fg/45">{m.texto}</p>
                  </div>
                  <span className="pn-count pn-count--accent mt-0.5 shrink-0 !px-1.5">+{m.sube}</span>
                  <ArrowRight size={13} {...TRAZO} className="mt-1 shrink-0 text-fg/30 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
