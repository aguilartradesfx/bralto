// SERVER-ONLY — helpers comunes de las rutas /api/plan-q4
import { NextResponse } from 'next/server'
import { requireApiPermission } from '@/lib/panel-session'
import { getPlanActor } from '@/lib/plan-q4/data'
import type { Persona } from '@/lib/plan-q4/types'

export function jsonError(error: string, status: number) {
  return NextResponse.json({ error }, { status })
}

// Permiso de la sección + ser del equipo del plan (cada cambio queda firmado con su slug)
export async function requirePlanMember(): Promise<{ slug: Persona; denied: null } | { slug: null; denied: NextResponse }> {
  const { denied } = await requireApiPermission('can_view_plan')
  if (denied) return { slug: null, denied }
  const actor = await getPlanActor()
  if (!actor?.slug) return { slug: null, denied: jsonError('Solo el equipo del plan puede editar tareas', 403) }
  return { slug: actor.slug, denied: null }
}

export async function readJson(request: Request): Promise<unknown> {
  return request.json().catch(() => null)
}
