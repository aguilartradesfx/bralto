// SERVER-ONLY — consultas de la sección Tareas (service role; los permisos los aplican las rutas)
import { createServiceClient } from '@/lib/supabase/service'
import { getCurrentSession } from '@/lib/panel-session'
import { hasPermission } from '@/lib/panel-access'
import type { Actor, TaskPriority, TaskStatus, UpdateKind } from '@/lib/tasks/rules'
import type { ChecklistItem } from '@/lib/tasks/draft'

export interface TaskRow {
  id: string
  title: string
  description: string
  checklist: ChecklistItem[]
  priority: TaskPriority
  status: TaskStatus
  assignee_id: string | null
  created_by: string | null
  due_date: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
}

export interface TaskUpdateRow {
  id: string
  task_id: string
  author_id: string | null
  kind: UpdateKind
  body: string
  from_status: TaskStatus | null
  to_status: TaskStatus | null
  created_at: string
}

export interface TeamMember { id: string; name: string; email: string }
export type TaskActor = Actor & { name: string }

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isUuid(value: string): boolean {
  return UUID.test(value)
}

// Usuario actual con acceso a Tareas; null si no tiene sesión o permiso
export async function getTaskActor(): Promise<TaskActor | null> {
  const { user, profile } = await getCurrentSession()
  if (!user || !hasPermission(profile, 'can_view_tasks')) return null
  return { id: user.id, isAdmin: profile?.is_admin === true, name: profile?.full_name || user.email || 'Usuario' }
}

export async function getTask(id: string): Promise<TaskRow | null> {
  if (!isUuid(id)) return null
  const { data } = await createServiceClient().from('tasks').select('*').eq('id', id).maybeSingle()
  return (data as TaskRow | null) ?? null
}

// Personas a las que se les puede asignar tareas
export async function getTeam(): Promise<TeamMember[]> {
  const service = createServiceClient()
  const [{ data: profiles }, usersRes] = await Promise.all([
    service.from('user_profiles').select('id, full_name, is_admin, can_view_tasks'),
    service.auth.admin.listUsers(),
  ])
  const emailById = new Map((usersRes.data?.users ?? []).map((u) => [u.id, u.email ?? '']))
  return (profiles ?? [])
    .filter((p) => p.is_admin || p.can_view_tasks)
    .map((p) => ({ id: p.id, name: p.full_name || emailById.get(p.id) || 'Sin nombre', email: emailById.get(p.id) ?? '' }))
    .sort((a, b) => a.name.localeCompare(b.name, 'es'))
}
