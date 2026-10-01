import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { jsonError, readJson, requireTaskActor } from '@/lib/tasks/api'
import { getTask, getTeam } from '@/lib/tasks/data'
import { mergeChecklist, normalizeChecklist, TaskPatchSchema } from '@/lib/tasks/draft'
import { noticesForAssignment } from '@/lib/tasks/rules'
import { sendTaskNotices } from '@/lib/tasks/notify'

type Params = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, { params }: Params) {
  const { actor, denied } = await requireTaskActor()
  if (denied) return denied
  if (!actor.isAdmin) return jsonError('Solo un admin puede editar tareas', 403)

  const { id } = await params
  const task = await getTask(id)
  if (!task) return jsonError('Tarea no encontrada', 404)

  const parsed = TaskPatchSchema.safeParse(await readJson(request))
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? 'Datos inválidos', 400)
  const input = parsed.data

  const reassigned = input.assignee_id !== undefined && input.assignee_id !== task.assignee_id
  if (reassigned && input.assignee_id && !(await getTeam()).some((m) => m.id === input.assignee_id)) {
    return jsonError('Esa persona no tiene acceso a Tareas', 400)
  }

  const changes: Record<string, unknown> = {}
  if (input.title !== undefined) changes.title = input.title
  if (input.description !== undefined) changes.description = input.description.trim()
  // El formulario trae los "done" de cuando se abrió; mandan los vigentes
  if (input.checklist !== undefined) changes.checklist = mergeChecklist(task.checklist, normalizeChecklist(input.checklist))
  if (input.priority !== undefined) changes.priority = input.priority
  if (input.assignee_id !== undefined) changes.assignee_id = input.assignee_id
  if (input.due_date !== undefined) changes.due_date = input.due_date
  if (Object.keys(changes).length === 0) return jsonError('Nada para actualizar', 400)

  const { data, error } = await createServiceClient().from('tasks').update(changes).eq('id', id).select('*').single()
  if (error) return jsonError(error.message, 500)

  if (reassigned) {
    sendTaskNotices(noticesForAssignment(actor.id, input.assignee_id ?? null, task.assignee_id), {
      taskId: id,
      title: data.title,
      actorName: actor.name,
    })
  }
  return NextResponse.json({ task: data })
}

export async function DELETE(_request: Request, { params }: Params) {
  const { actor, denied } = await requireTaskActor()
  if (denied) return denied
  if (!actor.isAdmin) return jsonError('Solo un admin puede borrar tareas', 403)

  const { id } = await params
  if (!(await getTask(id))) return jsonError('Tarea no encontrada', 404)

  const { error } = await createServiceClient().from('tasks').delete().eq('id', id)
  if (error) return jsonError(error.message, 500)
  return NextResponse.json({ ok: true })
}
