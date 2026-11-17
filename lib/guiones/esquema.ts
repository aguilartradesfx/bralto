// El guion que escribe la noche (publicaciones/<AAAA-MM-DD>/guion/guion.json), revisado con zod. Lo mal hecho se
// rechaza diciendo qué falta y dónde («Línea 3: …», «Gancho 2: …»), para que el comando de la noche lo explique.
import { z } from 'zod'
import { GANCHOS_POR_GUION, type Guion } from './tipos.ts'

const MAX_LINEAS = 80
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

const falta = (campo: string, extra = '') => `falta «${campo}»${extra}`

// Texto obligatorio: sin espacios a los lados y no vacío
function texto(campo: string, max: number) {
  return z
    .string({ error: (iss) => (iss.input == null ? falta(campo) : `«${campo}» tiene que ser texto`) })
    .trim()
    .min(1, { error: `«${campo}» está vacío` })
    .max(max, { error: `«${campo}» es muy largo (más de ${max} letras)` })
}

// Texto opcional: si no viene (o viene null) queda vacío
function textoOpcional(campo: string, max: number) {
  return z
    .string({ error: `«${campo}» tiene que ser texto` })
    .trim()
    .max(max, { error: `«${campo}» es muy largo (más de ${max} letras)` })
    .nullish()
    .transform((s) => s ?? '')
}

const vista = z.preprocess(
  (v) => (typeof v === 'string' ? v.trim().toLowerCase() : v),
  z.enum(['usted', 'mitad', 'motion'], {
    error: (iss) =>
      iss.input == null
        ? falta('vista', ' (usted, mitad o motion)')
        : `«vista» tiene que ser usted, mitad o motion (vino «${String(iss.input).slice(0, 30)}»)`,
  }),
)

const linea = z.object(
  { vista, dice: texto('dice', 800), pantalla: textoOpcional('pantalla', 400) },
  { error: 'tiene que ser un objeto con «vista» y «dice»' },
)

const gancho = z.object(
  {
    tipo: z
      .string({ error: (iss) => (iss.input == null ? falta('tipo') : '«tipo» tiene que ser texto') })
      .trim()
      .toLowerCase()
      .min(1, { error: '«tipo» está vacío' })
      .max(40, { error: '«tipo» es muy largo (más de 40 letras)' }),
    dice: texto('dice', 400),
  },
  { error: 'tiene que ser un objeto con «tipo» y «dice»' },
)

const cuantos = (v: unknown) => (Array.isArray(v) ? v.length : '?')

const GuionSchema = z.object(
  {
    titulo: texto('titulo', 160),
    tema: textoOpcional('tema', 400),
    // «Comenta «créditos»» → CREDITOS
    comenta: z
      .string({ error: '«comenta» tiene que ser texto' })
      .nullish()
      .transform((s) => {
        const limpio = (s ?? '')
          .trim()
          .replace(/^comenta\s+/i, '')
          .replace(/^["'«“‘]+|["'»”’]+$/g, '')
          .trim()
          .toUpperCase()
        return limpio || null
      })
      .refine((s) => s === null || s.length <= 40, { error: '«comenta» es muy largo (más de 40 letras)' }),
    guia: z
      .string({ error: '«guia» tiene que ser texto' })
      .trim()
      .nullish()
      .transform((s) => s || null)
      .refine((s) => s === null || SLUG.test(s), { error: '«guia» tiene que ser el nombre corto de la guía (minúsculas, números y guiones)' }),
    duracion_s: z
      .number({ error: '«duracion_s» tiene que ser un número de segundos' })
      .gt(0, { error: '«duracion_s» tiene que ser más de 0 segundos' })
      .max(600, { error: '«duracion_s» no puede pasar de 600 segundos (10 minutos)' })
      .transform((n) => Math.max(1, Math.round(n)))
      .nullish()
      .transform((n) => n ?? null),
    lineas: z
      .array(linea, { error: (iss) => (iss.input == null ? falta('lineas') : '«lineas» tiene que ser una lista') })
      .min(1, { error: '«lineas» está vacía: el guion necesita al menos una línea' })
      .max(MAX_LINEAS, { error: (iss) => `«lineas» trae demasiadas (${cuantos(iss.input)}): lo máximo es ${MAX_LINEAS}` }),
    ganchos: z
      .array(gancho, { error: (iss) => (iss.input == null ? falta('ganchos') : '«ganchos» tiene que ser una lista') })
      .length(GANCHOS_POR_GUION, { error: (iss) => `tienen que ser ${GANCHOS_POR_GUION} ganchos (vinieron ${cuantos(iss.input)})` }),
  },
  { error: 'El guion tiene que ser un objeto JSON, con { … }' },
)

// «Línea 3: …» y «Gancho 2: …» dicen dónde; lo de arriba va con mayúscula
function mensaje(issue: { path: PropertyKey[]; message: string }): string {
  const [raiz, i] = issue.path
  const donde = typeof i === 'number' ? (raiz === 'lineas' ? `Línea ${i + 1}: ` : raiz === 'ganchos' ? `Gancho ${i + 1}: ` : '') : ''
  return donde ? donde + issue.message : issue.message.charAt(0).toUpperCase() + issue.message.slice(1)
}

export type GuionLeido = { ok: true; guion: Guion } | { ok: false; errores: string[] }

export function leerGuion(json: unknown): GuionLeido {
  const r = GuionSchema.safeParse(json)
  if (r.success) return { ok: true, guion: r.data }
  return { ok: false, errores: [...new Set(r.error.issues.map(mensaje))] }
}
