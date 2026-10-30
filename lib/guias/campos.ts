// Las reglas de cada dato del registro, sin zod: las usa el servidor (lib/guias/registro.ts) y también
// la ventana del candado en el navegador, que pide los datos en tres pasos y revisa cada uno antes de
// pasar al siguiente. El WhatsApp con su país se arma en lib/guias/paises.ts; el correo lo revisa
// solo el servidor (es el último paso). Los mensajes tutean: así habla la ventana (pedido de Alejandro).

export type Campo = 'nombre' | 'correo' | 'whatsapp' | 'acepta'
export type Paso = 1 | 2 | 3

export const MENSAJES: Record<Campo, string> = {
  nombre: 'Escribe tu nombre y apellido.',
  correo: 'Revisa tu correo: parece que le falta algo.',
  whatsapp: 'Revisa tu número de WhatsApp: parece que no está completo.',
  acepta: 'Para abrir la guía, acepta la política de privacidad.',
}

// Una sola línea: así no se cuelan renglones en el aviso de Telegram
export function limpiarNombre(v: string): string {
  return v.trim().replace(/\s+/g, ' ')
}

// Nombre y apellido: al menos dos palabras de dos letras o más («Alejandro» solo, o con una inicial,
// no alcanza). Dos nombres sin apellido («Ana María») no se pueden distinguir y pasan.
export function nombreValido(nombre: string): boolean {
  if (nombre.length > 80) return false
  const palabras = nombre.split(' ').filter((p) => (p.match(/\p{L}/gu) ?? []).length >= 2)
  return palabras.length >= 2
}

export function errorDelNombre(valor: string): string | null {
  return nombreValido(limpiarNombre(valor)) ? null : MENSAJES.nombre
}

// Con código de país («+» o «00» al inicio) y sin espacios, guiones, paréntesis ni puntos.
// Siempre se guarda con «+»: así el enlace wa.me del aviso funciona y no hay dos formatos.
export function limpiarWhatsapp(v: string): string | null {
  let s = v.trim().replace(/[\s\-().]/g, '')
  if (s.startsWith('00')) s = `+${s.slice(2)}`
  return /^\+\d{8,15}$/.test(s) ? s : null
}

const PASO_DE: Record<Campo, Paso> = { nombre: 1, whatsapp: 2, correo: 3, acepta: 3 }

// Si el servidor devuelve errores, la ventana vuelve al primer paso que tenga uno
export function pasoConError(errores: Partial<Record<Campo, string>> | undefined): Paso | null {
  const pasos = (Object.keys(errores ?? {}) as Campo[]).filter((c) => errores?.[c]).map((c) => PASO_DE[c])
  return pasos.length ? (Math.min(...pasos) as Paso) : null
}
