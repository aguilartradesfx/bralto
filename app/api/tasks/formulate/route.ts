import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getCurrentSession, requireApiPermission } from '@/lib/panel-session'
import { formulateTask, TaskDraftRefusedError } from '@/lib/tasks/formulate'

export const maxDuration = 60

// Convierte una idea suelta en un borrador de tarea (no guarda nada)
export async function POST(request: Request) {
  const { denied } = await requireApiPermission('can_view_tasks')
  if (denied) return denied
  const { profile } = await getCurrentSession()
  if (!profile?.is_admin) return NextResponse.json({ error: 'Solo un admin puede crear tareas' }, { status: 403 })

  const body = await request.json().catch(() => null)
  const idea = typeof body?.idea === 'string' ? body.idea.trim() : ''
  if (idea.length < 3 || idea.length > 4000) {
    return NextResponse.json({ error: 'Escribí la idea (entre 3 y 4000 caracteres)' }, { status: 400 })
  }

  try {
    const draft = await formulateTask(idea)
    return NextResponse.json({ draft })
  } catch (err) {
    if (err instanceof TaskDraftRefusedError) {
      return NextResponse.json({ error: err.message }, { status: 422 })
    }
    if (err instanceof Anthropic.APIError) {
      console.error('[tasks/formulate]', err.status, err.message)
      return NextResponse.json(
        { error: 'La IA no respondió. Probá de nuevo o escribí la tarea a mano.' },
        { status: 502 },
      )
    }
    throw err
  }
}
