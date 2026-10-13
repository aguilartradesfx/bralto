import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { jsonError, readJson, requirePlanMember } from '@/lib/plan-q4/api'
import { buildUpdate } from '@/lib/plan-q4/rules'
import type { PlanTask } from '@/lib/plan-q4/types'
import { parseTaskPatch } from '@/lib/plan-q4/validate'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { slug, denied } = await requirePlanMember()
  if (denied) return denied
  const { id } = await params
  const parsed = parseTaskPatch(await readJson(request))
  if (!parsed.ok) return jsonError(parsed.error, 400)

  const service = createServiceClient()
  const { data: current, error: readError } = await service
    .from('plan_tasks')
    .select('tipo, responsable, apoyo')
    .eq('id', id)
    .maybeSingle()
  if (readError) return jsonError(readError.message, 500)
  if (!current) return jsonError('Tarea no encontrada', 404)

  const result = buildUpdate(current as Pick<PlanTask, 'tipo' | 'responsable' | 'apoyo'>, parsed.value, slug, new Date().toISOString())
  if (!result.ok) return jsonError(result.error, 400)
  const { error } = await service.from('plan_tasks').update(result.update).eq('id', id)
  if (error) return jsonError(error.message, 500)
  return NextResponse.json({ ok: true })
}
