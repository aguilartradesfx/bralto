import Anthropic from '@anthropic-ai/sdk'
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod'
import { z } from 'zod'
import { mensajeUsuario, normalizarDecision, sistema } from './reglas.ts'
import { ACCIONES_KNOX, TIPOS_MENSAJE, type ContextoKnox, type DecisionKnox } from './tipos.ts'

// Qué hace Knox con el último mensaje de una conversación: contestar, pasárselo a Ale o quedarse callado.
// `ficha` es lo que Ale aprobó que Knox puede decir (servicios, diagnóstico, guías, sesiones). Vive en la base,
// no en el repo. Lanza un error si Claude no responde; quien llama lo trata como «no contestar».
const SALIDA = z.object({
  tipo: z.enum(TIPOS_MENSAJE),
  accion: z.enum(ACCIONES_KNOX),
  respuesta: z.string().nullable(),
  aviso: z.string().nullable(),
  etiquetas: z.array(z.string()),
  datos: z.object({ nombre: z.string().nullable(), negocio: z.string().nullable(), necesidad: z.string().nullable() }),
  motivo: z.string(),
})

export async function decidir(ctx: ContextoKnox, ficha: string, ahora: Date = new Date()): Promise<DecisionKnox> {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error('falta ANTHROPIC_API_KEY')
  if (!ctx.mensajes.length) throw new Error('la conversación no tiene mensajes')
  const client = new Anthropic({ timeout: 60_000, maxRetries: 1 })
  const respuesta = await client.beta.messages.parse({
    model: 'claude-opus-5-5',
    max_tokens: 8000,
    // Si Claude se niega por error de un filtro, el mismo pedido pasa a otro modelo
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    // Las instrucciones y la ficha casi no cambian: se guardan en caché entre mensajes
    system: [{ type: 'text', text: sistema(ficha), cache_control: { type: 'ephemeral' } }],
    output_config: { effort: 'medium', format: betaZodOutputFormat(SALIDA) },
    messages: [{ role: 'user', content: mensajeUsuario(ctx, ahora) }],
  })
  if (respuesta.stop_reason === 'refusal') throw new Error('Claude no quiso decidir')
  if (!respuesta.parsed_output) throw new Error('la decisión de Claude no se pudo leer')
  return normalizarDecision(respuesta.parsed_output, ficha)
}
