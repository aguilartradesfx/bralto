import { notFound, redirect } from 'next/navigation'
import { getTask, getTaskActor, getTeam } from '@/lib/tasks/data'
import { TaskForm } from '@/components/tasks/task-form'

export const metadata = { title: 'Editar tarea' }

export default async function EditarTareaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const actor = await getTaskActor()
  if (!actor?.isAdmin) redirect(`/tareas/${id}`)

  const task = await getTask(id)
  if (!task) notFound()

  return (
    <div className="p-4 md:p-8 max-w-3xl">
      <h1 className="text-xl font-semibold text-white mb-6">Editar tarea</h1>
      <TaskForm mode="edit" team={await getTeam()} initial={task} />
    </div>
  )
}
