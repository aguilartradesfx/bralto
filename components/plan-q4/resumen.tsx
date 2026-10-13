import Link from 'next/link'
import { addDays, diasTexto, formatFecha } from '@/lib/plan-q4/fechas'
import type { PlanBlock } from '@/lib/plan-q4/parse'
import { blockProgress, nextMilestone, planHref, weekSummary, type PersonaFilter } from '@/lib/plan-q4/rules'
import { PERSONA_NAMES, type PlanTask, type ResumenData } from '@/lib/plan-q4/types'
import { TaskList, type TaskListProps } from '@/components/plan-q4/task-list'

type ListContext = Pick<TaskListProps, 'today' | 'week' | 'doneIds' | 'canEdit'>

interface Props {
  resumen: ResumenData
  blocks: PlanBlock[]
  tasks: PlanTask[]
  persona: PersonaFilter
  list: ListContext
}

const heading = 'text-xs font-medium uppercase tracking-wide text-white/40'
const card = 'p-4 bg-white/[0.03] border border-white/[0.07] rounded-xl'

function Group({ title, tone, tasks, list }: { title: string; tone?: string; tasks: PlanTask[]; list: ListContext }) {
  return (
    <div>
      <p className={`mb-1.5 text-[11px] uppercase tracking-wide ${tone ?? 'text-white/40'}`}>
        {title} · {tasks.length}
      </p>
      <TaskList tasks={tasks} {...list} />
    </div>
  )
}

export function Resumen({ resumen, blocks, tasks, persona, list }: Props) {
  const { today, week } = list
  const proximo = nextMilestone(resumen.hitos, today)
  const semana = weekSummary(tasks, today, persona)
  const progress = blockProgress(tasks, persona)

  return (
    <div className="space-y-8">
      {resumen.encabezado.length > 0 && (
        <section className="grid gap-3 sm:grid-cols-2">
          {resumen.encabezado.map(({ label, value }) => (
            <div key={label} className={card}>
              <p className="text-[11px] uppercase tracking-wide text-white/40">{label}</p>
              <p className="mt-1 text-sm text-white">{value}</p>
            </div>
          ))}
        </section>
      )}

      {resumen.hitos.length > 0 && (
        <section className={card}>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className={heading}>Hitos</h2>
            {proximo && (
              <p className="text-sm text-white/70">
                Próximo: <span className="text-white font-medium">{proximo.hito.titulo}</span> · {diasTexto(proximo.dias)}
              </p>
            )}
          </div>
          <ol className="mt-3 grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
            {resumen.hitos.map((h) => {
              const next = proximo?.hito === h
              const past = h.fecha < today
              return (
                <li key={`${h.fecha}-${h.titulo}`} className={`flex gap-3 text-sm ${next ? 'text-[#5bb6ff]' : past ? 'text-white/30' : 'text-white/70'}`}>
                  <span className="w-14 shrink-0 tabular-nums">{formatFecha(h.fecha)}</span>
                  {h.titulo}
                </li>
              )
            })}
          </ol>
        </section>
      )}

      <section>
        <h2 className={`${heading} mb-3`}>
          Esta semana · {formatFecha(week)} al {formatFecha(addDays(week, 6))}
        </h2>
        <div className="space-y-6">
          {semana.map((w) => {
            const empty = w.vencidas.length + w.semana.length + w.semanales.length === 0
            return (
              <div key={w.persona}>
                <h3 className="mb-2 text-sm font-medium text-white">{PERSONA_NAMES[w.persona]}</h3>
                {empty ? (
                  <p className="text-sm text-white/40">Nada para esta semana.</p>
                ) : (
                  <div className="space-y-4">
                    {w.vencidas.length > 0 && <Group title="Vencidas" tone="text-red-300" tasks={w.vencidas} list={list} />}
                    {w.semana.length > 0 && <Group title="Con fecha esta semana" tasks={w.semana} list={list} />}
                    {w.semanales.length > 0 && <Group title="Semanales" tasks={w.semanales} list={list} />}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>

      <section>
        <h2 className={`${heading} mb-3`}>Avance por bloque</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {blocks
            .filter((b) => b.tipo === 'accion' && (progress.get(b.key)?.total ?? 0) > 0)
            .map((b) => {
              const p = progress.get(b.key)!
              const pct = Math.round((p.hechas / p.total) * 100)
              return (
                <Link key={b.key} href={planHref(b.key, persona)} className={`${card} block hover:border-[#5bb6ff]/30 transition-colors`}>
                  <span className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="truncate text-white/80">
                      <span className="mr-2 font-mono text-[11px] text-white/35">{b.code}</span>
                      {b.titulo}
                    </span>
                    <span className="shrink-0 tabular-nums text-white/50">
                      {p.hechas}/{p.total}
                    </span>
                  </span>
                  <span
                    className="mt-2 block h-1.5 overflow-hidden rounded-full bg-white/[0.06]"
                    role="progressbar"
                    aria-valuenow={pct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${b.titulo}: ${p.hechas} de ${p.total} hechas`}
                  >
                    <span className="block h-full rounded-full bg-[#5bb6ff]" style={{ width: `${pct}%` }} />
                  </span>
                </Link>
              )
            })}
        </div>
      </section>
    </div>
  )
}
