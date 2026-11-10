// Lo que Gemini saca de un video que pegó: de qué trata, por qué pegó y una versión propia para Bralto.
import { z } from 'zod'
import { formatoNumero, formatoVeces } from './metricas.ts'
import type { Red } from './enlaces.ts'

export type Formato = 'a_camara' | 'voz_en_off' | 'pantalla' | 'texto' | 'mixto'

export const FORMATO_LABEL: Record<Formato, string> = {
  a_camara: 'Alguien hablando a cámara',
  voz_en_off: 'Voz en off con imágenes',
  pantalla: 'Grabación de pantalla',
  texto: 'Texto en pantalla',
  mixto: 'Mixto',
}

export type Analisis = {
  tema: string
  formato: Formato
  gancho: { texto: string; por_que: string }
  partes: string[]
  por_que_pego: string[]
  por_que_guardan: string
  herramientas: string[]
  de_tu_tema: number // 0-10: qué tan de IA para negocios es
  tu_version: {
    titulo: string
    idea: string
    ganchos: string[] // 3
    guion: string[]
    comenta: string | null // la palabra del «Comenta X»
  }
}

// Gemini a veces deja en null o vacío lo que no aplica: se toma como vacío y se quitan los elementos nulos
const textoReq = z.string().trim().min(1)
const texto = z
  .string()
  .nullable()
  .optional()
  .transform((s) => s?.trim() ?? '')
const textos = z
  .array(z.string().nullable())
  .default([])
  .transform((xs) => xs.map((x) => x?.trim() ?? '').filter(Boolean))

const AnalisisSchema = z.object({
  tema: textoReq,
  formato: z.enum(['a_camara', 'voz_en_off', 'pantalla', 'texto', 'mixto']).catch('mixto'),
  gancho: z.object({ texto, por_que: texto }),
  partes: textos.transform((xs) => xs.slice(0, 8)),
  por_que_pego: textos.refine((xs) => xs.length > 0, 'sin razones').transform((xs) => xs.slice(0, 5)),
  por_que_guardan: texto,
  herramientas: textos,
  de_tu_tema: z.coerce.number().min(0).max(10),
  tu_version: z.object({
    titulo: textoReq,
    idea: textoReq,
    ganchos: textos.refine((xs) => xs.length > 0, 'sin ganchos').transform((xs) => xs.slice(0, 3)),
    // El cierre «Comenta X» va en su propia línea: si Gemini lo repite al final del guion, se quita
    guion: textos
      .transform((xs) => (xs.length > 1 && /^comenta\b/i.test(xs[xs.length - 1]) ? xs.slice(0, -1) : xs))
      .refine((xs) => xs.length > 0, 'sin guion')
      .transform((xs) => xs.slice(0, 10)),
    comenta: z
      .string()
      .nullable()
      .optional()
      .transform((s) => s?.trim().replace(/^comenta\s+/i, '').toUpperCase() || null),
  }),
})

export function leerAnalisis(json: unknown): Analisis {
  const r = AnalisisSchema.safeParse(json)
  if (!r.success) {
    const p = r.error.issues[0]
    throw new Error(`El análisis no vino completo${p ? ` (${p.path.join('.')}: ${p.message})` : ''}`)
  }
  return r.data
}

export type ContextoIdea = {
  red: Red
  tipo: 'video' | 'fotos'
  texto: string // lo que escribió el creador (recortado), para entender el tema
  vistas: number | null
  vecesSuPublico: number | null
  vecesLoNormal: number | null
  compartidos: number | null
  guardados: number | null
  soloImagen: boolean // el video no se pudo mandar: Gemini ve solo la portada
}

const MAX_TEXTO = 1200

function numeros(c: ContextoIdea): string {
  const d: string[] = []
  if (c.vistas !== null) d.push(`${formatoNumero(c.vistas)} vistas`)
  if (c.vecesSuPublico !== null) d.push(`${formatoVeces(c.vecesSuPublico)} su público (vistas ÷ seguidores)`)
  if (c.vecesLoNormal !== null) d.push(`${formatoVeces(c.vecesLoNormal)} lo normal de la cuenta (en me gusta)`)
  if (c.guardados !== null) d.push(`${formatoNumero(c.guardados)} guardados`)
  if (c.compartidos !== null) d.push(`${formatoNumero(c.compartidos)} compartidos`)
  return d.length ? d.join(', ') : 'sin números'
}

