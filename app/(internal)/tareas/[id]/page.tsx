import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { createServiceClient } from '@/lib/supabase/service'
import { getTask, getTaskActor, getTeam, type TaskUpdateRow } from '@/lib/tasks/data'
import { allowedTransitions, canViewTask, costaRicaDate } from '@/lib/tasks/rules'
import { TaskDetail } from '@/components/tasks/task-detail'

export const metadata = { title: 'Tarea' }

export default async function TareaPage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await getTaskActor()
  if (!actor) redirect('/admin')

  const { id } = await params
  const task = await getTask(id)
  if (!task || !canViewTask(actor, task)) notFound()

  const [{ data: updates }, team] = await Promise.all([
    createServiceClient().from('task_updates').select('*').eq('task_id', id).order('created_at', { ascending: false }),
    getTeam(),
  ])
  const nameOf = (userId: string | null) => (userId ? team.find((m) => m.id === userId)?.name ?? 'Usuario' : null)

  return (
    <div className="p-4 md:p-8 max-w-3xl">
      <Link href="/tareas" className="inline-flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 mb-4">
        <ArrowLeft size={13} /> Tareas
      </Link>
      <TaskDetail
        task={task}
        updates={((updates ?? []) as TaskUpdateRow[]).map((u) => ({ ...u, authorName: nameOf(u.author_id) ?? 'Usuario' }))}
        isAdmin={actor.isAdmin}
        canEditChecklist={actor.isAdmin || task.assignee_id === actor.id}
        allowed={allowedTransitions(actor, task)}
        assigneeName={nameOf(task.assignee_id)}
        creatorName={nameOf(task.created_by)}
        today={costaRicaDate(new Date())}
      />
    </div>
  )
}
