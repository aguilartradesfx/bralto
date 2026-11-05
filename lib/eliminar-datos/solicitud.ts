import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'
import { z } from 'zod'
import { limpiarNombre, limpiarWhatsapp } from '../guias/campos.ts'

// Solicitudes para borrar datos (bralto.io/eliminar-datos): las del formulario de la página y las que
// manda Meta cuando alguien quita la app desde Facebook («data deletion callback»). Aquí va solo la
// lógica, con pruebas; las conexiones reales están en servidor.ts.

// Sin 0, 1, I ni O: la persona lo copia a mano
const LETRAS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
export const CODIGO = /^BR-[A-HJ-NP-Z2-9]{8}$/

export function generarCodigo(): string {
  const bytes = randomBytes(8)
  return `BR-${Array.from(bytes, (b) => LETRAS[b % LETRAS.length]).join('')}`
}

export function leerCodigo(v: string | null | undefined): string | null {
  const c = (v ?? '').trim().toUpperCase()
  return CODIGO.test(c) ? c : null
}

// signed_request de Meta: «firma.carga», las dos en base64url; la firma es HMAC-SHA256 de la carga con la
// clave secreta de la app. Devuelve null si algo no cuadra: no se registra nada que no venga de Meta.
export function leerSignedRequest(signed: string, secreto: string): { userId: string } | null {
  if (!secreto) return null
  const partes = signed.split('.')
  if (partes.length !== 2 || !partes[0] || !partes[1]) return null
  const [firma, carga] = partes
  const esperada = createHmac('sha256', secreto).update(carga).digest()
  const recibida = Buffer.from(firma, 'base64url')
  if (recibida.length !== esperada.length || !timingSafeEqual(recibida, esperada)) return null
  try {
    const datos = JSON.parse(Buffer.from(carga, 'base64url').toString('utf8'))
    if (String(datos?.algorithm).toUpperCase() !== 'HMAC-SHA256') return null
    const userId = datos?.user_id
    return typeof userId === 'string' && /^\d{1,32}$/.test(userId) ? { userId } : null
  } catch {
    return null
  }
}

// Lo que Meta espera de vuelta: dónde ver el estado y el código de confirmación
export function respuestaMeta(codigo: string, sitio: string): { url: string; confirmation_code: string } {
  return { url: `${sitio}/es/eliminar-datos?codigo=${encodeURIComponent(codigo)}`, confirmation_code: codigo }
}

export { esAvisoDeMeta } from './ruta.ts'

export type CampoSolicitud = 'nombre' | 'contacto' | 'detalle'
export type DatosSolicitud = { nombre: string; contacto: string; cuenta: string | null; detalle: string | null }

// La página habla de usted, como la política de privacidad
export const MENSAJES_SOLICITUD: Record<CampoSolicitud, string> = {
  nombre: 'Escriba su nombre.',
  contacto: 'Escriba un correo o un WhatsApp con el código de país (por ejemplo, +506 8888 8888).',
  detalle: 'El detalle es muy largo: resúmalo en menos de 1,000 letras.',
}

const CORREO = z.email().max(254)
const texto = (v: unknown) => (typeof v === 'string' ? v.trim() : '')
const unaLinea = (v: string) => v.replace(/\s+/g, ' ').trim()

export function validarSolicitud(
  input: Record<string, unknown>,
): { ok: true; datos: DatosSolicitud; bot: boolean } | { ok: false; errores: Partial<Record<CampoSolicitud, string>> } {
  const errores: Partial<Record<CampoSolicitud, string>> = {}

  const nombre = limpiarNombre(texto(input.nombre)).slice(0, 80)
  if ((nombre.match(/\p{L}/gu) ?? []).length < 2) errores.nombre = MENSAJES_SOLICITUD.nombre

  const crudo = texto(input.contacto)
  const correo = crudo.toLowerCase()
  const contacto = CORREO.safeParse(correo).success ? correo : limpiarWhatsapp(crudo)
  if (!contacto) errores.contacto = MENSAJES_SOLICITUD.contacto

  const detalle = texto(input.detalle)
  if (detalle.length > 1000) errores.detalle = MENSAJES_SOLICITUD.detalle

  if (Object.keys(errores).length || !contacto) return { ok: false, errores }
  const cuenta = unaLinea(texto(input.cuenta)).slice(0, 80)
  return {
    ok: true,
    datos: { nombre, contacto, cuenta: cuenta || null, detalle: detalle || null },
    // «sitio» es un campo escondido: una persona nunca lo llena, un bot sí
    bot: texto(input.sitio) !== '',
  }
}

export type Solicitud = { codigo: string; origen: 'formulario' | 'meta'; metaUsuario?: string } & Partial<DatosSolicitud>

export function textoAviso(s: Solicitud): string {
  if (s.origen === 'meta') {
    return [
      `🗑️ Solicitud para borrar datos ${s.codigo} (desde Meta: alguien quitó la app en Facebook)`,
      `Id de la persona en la app: ${s.metaUsuario}`,
      'Hay que borrar lo de esa cuenta en 30 días como máximo.',
    ].join('\n')
  }
  return [
    `🗑️ Solicitud para borrar datos ${s.codigo} (desde el formulario de bralto.io)`,
    `Nombre: ${unaLinea(s.nombre ?? '')}`,
    `Contacto: ${s.contacto}`,
    s.cuenta ? `Cuenta: ${unaLinea(s.cuenta)}` : null,
    s.detalle ? `Detalle: ${unaLinea(s.detalle).slice(0, 300)}` : null,
    'Hay que borrar sus datos en 30 días como máximo.',
  ]
    .filter(Boolean)
    .join('\n')
}
