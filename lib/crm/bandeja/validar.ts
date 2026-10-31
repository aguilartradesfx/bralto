// Lo que manda el panel a la bandeja y a Knox, revisado antes de tocar la base o llamar a Claude. Puro, con pruebas.
import { CANALES_KNOX, MODOS_KNOX, type CanalKnox, type ContextoKnox, type MensajeParaKnox, type ModoKnox } from '../../knox/conversar/tipos.ts'
import { textoParaEnviar } from './envio.ts'

export type Resultado<T> = { ok: true; datos: T } | { ok: false; error: string }

const objeto = (e: unknown) => (typeof e === 'object' && e !== null && !Array.isArray(e) ? (e as Record<string, unknown>) : null)

export const MAX_FICHA = 20_000
export const MAX_PRUEBA = 20 // mensajes del chat de prueba
export const MAX_TEXTO_PRUEBA = 1000

// Una clave por envío (la genera el teléfono): letras, números y guiones
const CLAVE = /^[A-Za-z0-9-]{8,80}$/

export function validarEnvio(entrada: unknown): Resultado<{ texto: string; clave: string }> {
  const e = objeto(entrada)
  if (!e) return { ok: false, error: 'Escribe el mensaje' }
  const t = textoParaEnviar(e.texto)
  if (!t.ok) return t
  if (typeof e.clave !== 'string' || !CLAVE.test(e.clave)) return { ok: false, error: 'Vuelve a cargar la página y prueba de nuevo' }
  return { ok: true, datos: { texto: t.texto, clave: e.clave } }
}

export function validarAjustes(entrada: unknown): Resultado<{ modo?: ModoKnox; ficha?: string }> {
  const e = objeto(entrada)
  if (!e) return { ok: false, error: 'No hay nada que cambiar' }
  const datos: { modo?: ModoKnox; ficha?: string } = {}
  if ('modo' in e) {
    if (!(MODOS_KNOX as readonly unknown[]).includes(e.modo)) return { ok: false, error: 'Ese modo no existe' }
    datos.modo = e.modo as ModoKnox
  }
  if ('ficha' in e) {
    if (typeof e.ficha !== 'string') return { ok: false, error: 'La ficha tiene que ser texto' }
    const ficha = e.ficha.replace(/\r\n?/g, '\n').trim()
    if (ficha.length > MAX_FICHA) return { ok: false, error: `La ficha es muy larga (máximo ${MAX_FICHA.toLocaleString('es-CR')} letras)` }
    datos.ficha = ficha
  }
  if (Object.keys(datos).length === 0) return { ok: false, error: 'No hay nada que cambiar' }
  return { ok: true, datos }
}

// «Probar a Knox»: el chat inventado (lo que escribe Ale como si fuera el cliente y lo que Knox ya contestó)
export function validarPrueba(entrada: unknown, ahora: Date): Resultado<{ ctx: ContextoKnox; ficha: string | null }> {
  const e = objeto(entrada)
  if (!e) return { ok: false, error: 'Escribe un mensaje' }
  const canal = (CANALES_KNOX as readonly unknown[]).includes(e.canal) ? (e.canal as CanalKnox) : null
  if (!canal) return { ok: false, error: 'Elige el canal' }
  if (!Array.isArray(e.mensajes) || e.mensajes.length === 0) return { ok: false, error: 'Escribe un mensaje' }
  if (e.mensajes.length > MAX_PRUEBA) return { ok: false, error: `Son muchos mensajes (máximo ${MAX_PRUEBA}). Empieza de nuevo.` }
  const mensajes: MensajeParaKnox[] = []
  const n = e.mensajes.length
  for (const [i, crudo] of e.mensajes.entries()) {
    const m = objeto(crudo)
    const autor = m?.autor === 'knox' ? 'knox' : m?.autor === 'persona' ? 'persona' : null
    const texto = typeof m?.texto === 'string' ? m.texto.replace(/\r\n?/g, '\n').trim() : ''
    if (!autor || !texto) return { ok: false, error: 'Hay un mensaje vacío' }
    if (texto.length > MAX_TEXTO_PRUEBA) return { ok: false, error: 'Un mensaje es muy largo' }
    // Uno por minuto, el último ahora: así Knox ve una conversación de hoy
    mensajes.push({ autor, texto, adjunto: null, en: new Date(ahora.getTime() - (n - 1 - i) * 60_000).toISOString() })
  }
  if (mensajes[mensajes.length - 1].autor !== 'persona') return { ok: false, error: 'El último mensaje tiene que ser del cliente' }
  let ficha: string | null = null
  if (e.ficha !== undefined && e.ficha !== null) {
    if (typeof e.ficha !== 'string' || e.ficha.length > MAX_FICHA) return { ok: false, error: 'La ficha no se entiende' }
    ficha = e.ficha
  }
  const nombre = typeof e.nombre === 'string' && e.nombre.trim() ? e.nombre.trim().slice(0, 60) : 'Cliente de prueba'
  return { ok: true, datos: { ctx: { canal, nombre, usuario: null, contacto: null, mensajes }, ficha } }
}
