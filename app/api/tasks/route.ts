import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { jsonError, readJson, requireTaskActor } from '@/lib/tasks/api'
import { getTeam } from '@/lib/tasks/data'
import { normalizeChecklist, TaskInputSchema } from '@/lib/tasks/draft'
import { noticesForAssignment } from '@/lib/tasks/rules'
import { sendTaskNotices } from '@/lib/tasks/notify'

export async function POST(request: Request) {
  const { actor, denied } = await requireTaskActor()
  if (denied) return denied
  if (!actor.isAdmin) return jsonError('Solo un admin puede crear tareas', 403)

  const parsed = TaskInputSchema.safeParse(await readJson(request))
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? 'Datos inválidos', 400)
  const input = parsed.data

  if (input.assignee_id && !(await getTeam()).some((m) => m.id === input.assignee_id)) {
    return jsonError('Esa persona no tiene acceso a Tareas', 400)
  }

  const { data, error } = await createServiceClient()
    .from('tasks')
    .insert({
      title: input.title,
      description: input.description.trim(),
      checklist: normalizeChecklist(input.checklist),
      priority: input.priority,
      assignee_id: input.assignee_id,
      due_date: input.due_date,
      created_by: actor.id,
    })
    .select('id')
    .single()
  if (error) return jsonError(error.message, 500)

  sendTaskNotices(noticesForAssignment(actor.id, input.assignee_id, null), {
    taskId: data.id,
    title: input.title,
    actorName: actor.name,
  })
  return NextResponse.json({ id: data.id }, { status: 201 })
}
