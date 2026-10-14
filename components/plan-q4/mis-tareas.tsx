import { MESES_LARGOS } from '@/lib/plan-q4/guia'
import type { PersonaFilter } from '@/lib/plan-q4/rules'
import { PERSONA_NAMES, type PlanTask } from '@/lib/plan-q4/types'
import { misTareas, viewHref } from '@/lib/plan-q4/vistas'
import { PersonaFilterBar } from '@/components/plan-q4/persona-filter'
import { TaskList, type TaskListProps } from '@/components/plan-q4/task-list'
import { sentence } from '@/components/plan-q4/inicio'

type ListContext = Pick<TaskListProps, 'today' | 'week' | 'doneIds' | 'canEdit' | 'areas'>

function Group({ title, tone, tasks, list, hint }: { title: string; tone?: string; tasks: PlanTask[]; list: ListContext; hint?: string }) {
  if (tasks.length === 0) return null
  return (
    <section>
      <h2 className={`mb-1 text-xs font-medium uppercase tracking-wide ${tone ?? 'text-white/45'}`}>
        {title} · {tasks.length}
      </h2>
      {hint && <p className="mb-2 text-xs text-white/40">{hint}</p>}
      <TaskList tasks={tasks} {...list} />
    </section>
  )
}

function Folded({ title, tasks, list }: { title: string; tasks: PlanTask[]; list: ListContext }) {
  if (tasks.length === 0) return null
  return (
    <details className="group">
      <summary className="flex w-fit cursor-pointer list-none items-center gap-2 text-xs font-medium uppercase tracking-wide text-white/45 hover:text-white/70 [&::-webkit-details-marker]:hidden">
        <span className="transition-transform group-open:rotate-90" aria-hidden>›</span>
        {title} · {tasks.length}
      </summary>
      <div className="mt-2">
        <TaskList tasks={tasks} {...list} />
      </div>
    </details>
  )
}

export function MisTareasView({ tasks, persona, list }: { tasks: PlanTask[]; persona: PersonaFilter; list: ListContext }) {
  const m = misTareas(tasks, list.today, persona)
  const nada = m.vencidas.length + m.semana.length + m.semanales.length + m.proximas.length === 0
  const quien = persona === 'todos' ? 'Todo el equipo' : PERSONA_NAMES[persona]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">{persona === 'todos' ? 'Tareas del equipo' : `Tareas de ${quien}`}</h2>
          <p className="mt-0.5 text-sm text-white/45">Lo de esta semana arriba; lo que viene, más abajo.</p>
        </div>
        <PersonaFilterBar persona={persona} hrefFor={(p) => viewHref({ vista: 'tareas' }, p)} />
      </div>

      {nada && <p className="text-sm text-white/50">Nada pendiente para estas semanas.</p>}
      <Group title="Vencidas" tone="text-red-300" hint="Ya pasó su fecha: hacelas primero o cambiá la fecha." tasks={m.vencidas} list={list} />
      <Group title="Esta semana" tasks={m.semana} list={list} />
      <Group title="Todas las semanas" hint="Se marcan cada semana; el check se reinicia el lunes." tasks={m.semanales} list={list} />
      <Group title="Próximas dos semanas" tasks={m.proximas} list={list} />

      {(m.despues.length > 0 || m.hechas.length > 0) && (
        <div className="space-y-3 border-t border-white/[0.06] pt-5">
          {m.despues.map(({ mes, tareas }) => (
            <Folded key={mes} title={`Más adelante: ${sentence(MESES_LARGOS[mes - 1])}`} tasks={tareas} list={list} />
          ))}
          <Folded title="Hechas" tasks={m.hechas} list={list} />
        </div>
      )}
    </div>
  )
}
