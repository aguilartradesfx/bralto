import Anthropic from '@anthropic-ai/sdk'
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod'
import { z } from 'zod'
import { TASK_PRIORITIES } from './rules.ts'
import { normalizeDraft, type TaskDraft } from './draft.ts'

const TaskDraftSchema = z.object({
  title: z.string(),
  description: z.string(),
  checklist: z.array(z.string()),
  priority: z.enum(TASK_PRIORITIES),
})

const SYSTEM = `Redactás las tareas internas de Bralto, una agencia de marketing digital y automatización en Costa Rica (sitios web, CRM y automatizaciones en GoHighLevel, campañas en Meta y Google, producción de contenido, agentes de IA para WhatsApp, SEO).

Recibís una idea escrita a la carrera por el director y la convertís en una tarea que un colaborador pueda ejecutar sin tener que preguntar.

- title: verbo en infinitivo + objeto concreto, idealmente menos de 80 caracteres.
- description: 2 a 5 oraciones con qué hay que hacer, para qué o para quién, y todo dato que venga en la idea (cliente, fechas, medidas, enlaces). No inventes datos; si falta algo necesario para ejecutarla, cerrá con una línea "Por confirmar: …".
- checklist: 3 a 7 criterios verificables que, cumplidos todos, significan que la tarea está terminada. Cada uno debe poder comprobarse mirando el resultado.
- priority: "urgente" solo si es para hoy o mañana o hay un cliente bloqueado; "alta" si hay fecha cercana o impacto directo en un cliente; "baja" si es una mejora interna sin fecha; "normal" en otro caso.

Escribí en español neutro, claro y sin relleno.`

export class TaskDraftRefusedError extends Error {}

export async function formulateTask(idea: string, client = new Anthropic()): Promise<TaskDraft> {
  const response = await client.beta.messages.parse({
    model: 'claude-opus-5-5',
    max_tokens: 8000,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    output_config: { effort: 'low', format: betaZodOutputFormat(TaskDraftSchema) },
    system: SYSTEM,
    messages: [{ role: 'user', content: idea }],
  })
  if (response.stop_reason === 'refusal') throw new TaskDraftRefusedError('La IA no pudo formular esta tarea.')
  if (!response.parsed_output) throw new Error('La IA no devolvió un borrador válido.')
  return normalizeDraft(response.parsed_output)
}
