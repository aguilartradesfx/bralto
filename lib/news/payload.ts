import { z } from 'zod'

// Forma de los pedidos que manda n8n. Las reglas de contenido están en rules.ts.
const draft = z.object({ titulo: z.string(), resumen: z.string(), cuerpo: z.string(), imagen_alt: z.string() })
const source = { fuente_url: z.string(), fuente_nombre: z.string(), fuente_texto: z.string() }

const publishSchema = z.object({
  es: draft,
  en: draft,
  ...source,
  imagen_base64: z.string().min(1),
  estado: z.enum(['publicada', 'oculta']),
})
const validateSchema = z.object({ idioma: z.enum(['es', 'en']), borrador: draft, ...source })

export type PublishInput = z.infer<typeof publishSchema>
export type ValidateInput = z.infer<typeof validateSchema>
type Parsed<T> = { ok: true; value: T } | { ok: false; problems: string[] }

function parse<T>(schema: z.ZodType<T>, body: unknown): Parsed<T> {
  const r = schema.safeParse(body)
  if (r.success) return { ok: true, value: r.data }
  return { ok: false, problems: r.error.issues.map((i) => `${i.path.join('.') || 'pedido'}: ${i.message}`) }
}

export const parsePublish = (body: unknown) => parse(publishSchema, body)
export const parseValidate = (body: unknown) => parse(validateSchema, body)

export function decodeImage(b64: string): Buffer {
  return Buffer.from(b64.replace(/^data:[^;]+;base64,/, ''), 'base64')
}
