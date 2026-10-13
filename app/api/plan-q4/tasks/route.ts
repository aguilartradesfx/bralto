import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { jsonError, readJson, requirePlanMember } from '@/lib/plan-q4/api'
import { getPlanContent } from '@/lib/plan-q4/data'
import { nextTaskId } from '@/lib/plan-q4/rules'
import { parseNewTask } from '@/lib/plan-q4/validate'

export async function POST(request: Request) {
  const { slug, denied } = await requirePlanMember()
  if (denied) return denied
  const content = await getPlanContent()
  if (!content) return jsonError('El plan todavía no está cargado', 409)
  const actionBlocks = content.blocks.filter((b) => b.tipo === 'accion' && b.code)
  const parsed = parseNewTask(await readJson(request), actionBlocks.map((b) => b.key))
  if (!parsed.ok) return jsonError(parsed.error, 400)
  const code = actionBlocks.find((b) => b.key === parsed.value.bloque)!.code!

  const service = createServiceClient()
  // Dos intentos: si alguien creó otra tarea en el mismo bloque al mismo tiempo, choca la PK
  for (let attempt = 0; attempt < 2; attempt++) {
    const { data: rows, error: idsError } = await service.from('plan_tasks').select('id').eq('bloque', parsed.value.bloque)
    if (idsError) return jsonError(idsError.message, 500)
    const id = nextTaskId(code, (rows ?? []).map((r) => r.id as string))
    const { error } = await service.from('plan_tasks').insert({
      id,
      ...parsed.value,
      estado: parsed.value.tipo === 'unica' ? 'pendiente' : null,
      origen: 'panel',
      actualizado_por: slug,
      actualizado_en: new Date().toISOString(),
    })
    if (!error) return NextResponse.json({ id }, { status: 201 })
    if (error.code !== '23505') return jsonError(error.message, 500)
  }
  return jsonError('No se pudo asignar un número a la tarea, probá de nuevo', 409)
}
