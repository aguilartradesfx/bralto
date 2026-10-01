import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { jsonError, readJson, requireTaskActor } from '@/lib/tasks/api'
import { getTask } from '@/lib/tasks/data'
import {
  allowedTransitions, canViewTask, noticesForTransition, transitionKind, TASK_STATUSES, type TaskStatus,
} from '@/lib/tasks/rules'
import { sendTaskNotices } from '@/lib/tasks/notify'

type Params = { params: Promise<{ id: string }> }

export async function POST(request: Request, { params }: Params) {
  const { actor, denied } = await requireTaskActor()
  if (denied) return denied

  const { id } = await params
  const task = await getTask(id)
  if (!task || !canViewTask(actor, task)) return jsonError('Tarea no encontrada', 404)

  const body = await readJson(request)
  const to = body?.to as TaskStatus
  const note = typeof body?.note === 'string' ? body.note.trim() : ''
  if (!TASK_STATUSES.includes(to)) return jsonError('Estado inválido', 400)
  if (!allowedTransitions(actor, task).includes(to)) return jsonError('No podés mover esta tarea a ese estado', 403)

  const { kind, noteRequired } = transitionKind(task.status, to)
  if (noteRequired && !note) {
    return jsonError(to === 'bloqueada' ? 'Contá por qué está bloqueada' : 'Contá qué hay que corregir', 400)
  }
  if (note.length > 5000) return jsonError('La nota es demasiado larga', 400)

  const service = createServiceClient()
  // Solo si nadie la movió mientras tanto
  const { data: updated, error } = await service
    .from('tasks')
    .update({ status: to, completed_at: to === 'hecha' ? new Date().toISOString() : null })
    .eq('id', id)
    .eq('status', task.status)
    .select('*')
    .maybeSingle()
  if (error) return jsonError(error.message, 500)
  if (!updated) return jsonError('La tarea cambió mientras tanto. Recargá la página.', 409)

  await service.from('task_updates').insert({
    task_id: id,
    author_id: actor.id,
    kind,
    body: note,
    from_status: task.status,
    to_status: to,
  })

  sendTaskNotices(noticesForTransition(actor.id, task, to), { taskId: id, title: task.title, actorName: actor.name, note })
  return NextResponse.json({ task: updated })
}
