import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { jsonError, readJson, requireTaskActor } from '@/lib/tasks/api'
import { getTask } from '@/lib/tasks/data'
import { canViewTask } from '@/lib/tasks/rules'

type Params = { params: Promise<{ id: string }> }

// Avance diario dentro de la tarea
export async function POST(request: Request, { params }: Params) {
  const { actor, denied } = await requireTaskActor()
  if (denied) return denied

  const { id } = await params
  const task = await getTask(id)
  if (!task || !canViewTask(actor, task)) return jsonError('Tarea no encontrada', 404)

  const body = await readJson(request)
  const text = typeof body?.body === 'string' ? body.body.trim() : ''
  if (!text) return jsonError('Escribí el avance', 400)
  if (text.length > 5000) return jsonError('El avance es demasiado largo', 400)

  const service = createServiceClient()
  const { data, error } = await service
    .from('task_updates')
    .insert({ task_id: id, author_id: actor.id, kind: 'avance', body: text })
    .select('*')
    .single()
  if (error) return jsonError(error.message, 500)

  // La tarea queda como "con actividad reciente"
  await service.from('tasks').update({ updated_at: new Date().toISOString() }).eq('id', id)
  return NextResponse.json({ update: data }, { status: 201 })
}
