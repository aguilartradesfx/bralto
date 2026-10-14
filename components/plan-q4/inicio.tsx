import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { etapaActual, progresoEtapa } from '@/lib/plan-q4/etapas'
import { diasTexto, formatFecha } from '@/lib/plan-q4/fechas'
import { contextoHtml } from '@/lib/plan-q4/markdown'
import { nextMilestone, type PersonaFilter } from '@/lib/plan-q4/rules'
import { PERSONA_NAMES, type Etapa, type GuiaData, type Persona, type PlanTask, type ResumenData } from '@/lib/plan-q4/types'
import { viewHref, type ResumenPersona } from '@/lib/plan-q4/vistas'
import { Markdown } from '@/components/plan-q4/markdown'

const h2 = 'text-xl font-semibold text-fg tracking-tight'
export const sentence = (text: string) => text.charAt(0).toUpperCase() + text.slice(1)

interface Props {
  guia: GuiaData | null
  resumen: ResumenData
  etapas: Etapa[]
  tasks: PlanTask[]
  today: string
  actor: Persona | null
  persona: PersonaFilter
  miSemana: ResumenPersona | null // la persona que entró
}

export function Inicio({ guia, resumen, etapas, tasks, today, actor, persona, miSemana }: Props) {
  const actual = etapaActual(etapas, today)
  const proximo = nextMilestone(resumen.hitos, today)

  return (
    <div className="space-y-12 max-w-3xl">
      {guia?.queEs && (
        <section>
          <h2 className={h2}>Qué es esto</h2>
          <Markdown html={contextoHtml(guia.queEs)} className="plan-md--lead mt-3" />
        </section>
      )}

      {actor && miSemana && (
        <section className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-y border-fg/[0.06] py-4">
          <p className="text-[15px] text-fg/80">
            <span className="font-medium text-fg">{PERSONA_NAMES[actor]}</span>
            {', '}
            {miSemana.semana === 0 && miSemana.vencidas === 0
              ? 'no tenés nada pendiente esta semana.'
              : `esta semana tenés ${miSemana.semana} ${miSemana.semana === 1 ? 'tarea' : 'tareas'}`}
            {miSemana.vencidas > 0 && (
              <span className="text-red-300">
                {' '}
                y {miSemana.vencidas} {miSemana.vencidas === 1 ? 'vencida' : 'vencidas'}
              </span>
            )}
            {(miSemana.semana > 0 || miSemana.vencidas > 0) && '.'}
          </p>
          <Link href={viewHref({ vista: 'tareas' }, actor)} className="inline-flex items-center gap-1.5 text-sm font-medium text-fg hover:text-fg/70 transition-colors">
            Ver mis tareas
            <ArrowRight size={14} strokeWidth={1.5} absoluteStrokeWidth aria-hidden />
          </Link>
        </section>
      )}

      {guia?.queVamos && (
        <section>
          <h2 className={h2}>Qué vamos a hacer</h2>
          <Markdown html={contextoHtml(guia.queVamos)} className="plan-md--lead mt-3" />
        </section>
      )}

      {etapas.length > 0 && (
        <section>
          <h2 className={h2}>Las etapas</h2>
          <p className="mt-1 text-sm text-fg/45">Un mes cada una. Tocá una para ver su semana a semana.</p>
          <ol className="mt-5 grid gap-6 sm:grid-cols-3">
            {etapas.map((etapa) => {
              const now = actual?.mes === etapa.mes
              const { hechas, total } = progresoEtapa(tasks, etapa.mes)
              const pct = total ? Math.round((hechas / total) * 100) : 0
              return (
                <li key={etapa.mes}>
                  <Link href={viewHref({ vista: 'etapas', etapa: etapa.mes }, persona)} className="group block">
                    <span className="block h-px overflow-hidden bg-fg/[0.12]" aria-hidden>
                      <span className="block h-full bg-fg" style={{ width: `${pct}%` }} />
                    </span>
                    <span className="mt-3 flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-fg/45">
                      {etapa.nombreMes}
                      {now && (
                        <span className="inline-flex items-center gap-1.5 normal-case tracking-normal text-fg">
                          <span className="pn-signal" aria-hidden />
                          estamos acá
                        </span>
                      )}
                    </span>
                    <span className="mt-1.5 block text-[15px] font-medium leading-snug text-fg group-hover:text-fg/80 transition-colors">
                      {sentence(etapa.titulo)}
                    </span>
                    <span className="mt-1 block text-xs text-fg/40 tabular-nums">
                      {hechas} de {total} tareas hechas
                    </span>
                  </Link>
                </li>
              )
            })}
          </ol>
        </section>
      )}

      <section>
        <h2 className={h2}>Metas</h2>
        <dl className="mt-5 grid gap-6 sm:grid-cols-2">
          {resumen.encabezado.map(({ label, value }) => (
            <div key={label}>
              <dt className="text-[11px] uppercase tracking-wide text-fg/40">{label}</dt>
              <dd className="mt-1 text-lg font-medium leading-snug text-fg">{value}</dd>
            </div>
          ))}
        </dl>

        {resumen.hitos.length > 0 && (
          <div className="mt-8">
            <h3 className="text-sm font-medium text-fg">Hitos</h3>
            {proximo && (
              <p className="mt-0.5 text-sm text-fg/50">
                El próximo es <span className="text-fg">{proximo.hito.titulo}</span>, {diasTexto(proximo.dias)}.
              </p>
            )}
            <ol className="mt-3 divide-y divide-fg/[0.06]">
              {resumen.hitos.map((h) => {
                const next = proximo?.hito === h
                const past = h.fecha < today
                return (
                  <li key={`${h.fecha}-${h.titulo}`} className={`flex items-center gap-4 py-2 text-sm ${next ? 'text-fg' : past ? 'text-fg/30' : 'text-fg/65'}`}>
                    <span className="w-14 shrink-0 font-mono text-xs tabular-nums">{formatFecha(h.fecha)}</span>
                    <span className="flex-1">{h.titulo}</span>
                    {next && <span className="pn-signal" aria-label="el próximo" />}
                  </li>
                )
              })}
            </ol>
          </div>
        )}
      </section>
    </div>
  )
}
