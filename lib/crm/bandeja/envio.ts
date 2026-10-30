// Antes de contestar por Zernio: si todavía se puede (la ventana de 24 horas de Meta) y, si no salió, el porqué en
// palabras simples. Puro, con pruebas (envio.test.ts).
import type { CanalKnox } from '../../knox/conversar/tipos.ts'
import type { ResultadoEnvio } from '../../zernio/cliente.ts'

export const HORA_MS = 3600_000
export const VENTANA_MS = 24 * HORA_MS // WhatsApp y lo automático: solo dentro de las 24 h del último mensaje de la persona
export const VENTANA_HUMANA_MS = 7 * 24 * HORA_MS // Instagram y Messenger, lo que escribe Ale: hasta 7 días con la etiqueta de Meta
export const MAX_TEXTO = 2000

export const FUERA_DE_VENTANA = 'Pasaron más de 24 horas desde su último mensaje: contéstale desde la app.'
export const FUERA_DE_SIETE_DIAS = 'Pasaron más de 7 días desde su último mensaje: contéstale desde la app.'

export type PlanEnvio = { ok: true; etiquetaHumana: boolean } | { ok: false; error: string }

// autor 'ale': Ale escribió en el panel. 'knox': Knox (solo o con el «Enviar» de Ale a su borrador)
export function planEnvio(canal: CanalKnox, autor: 'ale' | 'knox', ultimoEntranteEn: string | null, ahora: Date): PlanEnvio {
  // Si no está guardado cuándo escribió la persona, Ale lo intenta igual (Zernio dice si no se puede); Knox no
  if (!ultimoEntranteEn) return autor === 'ale' ? { ok: true, etiquetaHumana: false } : { ok: false, error: FUERA_DE_VENTANA }
  const pasado = ahora.getTime() - Date.parse(ultimoEntranteEn)
  if (pasado <= VENTANA_MS) return { ok: true, etiquetaHumana: false }
  if (autor === 'knox') return { ok: false, error: FUERA_DE_VENTANA }
  if (canal === 'whatsapp') return { ok: false, error: FUERA_DE_VENTANA }
  if (pasado <= VENTANA_HUMANA_MS) return { ok: true, etiquetaHumana: true }
  return { ok: false, error: FUERA_DE_SIETE_DIAS }
}

// Los códigos de Meta cuando se pasó la ventana: Messenger (10 / 2018278), Instagram (10 / 2534022) y WhatsApp (131047)
const SUBCODIGOS_VENTANA = new Set([2018278, 2534022])
const CODIGOS_VENTANA = new Set([131047])

// Con la etiqueta de Meta (más de 24 h) también puede rebotar: el mensaje es el mismo, contestar desde la app
export function errorDeEnvio(r: Extract<ResultadoEnvio, { ok: false }>): string {
  const ventana =
    (r.subcodigoRed !== null && SUBCODIGOS_VENTANA.has(r.subcodigoRed)) ||
    (r.codigoRed !== null && CODIGOS_VENTANA.has(r.codigoRed)) ||
    /24.?h|window|ventana|outside of allowed/i.test(r.detalle) ||
    (r.status === 403 && r.codigo === 'platform_api_error')
  if (ventana) return FUERA_DE_VENTANA
  if (r.status === 0) return 'No hubo conexión con Zernio. Prueba de nuevo.'
  if (r.status === 401) return 'Zernio no aceptó la clave del panel. Revisa ZERNIO_API_KEY.'
  if (r.status === 429) return 'Zernio pidió esperar un poco. Prueba de nuevo en un minuto.'
  if (r.status === 409) return 'Ese mensaje ya se está mandando. Espera un momento.'
  if (r.codigoRed === 131056) return 'Le mandaste muchos mensajes seguidos. Espera un minuto.'
  if (r.status >= 500) return 'Zernio no lo pudo mandar ahora. Prueba de nuevo en un rato.'
  return 'No se pudo mandar. Prueba de nuevo o contéstale desde la app.'
}

// El texto para mandar: sin espacios de más y con un máximo
export function textoParaEnviar(entrada: unknown): { ok: true; texto: string } | { ok: false; error: string } {
  const t = typeof entrada === 'string' ? entrada.replace(/\r\n?/g, '\n').trim() : ''
  if (!t) return { ok: false, error: 'Escribe el mensaje' }
  if (t.length > MAX_TEXTO) return { ok: false, error: `El mensaje es muy largo (máximo ${MAX_TEXTO} letras)` }
  return { ok: true, texto: t }
}
