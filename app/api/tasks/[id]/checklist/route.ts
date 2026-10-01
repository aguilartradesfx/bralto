import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { jsonError, readJson, requireTaskActor } from '@/lib/tasks/api'
import { getTask } from '@/lib/tasks/data'
import { canViewTask } from '@/lib/tasks/rules'

type Params = { params: Promise<{ id: string }> }

// Marca o desmarca un ítem del checklist (admin o responsable)
export async function PATCH(request: Request, { params }: Params) {
  const { actor, denied } = await requireTaskActor()
  if (denied) return denied

  const { id } = await params
  const task = await getTask(id)
  if (!task || !canViewTask(actor, task)) return jsonError('Tarea no encontrada', 404)

  const body = await readJson(request)
  const index = body?.index
  const done = body?.done
  if (typeof index !== 'number' || !Number.isInteger(index) || index < 0 || index >= task.checklist.length) {
    return jsonError('Ítem inválido', 400)
  }
  if (typeof done !== 'boolean') return jsonError('Valor inválido', 400)

  const checklist = task.checklist.map((item, i) => (i === index ? { ...item, done } : item))
  const { error } = await createServiceClient().from('tasks').update({ checklist }).eq('id', id)
  if (error) return jsonError(error.message, 500)
  return NextResponse.json({ checklist })
}
