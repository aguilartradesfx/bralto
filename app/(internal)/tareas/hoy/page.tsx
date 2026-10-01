import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { createServiceClient } from '@/lib/supabase/service'
import { getTaskActor, getTeam, type TaskUpdateRow } from '@/lib/tasks/data'
import { costaRicaDayRange, STATUS_LABELS } from '@/lib/tasks/rules'

export const metadata = { title: 'Hoy' }

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-CR', { timeZone: 'America/Costa_Rica', hour: 'numeric', minute: '2-digit' })
}

// Reporte diario: avances del día (hora de Costa Rica) agrupados por persona
export default async function HoyPage() {
  const actor = await getTaskActor()
  if (!actor?.isAdmin) redirect('/tareas')

  const { start, end } = costaRicaDayRange(new Date())
  const service = createServiceClient()
  const [{ data }, team] = await Promise.all([
    service.from('task_updates').select('*').gte('created_at', start).lt('created_at', end).order('created_at'),
    getTeam(),
  ])
  const updates = (data ?? []) as TaskUpdateRow[]

  const taskIds = [...new Set(updates.map((u) => u.task_id))]
  const { data: tasks } = taskIds.length
    ? await service.from('tasks').select('id, title').in('id', taskIds)
    : { data: [] as { id: string; title: string }[] }
  const titleById = new Map((tasks ?? []).map((t) => [t.id, t.title]))
  const nameOf = (id: string | null) => (id ? team.find((m) => m.id === id)?.name ?? 'Usuario' : 'Usuario')

  const progress = updates.filter((u) => u.kind === 'avance')
  const changes = updates.filter((u) => u.kind !== 'avance')
  const byAuthor = new Map<string, TaskUpdateRow[]>()
  for (const u of progress) {
    const key = nameOf(u.author_id)
    byAuthor.set(key, [...(byAuthor.get(key) ?? []), u])
  }

  const dayLabel = new Date().toLocaleDateString('es-CR', { timeZone: 'America/Costa_Rica', weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="p-4 md:p-8 max-w-3xl">
      <Link href="/tareas" className="inline-flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 mb-4">
        <ArrowLeft size={13} /> Tareas
      </Link>
      <h1 className="text-xl font-semibold text-white">Hoy</h1>
      <p className="text-sm text-white/40 mt-0.5 mb-6 first-letter:uppercase">{dayLabel}</p>

      {progress.length === 0 && <p className="text-sm text-white/40 mb-6">Nadie reportó avances hoy todavía.</p>}

      <div className="space-y-4">
        {[...byAuthor.entries()].map(([name, list]) => (
          <section key={name} className="p-5 bg-white/[0.03] border border-white/[0.07] rounded-xl">
            <h2 className="text-sm font-medium text-white mb-3">
              {name} <span className="text-white/35 font-normal">· {list.length} avance{list.length === 1 ? '' : 's'}</span>
            </h2>
            <ul className="space-y-3">
              {list.map((u) => (
                <li key={u.id}>
                  <Link href={`/tareas/${u.task_id}`} className="text-xs text-[#5bb6ff] hover:text-[#7cc5ff]">
                    {titleById.get(u.task_id) ?? 'Tarea'}
                  </Link>
                  <span className="text-xs text-white/30"> · {formatTime(u.created_at)}</span>
                  <p className="text-sm text-white/75 whitespace-pre-wrap mt-0.5">{u.body}</p>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      {changes.length > 0 && (
        <section className="mt-6">
          <h2 className="text-xs font-medium uppercase tracking-wide text-white/40 mb-2">Cambios de estado</h2>
          <ul className="space-y-1.5">
            {changes.map((u) => (
              <li key={u.id} className="text-sm text-white/60">
                <span className="text-white/30">{formatTime(u.created_at)}</span> · {nameOf(u.author_id)} movió{' '}
                <Link href={`/tareas/${u.task_id}`} className="text-[#5bb6ff] hover:text-[#7cc5ff]">
                  {titleById.get(u.task_id) ?? 'una tarea'}
                </Link>{' '}
                {u.from_status && u.to_status && `de ${STATUS_LABELS[u.from_status]} a ${STATUS_LABELS[u.to_status]}`}
                {u.body && <span className="text-white/40"> — {u.body}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
