import { emailLayout } from '@/lib/email/templates'
import type { TaskEmail } from '@/lib/tasks/rules'

const PANEL_URL = 'https://admin.bralto.io'

export interface TaskEmailContext {
  taskId: string
  title: string
  actorName: string
  note?: string
}

function esc(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

const COPY: Record<TaskEmail, { subject: string; heading: string; intro: (actor: string) => string; noteLabel?: string }> = {
  asignada: {
    subject: 'Nueva tarea',
    heading: 'Tenés una tarea nueva',
    intro: (actor) => `${actor} te asignó esta tarea en el panel de Bralto.`,
  },
  en_revision: {
    subject: 'Para revisar',
    heading: 'Una tarea está lista para revisión',
    intro: (actor) => `${actor} la marcó como lista. Revisala y aprobala o devolvela con un comentario.`,
  },
  devuelta: {
    subject: 'Tarea devuelta',
    heading: 'Te devolvieron una tarea',
    intro: (actor) => `${actor} la revisó y pidió cambios.`,
    noteLabel: 'Qué hay que corregir',
  },
  bloqueada: {
    subject: 'Tarea bloqueada',
    heading: 'Una tarea quedó bloqueada',
    intro: (actor) => `${actor} no puede avanzar con esta tarea.`,
    noteLabel: 'Motivo',
  },
}

export function taskEmail(kind: TaskEmail, ctx: TaskEmailContext): { subject: string; html: string } {
  const copy = COPY[kind]
  const note = ctx.note?.trim()
  return {
    subject: `${copy.subject}: ${ctx.title}`,
    html: emailLayout(`
      <h1>${copy.heading}</h1>
      <p>${esc(copy.intro(ctx.actorName))}</p>
      <div class="meta"><b>${esc(ctx.title)}</b></div>
      ${note && copy.noteLabel ? `<p><b>${copy.noteLabel}:</b><br />${esc(note).replace(/\n/g, '<br />')}</p>` : ''}
      <a href="${PANEL_URL}/tareas/${ctx.taskId}" class="btn">Ver tarea →</a>
    `),
  }
}
