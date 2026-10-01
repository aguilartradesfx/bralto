// SERVER-ONLY — helpers comunes de las rutas /api/tasks
import { NextResponse } from 'next/server'
import { requireApiPermission } from '@/lib/panel-session'
import { getTaskActor, type TaskActor } from '@/lib/tasks/data'

export function jsonError(error: string, status: number) {
  return NextResponse.json({ error }, { status })
}

export async function requireTaskActor(): Promise<{ actor: TaskActor; denied: null } | { actor: null; denied: NextResponse }> {
  const { denied } = await requireApiPermission('can_view_tasks')
  if (denied) return { actor: null, denied }
  const actor = await getTaskActor()
  if (!actor) return { actor: null, denied: jsonError('Sin permisos', 403) }
  return { actor, denied: null }
}

export async function readJson(request: Request): Promise<Record<string, unknown> | null> {
  const body = await request.json().catch(() => null)
  return body && typeof body === 'object' && !Array.isArray(body) ? (body as Record<string, unknown>) : null
}
