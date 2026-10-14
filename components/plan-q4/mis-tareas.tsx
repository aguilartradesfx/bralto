import { MESES_LARGOS } from '@/lib/plan-q4/guia'
import type { PersonaFilter } from '@/lib/plan-q4/rules'
import type { PlanTask } from '@/lib/plan-q4/types'
import { misTareas, viewHref } from '@/lib/plan-q4/vistas'
import { PersonaFilterBar } from '@/components/plan-q4/persona-filter'
import { TaskList, type TaskListProps } from '@/components/plan-q4/task-list'
import { sentence } from '@/components/plan-q4/inicio'

type ListContext = Pick<TaskListProps, 'today' | 'week' | 'doneIds' | 'canEdit' | 'areas' | 'textos'>

function Group({ title, tone, tasks, list }: { title: string; tone?: string; tasks: PlanTask[]; list: ListContext }) {
  if (tasks.length === 0) return null
  return (
    <section>
      <h2 className={`mb-1 text-[13px] font-medium ${tone ?? 'text-white/55'}`}>
        {title} <span className="ml-1 font-normal text-white/25">{tasks.length}</span>
      </h2>
      <TaskList tasks={tasks} {...list} />
    </section>
  )
}

function Folded({ title, tasks, list }: { title: string; tasks: PlanTask[]; list: ListContext }) {
  if (tasks.length === 0) return null
  return (
    <details className="group">
      <summary className="flex w-fit cursor-pointer list-none items-center gap-2 text-[13px] text-white/40 hover:text-white/70 [&::-webkit-details-marker]:hidden">
        <span className="transition-transform group-open:rotate-90" aria-hidden>›</span>
        {title} <span className="text-white/25">{tasks.length}</span>
      </summary>
      <div className="mt-1">
        <TaskList tasks={tasks} {...list} />
      </div>
    </details>
  )
}

export function MisTareasView({ tasks, persona, list }: { tasks: PlanTask[]; persona: PersonaFilter; list: ListContext }) {
  const m = misTareas(tasks, list.today, persona)
  const nada = m.vencidas.length + m.semana.length + m.semanales.length + m.proximas.length === 0
  const withPersona = { ...list, showPersona: persona === 'todos' }

  return (
    <div className="space-y-8 max-w-3xl">
      <PersonaFilterBar persona={persona} hrefFor={(p) => viewHref({ vista: 'tareas' }, p)} />

      {nada && <p className="text-sm text-white/40">Nada pendiente para estas semanas.</p>}
      <Group title="Vencidas" tone="text-red-300" tasks={m.vencidas} list={withPersona} />
      <Group title="Esta semana" tasks={m.semana} list={withPersona} />
      <Group title="Cada semana" tasks={m.semanales} list={withPersona} />
      <Group title="Próximas dos semanas" tasks={m.proximas} list={withPersona} />

      {(m.despues.length > 0 || m.hechas.length > 0) && (
        <div className="space-y-2 pt-2">
          {m.despues.map(({ mes, tareas }) => (
            <Folded key={mes} title={sentence(MESES_LARGOS[mes - 1])} tasks={tareas} list={withPersona} />
          ))}
          <Folded title="Hechas" tasks={m.hechas} list={withPersona} />
        </div>
      )}
    </div>
  )
}
