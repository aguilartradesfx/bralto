import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { etapaActual, progresoEtapa } from '@/lib/plan-q4/etapas'
import { diasTexto, formatFecha } from '@/lib/plan-q4/fechas'
import { contextoHtml } from '@/lib/plan-q4/markdown'
import { nextMilestone, type PersonaFilter } from '@/lib/plan-q4/rules'
import { PERSONA_NAMES, type Etapa, type GuiaData, type Persona, type PlanTask, type ResumenData } from '@/lib/plan-q4/types'
import { viewHref, type ResumenPersona } from '@/lib/plan-q4/vistas'
import { Markdown } from '@/components/plan-q4/markdown'

const card = 'pn-glass rounded-[20px] p-5'
const heading = 'text-xs font-medium uppercase tracking-wide text-white/40'
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
    <div className="space-y-6">
      {guia?.queEs && (
        <section className={card}>
          <h2 className={`${heading} mb-2`}>Qué es esto</h2>
          <Markdown html={contextoHtml(guia.queEs)} />
        </section>
      )}

      {actor && miSemana && (
        <section className={`${card} flex flex-wrap items-center justify-between gap-4`}>
          <div>
            <h2 className="text-base font-semibold text-white">Tu semana, {PERSONA_NAMES[actor]}</h2>
            <p className="mt-1 text-sm text-white/60">
              {miSemana.semana === 0 && miSemana.vencidas === 0
                ? 'No tenés nada pendiente para esta semana.'
                : `${miSemana.semana} ${miSemana.semana === 1 ? 'tarea' : 'tareas'} para esta semana`}
              {miSemana.vencidas > 0 && (
                <span className="text-red-300">
                  {' · '}
                  {miSemana.vencidas} {miSemana.vencidas === 1 ? 'vencida' : 'vencidas'}
                </span>
              )}
            </p>
          </div>
          <Link href={viewHref({ vista: 'tareas' }, actor)} className="pn-btn-solid inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold">
            Ver mis tareas
            <ArrowRight size={15} strokeWidth={1.5} absoluteStrokeWidth aria-hidden />
          </Link>
        </section>
      )}

      {guia?.queVamos && (
        <section className={card}>
          <h2 className={`${heading} mb-2`}>Qué vamos a hacer</h2>
          <Markdown html={contextoHtml(guia.queVamos)} />
        </section>
      )}

      {etapas.length > 0 && (
        <section>
          <h2 className={`${heading} mb-3`}>Las etapas</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {etapas.map((etapa) => {
              const now = actual?.mes === etapa.mes
              const { hechas, total } = progresoEtapa(tasks, etapa.mes)
              const pct = total ? Math.round((hechas / total) * 100) : 0
              return (
                <Link
                  key={etapa.mes}
                  href={viewHref({ vista: 'etapas', etapa: etapa.mes }, persona)}
                  className={`${card} block transition-transform duration-300 hover:-translate-y-0.5 ${now ? '' : 'opacity-80'}`}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[11px] uppercase tracking-widest text-white/45">{etapa.nombreMes}</span>
                    {now && (
                      <span className="inline-flex items-center gap-1.5 text-[11px] text-white">
                        <span className="pn-signal" aria-hidden />
                        Estamos acá
                      </span>
                    )}
                  </span>
                  <span className="mt-2 block text-sm font-medium text-white leading-snug">{sentence(etapa.titulo)}</span>
                  <span className="mt-4 flex items-center justify-between text-[11px] text-white/45">
                    <span>Avance</span>
                    <span className="tabular-nums">
                      {hechas}/{total}
                    </span>
                  </span>
                  <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-white/[0.06]" aria-hidden>
                    <span className="block h-full rounded-full bg-white/80" style={{ width: `${pct}%` }} />
                  </span>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      <section>
        <h2 className={`${heading} mb-3`}>Metas</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {resumen.encabezado.map(({ label, value }) => (
            <div key={label} className={card}>
              <p className="text-[11px] uppercase tracking-wide text-white/40">{label}</p>
              <p className="mt-1 text-sm text-white">{value}</p>
            </div>
          ))}
        </div>
        {resumen.hitos.length > 0 && (
          <div className={`${card} mt-3`}>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-[11px] uppercase tracking-wide text-white/40">Hitos</p>
              {proximo && (
                <p className="text-sm text-white/70">
                  Próximo: <span className="font-medium text-white">{proximo.hito.titulo}</span> · {diasTexto(proximo.dias)}
                </p>
              )}
            </div>
            <ol className="mt-3 grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
              {resumen.hitos.map((h) => {
                const next = proximo?.hito === h
                const past = h.fecha < today
                return (
                  <li key={`${h.fecha}-${h.titulo}`} className={`flex gap-3 text-sm ${next ? 'text-white font-medium' : past ? 'text-white/30' : 'text-white/65'}`}>
                    <span className="w-14 shrink-0 tabular-nums">{formatFecha(h.fecha)}</span>
                    {h.titulo}
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
