import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Plus, Sun } from 'lucide-react'
import { createServiceClient } from '@/lib/supabase/service'
import { getTaskActor, getTeam, isUuid, type TaskRow } from '@/lib/tasks/data'
import { compareTasks, costaRicaDate, STATUS_LABELS, TASK_STATUSES, type TaskStatus } from '@/lib/tasks/rules'
import { TaskCard } from '@/components/tasks/task-card'

export const metadata = { title: 'Tareas' }

const DONE_LIMIT = 20
// Orden de lectura para el colaborador: lo activo primero
const MY_ORDER: TaskStatus[] = ['en_progreso', 'bloqueada', 'pendiente', 'en_revision']

function byStatus(tasks: TaskRow[], status: TaskStatus): TaskRow[] {
  const list = tasks.filter((t) => t.status === status)
  if (status === 'hecha') {
    return list.sort((a, b) => (b.completed_at ?? '').localeCompare(a.completed_at ?? '')).slice(0, DONE_LIMIT)
  }
  return list.sort(compareTasks)
}

export default async function TareasPage({ searchParams }: { searchParams: Promise<{ persona?: string }> }) {
  const actor = await getTaskActor()
  if (!actor) redirect('/admin')

  const service = createServiceClient()
  const today = costaRicaDate(new Date())

  if (!actor.isAdmin) {
    const { data } = await service.from('tasks').select('*').eq('assignee_id', actor.id)
    const tasks = (data ?? []) as TaskRow[]
    const done = byStatus(tasks, 'hecha')
    return (
      <div className="p-4 md:p-8 max-w-3xl">
        <h1 className="text-xl font-semibold text-white mb-6">Mis tareas</h1>
        {tasks.length === 0 && <p className="text-sm text-white/40">No tenés tareas asignadas.</p>}
        <div className="space-y-6">
          {MY_ORDER.map((status) => {
            const list = byStatus(tasks, status)
            if (list.length === 0) return null
            return (
              <section key={status}>
                <h2 className="text-xs font-medium uppercase tracking-wide text-white/40 mb-2">
                  {STATUS_LABELS[status]} · {list.length}
                </h2>
                <div className="grid gap-2">
                  {list.map((t) => <TaskCard key={t.id} task={t} today={today} />)}
                </div>
              </section>
            )
          })}
          {done.length > 0 && (
            <details>
              <summary className="text-xs font-medium uppercase tracking-wide text-white/40 cursor-pointer">
                Hechas · {done.length}
              </summary>
              <div className="grid gap-2 mt-2">
                {done.map((t) => <TaskCard key={t.id} task={t} today={today} />)}
              </div>
            </details>
          )}
        </div>
      </div>
    )
  }

  const { persona } = await searchParams
  let query = service.from('tasks').select('*')
  if (persona === 'sin') query = query.is('assignee_id', null)
  else if (persona && isUuid(persona)) query = query.eq('assignee_id', persona)
  const [{ data }, team] = await Promise.all([query, getTeam()])
  const tasks = (data ?? []) as TaskRow[]
  const nameById = new Map(team.map((m) => [m.id, m.name]))

  const chip = (label: string, value: string | null) => {
    const active = (persona ?? null) === value
    return (
      <Link
        key={label}
        href={value ? `/tareas?persona=${value}` : '/tareas'}
        className={`px-3 py-1 text-xs rounded-full border transition-colors ${
          active ? 'bg-[#5bb6ff]/15 border-[#5bb6ff]/30 text-[#5bb6ff]' : 'border-white/[0.08] text-white/50 hover:text-white/80'
        }`}
      >
        {label}
      </Link>
    )
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <h1 className="text-xl font-semibold text-white">Tareas</h1>
        <div className="flex items-center gap-2">
          <Link href="/tareas/hoy" className="flex items-center gap-2 px-3.5 py-2 text-sm rounded-lg bg-white/[0.05] text-white/70 hover:bg-white/[0.09] transition-colors">
            <Sun size={14} /> Hoy
          </Link>
          <Link href="/tareas/nueva" className="flex items-center gap-2 px-3.5 py-2 text-sm font-semibold rounded-lg bg-[#5bb6ff] text-black hover:bg-[#7cc5ff] transition-colors">
            <Plus size={14} /> Nueva tarea
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        {chip('Todos', null)}
        {team.map((m) => chip(m.name, m.id))}
        {chip('Sin asignar', 'sin')}
      </div>

      <div className="grid grid-flow-col auto-cols-[minmax(250px,1fr)] gap-3 overflow-x-auto pb-4">
        {TASK_STATUSES.map((status) => {
          const list = byStatus(tasks, status)
          return (
            <section key={status} className="min-w-0">
              <h2 className="flex items-center justify-between text-xs font-medium uppercase tracking-wide text-white/40 mb-2 px-1">
                {STATUS_LABELS[status]}
                <span className="text-white/25">{list.length}</span>
              </h2>
              <div className="grid gap-2">
                {list.map((t) => (
                  <TaskCard key={t.id} task={t} today={today} assigneeName={t.assignee_id ? nameById.get(t.assignee_id) ?? 'Usuario' : null} />
                ))}
                {list.length === 0 && <p className="text-xs text-white/20 px-1">—</p>}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
