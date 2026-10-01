import { z } from 'zod'
import { TASK_PRIORITIES, type TaskPriority } from './rules.ts'

export interface ChecklistItem { text: string; done: boolean }

const MAX_CHECKLIST = 12

// Acepta textos sueltos u objetos {text, done}; recorta y descarta vacíos
export function normalizeChecklist(items: unknown): ChecklistItem[] {
  if (!Array.isArray(items)) return []
  const out: ChecklistItem[] = []
  for (const item of items) {
    if (typeof item === 'string') {
      if (item.trim()) out.push({ text: item.trim(), done: false })
    } else if (item && typeof item === 'object' && typeof (item as ChecklistItem).text === 'string') {
      const text = (item as ChecklistItem).text.trim()
      if (text) out.push({ text, done: (item as ChecklistItem).done === true })
    }
  }
  return out.slice(0, MAX_CHECKLIST)
}

export interface TaskDraft {
  title: string
  description: string
  checklist: string[]
  priority: TaskPriority
}

// Lo que devuelve la IA, recortado a límites razonables para el formulario
export function normalizeDraft(raw: TaskDraft): TaskDraft {
  return {
    title: raw.title.trim().slice(0, 120),
    description: raw.description.trim(),
    checklist: raw.checklist.map((c) => c.trim()).filter(Boolean).slice(0, 10),
    priority: raw.priority,
  }
}

const taskFields = {
  title: z.string().trim().min(1, 'El título es obligatorio').max(200, 'El título es demasiado largo'),
  description: z.string().max(10000, 'La descripción es demasiado larga'),
  checklist: z.array(z.union([z.string(), z.object({ text: z.string(), done: z.boolean().optional() })])).max(30),
  priority: z.enum(TASK_PRIORITIES, { message: 'Prioridad inválida' }),
  assignee_id: z.uuid({ message: 'Responsable inválido' }).nullable(),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida (AAAA-MM-DD)').nullable(),
}

export const TaskInputSchema = z.object({
  ...taskFields,
  description: taskFields.description.default(''),
  checklist: taskFields.checklist.default([]),
})

// Sin defaults: en Zod 4 un default dentro de .partial() rellenaría campos que el PATCH no envió
export const TaskPatchSchema = z.object(taskFields).partial()

export type TaskInput = z.infer<typeof TaskInputSchema>
