import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { jsonError, readJson, requireTaskActor } from '@/lib/tasks/api'
import { getTask } from '@/lib/tasks/data'
import { canViewTask } from '@/lib/tasks/rules'
import { toggleChecklistItem } from '@/lib/tasks/draft'

type Params = { params: Promise<{ id: string }> }

// Marca o desmarca un ítem del checklist (admin o responsable)
export async function PATCH(request: Request, { params }: Params) {
  const { actor, denied } = await requireTaskActor()
  if (denied) return denied

  const { id } = await params
  const task = await getTask(id)
  if (!task || !canViewTask(actor, task)) return jsonError('Tarea no encontrada', 404)

  const body = await readJson(request)
  const { index, text, done } = body ?? {}
  if (typeof index !== 'number' || !Number.isInteger(index) || typeof text !== 'string' || typeof done !== 'boolean') {
    return jsonError('Ítem inválido', 400)
  }

  const checklist = toggleChecklistItem(task.checklist, index, text, done)
  if (!checklist) return jsonError('El checklist cambió. Recargá la página.', 409)

  // Solo si nadie tocó la tarea desde que la leímos
  const { data, error } = await createServiceClient()
    .from('tasks')
    .update({ checklist })
    .eq('id', id)
    .eq('updated_at', task.updated_at)
    .select('id')
    .maybeSingle()
  if (error) return jsonError(error.message, 500)
  if (!data) return jsonError('La tarea cambió mientras tanto. Recargá la página.', 409)
  return NextResponse.json({ checklist })
}
