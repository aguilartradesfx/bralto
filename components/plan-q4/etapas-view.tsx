import Link from 'next/link'
import { decisionesDelMes, etapaActual, progresoEtapa, semanaContiene } from '@/lib/plan-q4/etapas'
import { contextoHtml, inlineHtml } from '@/lib/plan-q4/markdown'
import { compareTasks, type PersonaFilter } from '@/lib/plan-q4/rules'
import { PERSONAS, PERSONA_NAMES, type Etapa, type GuiaData, type Persona, type PlanTask, type PuntoDecision } from '@/lib/plan-q4/types'
import { viewHref } from '@/lib/plan-q4/vistas'
import { Markdown } from '@/components/plan-q4/markdown'
import { TaskList, type TaskListProps } from '@/components/plan-q4/task-list'
import { sentence } from '@/components/plan-q4/inicio'

type ListContext = Pick<TaskListProps, 'today' | 'week' | 'doneIds' | 'canEdit' | 'areas'>

const heading = 'text-xs font-medium uppercase tracking-wide text-white/40'

function Decision({ d }: { d: PuntoDecision }) {
  return (
    <li className="pn-solid rounded-[14px] p-3.5">
      <p className="font-mono text-[11px] uppercase tracking-wide text-white/45">{d.cuando}</p>
      <p className="mt-1 text-sm text-white" dangerouslySetInnerHTML={{ __html: inlineHtml(d.pregunta) }} />
      {d.accion && <p className="mt-1 text-sm text-white/60" dangerouslySetInnerHTML={{ __html: inlineHtml(d.accion) }} />}
    </li>
  )
}

interface Props {
  etapas: Etapa[]
  decisiones: PuntoDecision[]
  guia: GuiaData | null
  tasks: PlanTask[]
  mes: number | null // la elegida en la URL
  persona: PersonaFilter
  actor: Persona | null
  list: ListContext
}

export function EtapasView({ etapas, decisiones, guia, tasks, mes, persona, actor, list }: Props) {
  const actual = etapaActual(etapas, list.today)
  const etapa = etapas.find((e) => e.mes === mes) ?? actual
  if (!etapa) return <p className="text-sm text-white/50">El plan no tiene calendario por etapas.</p>

  const { hechas, total } = progresoEtapa(tasks, etapa.mes)
  const pct = total ? Math.round((hechas / total) * 100) : 0
  const { delMes, sinFecha } = decisionesDelMes(decisiones, etapa.mes)
  const delaEtapa = tasks.filter((t) => Number(t.fecha.slice(5, 7)) === etapa.mes).sort(compareTasks)
  const resumen = guia?.etapas[etapa.nombreMes.toLowerCase()]

  return (
    <div className="space-y-6">
      <nav aria-label="Etapas" className="flex flex-wrap gap-1 p-1 w-fit bg-white/[0.03] border border-white/[0.07] rounded-[14px]">
        {etapas.map((e) => {
          const on = e.mes === etapa.mes
          return (
            <Link
              key={e.mes}
              href={viewHref({ vista: 'etapas', etapa: e.mes }, persona)}
              aria-current={on ? 'true' : undefined}
              className={`inline-flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-[10px] transition-colors ${
                on ? 'pn-chip-on text-white' : 'text-white/50 hover:text-white/80'
              }`}
            >
              {e.nombreMes}
              {actual?.mes === e.mes && <span className="pn-signal" aria-label="estamos acá" />}
            </Link>
          )
        })}
      </nav>

      <section className="pn-glass rounded-[20px] p-5">
        <p className="font-mono text-[11px] uppercase tracking-widest text-white/45">
          {etapa.nombreMes}
          {actual?.mes === etapa.mes && ' · estamos acá'}
        </p>
        <h2 className="mt-1 text-lg font-semibold text-white">{sentence(etapa.titulo)}</h2>
        {resumen && <Markdown html={contextoHtml(resumen)} className="mt-3" />}
        <div className="mt-4 flex items-center justify-between text-xs text-white/50">
          <span>Tareas hechas de la etapa</span>
          <span className="tabular-nums">
            {hechas}/{total}
          </span>
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/[0.06]" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Avance de la etapa">
          <div className="h-full rounded-full bg-white/80" style={{ width: `${pct}%` }} />
        </div>
      </section>

      {etapa.semanas.length > 0 && (
        <section>
          <h2 className={`${heading} mb-3`}>Semana por semana</h2>
          <ol className="space-y-2">
            {etapa.semanas.map((s) => {
              const now = semanaContiene(s.semana, list.today)
              return (
                <li key={s.semana} className={`rounded-[14px] p-3.5 ${now ? 'pn-chip-on' : 'pn-solid'}`}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-wide text-white/55">
                      {s.semana}
                      {now && (
                        <>
                          <span className="pn-signal" aria-hidden />
                          <span className="text-white">esta semana</span>
                        </>
                      )}
                    </span>
                    {s.hito && (
                      <span
                        className="rounded-full border border-white/15 bg-white/[0.06] px-2 py-0.5 text-[11px] text-white"
                        dangerouslySetInnerHTML={{ __html: inlineHtml(`Hito: ${s.hito}`) }}
                      />
                    )}
                  </div>
                  <p className="mt-1.5 text-sm leading-relaxed text-white/75" dangerouslySetInnerHTML={{ __html: inlineHtml(s.foco) }} />
                </li>
              )
            })}
          </ol>
        </section>
      )}

      {delMes.length > 0 && (
        <section>
          <h2 className={`${heading} mb-3`}>Decisiones de esta etapa</h2>
          <ul className="grid gap-2 sm:grid-cols-2">
            {delMes.map((d) => (
              <Decision key={d.cuando + d.pregunta} d={d} />
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className={`${heading} mb-3`}>Tareas de la etapa</h2>
        <div className="space-y-3">
          {PERSONAS.map((p) => {
            const suyas = delaEtapa.filter((t) => t.responsable === p)
            if (suyas.length === 0) return null
            const pendientes = suyas.filter((t) => t.tipo === 'semanal' || t.estado !== 'hecho').length
            return (
              <details key={p} open={p === actor} className="group">
                <summary className="flex w-fit cursor-pointer list-none items-center gap-2 text-sm font-medium text-white hover:text-white/80 [&::-webkit-details-marker]:hidden">
                  <span className="text-white/45 transition-transform group-open:rotate-90" aria-hidden>›</span>
                  {PERSONA_NAMES[p]}
                  <span className="text-xs font-normal text-white/45">
                    {pendientes} {pendientes === 1 ? 'pendiente' : 'pendientes'} · {suyas.length} en total
                  </span>
                </summary>
                <div className="mt-2">
                  <TaskList tasks={suyas} {...list} />
                </div>
              </details>
            )
          })}
        </div>
      </section>

      {sinFecha.length > 0 && (
        <details className="group">
          <summary className="flex w-fit cursor-pointer list-none items-center gap-2 text-xs font-medium uppercase tracking-wide text-white/45 hover:text-white/70 [&::-webkit-details-marker]:hidden">
            <span className="transition-transform group-open:rotate-90" aria-hidden>›</span>
            Decisiones sin fecha fija · {sinFecha.length}
          </summary>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {sinFecha.map((d) => (
              <Decision key={d.cuando + d.pregunta} d={d} />
            ))}
          </ul>
        </details>
      )}
    </div>
  )
}
