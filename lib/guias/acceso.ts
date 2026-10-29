import { createHash, createHmac, timingSafeEqual } from 'node:crypto'

// La cookie que abre todas las guías en ese navegador: el id del contacto más un HMAC.
// Si alguien la altera o viene de otro secreto, la guía se muestra cerrada.
export const COOKIE_GUIAS = 'bralto_guias'
export const DURACION_ACCESO = 60 * 60 * 24 * 365 // un año, en segundos

// GUIAS_SECRET si existe; si no, uno derivado de la service role, que ya está en Vercel
export function secretoGuias(env: Record<string, string | undefined>): string {
  if (env.GUIAS_SECRET) return env.GUIAS_SECRET
  if (!env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('Falta GUIAS_SECRET o SUPABASE_SERVICE_ROLE_KEY')
  return createHash('sha256').update(`bralto-guias:${env.SUPABASE_SERVICE_ROLE_KEY}`).digest('base64url')
}

const firma = (secreto: string, contactoId: string) =>
  createHmac('sha256', secreto).update(`guias:${contactoId}`).digest('base64url')

export function firmarAcceso(secreto: string, contactoId: string): string {
  return `${contactoId}.${firma(secreto, contactoId)}`
}

export function leerAcceso(secreto: string, valor: string | undefined): string | null {
  if (!secreto || !valor) return null
  const punto = valor.lastIndexOf('.')
  if (punto <= 0) return null
  const id = valor.slice(0, punto)
  const want = Buffer.from(firma(secreto, id))
  const got = Buffer.from(valor.slice(punto + 1))
  return want.length === got.length && timingSafeEqual(want, got) ? id : null
}
