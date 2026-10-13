import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { jsonError, readJson, requirePlanMember } from '@/lib/plan-q4/api'
import { weekToggleError } from '@/lib/plan-q4/rules'
import type { PlanTask } from '@/lib/plan-q4/types'
import { parseWeekToggle } from '@/lib/plan-q4/validate'

// Check de una semanal en una semana (lunes)
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { slug, denied } = await requirePlanMember()
  if (denied) return denied
  const { id } = await params
  const parsed = parseWeekToggle(await readJson(request))
  if (!parsed.ok) return jsonError(parsed.error, 400)

  const service = createServiceClient()
  const { data: task, error: readError } = await service.from('plan_tasks').select('tipo, fecha').eq('id', id).maybeSingle()
  if (readError) return jsonError(readError.message, 500)
  if (!task) return jsonError('Tarea no encontrada', 404)
  const invalid = weekToggleError(task as Pick<PlanTask, 'tipo' | 'fecha'>, parsed.value.week_start)
  if (invalid) return jsonError(invalid, 400)

  const now = new Date().toISOString()
  const { done, week_start } = parsed.value
  const { error } = await service.from('plan_task_weeks').upsert(
    { task_id: id, week_start, done, done_by: done ? slug : null, done_at: done ? now : null },
    { onConflict: 'task_id,week_start' },
  )
  if (error) return jsonError(error.message, 500)
  const { error: stampError } = await service.from('plan_tasks').update({ actualizado_por: slug, actualizado_en: now }).eq('id', id)
  if (stampError) return jsonError(stampError.message, 500)
  return NextResponse.json({ ok: true })
}
