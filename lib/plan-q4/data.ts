// SERVER-ONLY — lecturas del Plan Q4 con service role (las tablas no tienen políticas de RLS)
import { cache } from 'react'
import { createServiceClient } from '@/lib/supabase/service'
import { getCurrentSession } from '@/lib/panel-session'
import { parsePlan, type PlanBlock } from '@/lib/plan-q4/parse'
import type { GuiaData, Persona, PlanTask, ResumenData, WeekCheck } from '@/lib/plan-q4/types'

export interface PlanActor {
  userId: string
  slug: Persona | null // null: tiene acceso pero no es del equipo del plan (solo lee)
}

export const getPlanActor = cache(async (): Promise<PlanActor | null> => {
  const { user } = await getCurrentSession()
  if (!user) return null
  const { data } = await createServiceClient().from('plan_team').select('slug').eq('user_id', user.id).maybeSingle()
  return { userId: user.id, slug: (data?.slug as Persona | undefined) ?? null }
})

export interface PlanContent {
  blocks: PlanBlock[]
  resumen: ResumenData
  guia: GuiaData | null // null hasta que el archivo traiga la guía
  actualizadoEn: string
}

// null si el seed todavía no corrió
export const getPlanContent = cache(async (): Promise<PlanContent | null> => {
  const { data, error } = await createServiceClient()
    .from('plan_content')
    .select('markdown, resumen, guia, actualizado_en')
    .eq('id', 1)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  return {
    blocks: parsePlan(data.markdown),
    resumen: data.resumen as ResumenData,
    guia: (data.guia as GuiaData | null) ?? null,
    actualizadoEn: data.actualizado_en,
  }
})

const TASK_COLUMNS =
  'id, bloque, titulo, responsable, apoyo, fecha, tipo, estado, nota, descripcion, instrucciones, origen, actualizado_por, actualizado_en'

export async function getPlanTasks(week: string): Promise<{ tasks: PlanTask[]; checks: WeekCheck[] }> {
  const service = createServiceClient()
  const [tasks, checks] = await Promise.all([
    service.from('plan_tasks').select(TASK_COLUMNS),
    service.from('plan_task_weeks').select('task_id, week_start, done, done_by, done_at').eq('week_start', week),
  ])
  if (tasks.error) throw tasks.error
  if (checks.error) throw checks.error
  return { tasks: tasks.data as PlanTask[], checks: checks.data as WeekCheck[] }
}
