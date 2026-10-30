// Las reglas de cada dato del registro, sin zod: las usa el servidor (lib/guias/registro.ts) y también
// la ventana del candado en el navegador, que pide los datos en tres pasos y revisa cada uno antes de
// pasar al siguiente. El correo lo revisa solo el servidor (es el último paso).

export type Campo = 'nombre' | 'correo' | 'whatsapp' | 'acepta'
export type Paso = 1 | 2 | 3

export const MENSAJES: Record<Campo, string> = {
  nombre: 'Escriba su nombre.',
  correo: 'Revise su correo: parece que le falta algo.',
  whatsapp: 'Escriba su WhatsApp con el código de país, por ejemplo +506 8888 8888.',
  acepta: 'Para abrir la guía, acepte la política de privacidad.',
}

// Una sola línea: así no se cuelan renglones en el aviso de Telegram
export function limpiarNombre(v: string): string {
  return v.trim().replace(/\s+/g, ' ')
}

export function nombreValido(nombre: string): boolean {
  return nombre.length >= 2 && nombre.length <= 80
}

// Con código de país («+» o «00» al inicio) y sin espacios, guiones, paréntesis ni puntos.
// Siempre se guarda con «+»: así el enlace wa.me del aviso funciona y no hay dos formatos.
export function limpiarWhatsapp(v: string): string | null {
  let s = v.trim().replace(/[\s\-().]/g, '')
  if (s.startsWith('00')) s = `+${s.slice(2)}`
  return /^\+\d{8,15}$/.test(s) ? s : null
}

// Paso 1: el nombre; paso 2: el WhatsApp
export function errorDelPaso(paso: 1 | 2, valor: string): string | null {
  if (paso === 1) return nombreValido(limpiarNombre(valor)) ? null : MENSAJES.nombre
  return limpiarWhatsapp(valor) ? null : MENSAJES.whatsapp
}

const PASO_DE: Record<Campo, Paso> = { nombre: 1, whatsapp: 2, correo: 3, acepta: 3 }

// Si el servidor devuelve errores, la ventana vuelve al primer paso que tenga uno
export function pasoConError(errores: Partial<Record<Campo, string>> | undefined): Paso | null {
  const pasos = (Object.keys(errores ?? {}) as Campo[]).filter((c) => errores?.[c]).map((c) => PASO_DE[c])
  return pasos.length ? (Math.min(...pasos) as Paso) : null
}
