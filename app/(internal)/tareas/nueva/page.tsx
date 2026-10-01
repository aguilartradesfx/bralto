import { redirect } from 'next/navigation'
import { getTaskActor, getTeam } from '@/lib/tasks/data'
import { TaskForm } from '@/components/tasks/task-form'

export const metadata = { title: 'Nueva tarea' }

export default async function NuevaTareaPage() {
  const actor = await getTaskActor()
  if (!actor?.isAdmin) redirect('/tareas')

  return (
    <div className="p-4 md:p-8 max-w-3xl">
      <h1 className="text-xl font-semibold text-white mb-6">Nueva tarea</h1>
      <TaskForm mode="create" team={await getTeam()} />
    </div>
  )
}