export function promptIdea(c: ContextoIdea): string {
  const red = c.red === 'instagram' ? 'Instagram' : 'TikTok'
  const que = c.tipo === 'video' ? 'video' : 'post de fotos'
  return [
    `Eres el editor de contenido de Bralto, una agencia de IA y automatización para dueños de negocio pequeño en Costa Rica y Latinoamérica.`,
    `Este ${que} de ${red} pegó: ${numeros(c)}.`,
    c.soloImagen
      ? 'El video no se pudo mandar: ves solo la portada y el texto. Dilo con cuidado y no inventes lo que no ves.'
      : 'Mira todo: lo que se ve, lo que se dice y el texto en pantalla, sobre todo los primeros 3 segundos.',
    `Texto que escribió el creador (solo para entender el tema): ${JSON.stringify(c.texto.slice(0, MAX_TEXTO))}.`,
    '',
    'Responde SOLO un JSON con:',
    '- tema: de qué trata, en una frase.',
    '- formato: "a_camara" (alguien hablando a cámara), "voz_en_off" (voz con imágenes o animación), "pantalla" (grabación de pantalla), "texto" (solo texto en pantalla) o "mixto".',
    '- gancho: { texto: lo que dice o muestra en los primeros 3 segundos, traducido al español si viene en otro idioma; por_que: por qué hace que la gente se quede }.',
    '- Todo lo que escribas va en español, aunque el video esté en otro idioma.',
    '- partes: la estructura del video, en pasos cortos (máximo 8).',
    '- por_que_pego: de 2 a 4 razones cortas de por qué le fue tan bien.',
    '- por_que_guardan: por qué la gente lo guarda o lo comparte, en una frase.',
    '- herramientas: nombres exactos de herramientas, apps o funciones que menciona ([] si ninguna).',
    '- de_tu_tema: de 0 a 10, qué tan cerca está de IA, automatización, ventas o marketing para negocios.',
    '- tu_version: la versión de Bralto, con { titulo (corto), idea (la idea central en una frase), ganchos (exactamente 3, distintos entre sí: una pregunta, una sorpresa y una advertencia), guion (de 4 a 7 líneas cortas, lo que se dice en orden, de 30 a 40 segundos en total, sin el cierre del «Comenta», que va aparte), comenta (una palabra en español, en mayúsculas, para cerrar con «Comenta PALABRA» y mandar una guía; que no salga sola en un comentario normal: no WEB, VISTO ni WHATSAPP; sí algo como REVIVE u OFICINA) }.',
    '',
    'Reglas para tu_version:',
    '- Toma la idea y la estructura que funcionaron, pero nunca copies frases del original: escríbelo con palabras nuevas.',
    '- Llévalo a dueños de negocio (si el video es de otro tema, adapta el formato a IA para negocios).',
    '- Español de Costa Rica, de tú (tú abres, tú pones), nunca de vos. Se vale «mae» o «diay»; nunca «pana», «tantito», «chévere» ni otros modismos de afuera.',
    '- Que lo entienda un niño de 5 y un señor de 50: frases cortas, sin palabras técnicas sin explicar y sin cifras enredadas.',
    '- No nombres al creador ni su marca, ni lo enlaces.',
    '- Todo en español.',
  ].join('\n')
}

// Por si acaso: quita de la versión propia el @ o el nombre de la cuenta original
export function sinElCreador(a: Analisis, cuenta: string | null): Analisis {
  const nombre = cuenta?.replace(/^@/, '').trim()
  if (!nombre || nombre.length < 3) return a
  const escapado = nombre.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const re = new RegExp(`@?${escapado}`, 'gi')
  const limpiar = (s: string) =>
    s
      .replace(re, '')
      .replace(/\s+([,.;:!?])/g, '$1')
      .replace(/\s{2,}/g, ' ')
      .trim()
  const v = a.tu_version
  // La marca del creador (soymarcax → Marcax) tampoco pasa como herramienta: Knox la usaría en el reel
  const plano = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')
  const cuentaPlana = plano(nombre)
  const esSuMarca = (h: string) => plano(h).length >= 4 && (cuentaPlana.includes(plano(h)) || plano(h).includes(cuentaPlana))
  return {
    ...a,
    herramientas: a.herramientas.filter((h) => !esSuMarca(h)),
    tu_version: {
      ...v,
      titulo: limpiar(v.titulo),
      idea: limpiar(v.idea),
      ganchos: v.ganchos.map(limpiar),
      guion: v.guion.map(limpiar),
    },
  }
}
