// Teléfonos del CRM en E.164 (+ y el código de país). Lo que se escribe en el panel se pasa a ese formato:
// 8 números son de Costa Rica (+506) y 10, de EE. UU. o Canadá (+1). Cualquier otro país va con su +.

const MIN = 8
const MAX = 15

export function normalizarTelefono(texto: unknown): string | null {
  if (typeof texto !== 'string') return null
  const limpio = texto.trim()
  if (!limpio || /[a-z]/i.test(limpio)) return null
  const digitos = limpio.replace(/\D/g, '')
  let e164: string
  if (limpio.startsWith('+')) e164 = `+${digitos}`
  else if (digitos.startsWith('00')) e164 = `+${digitos.slice(2)}`
  else if (digitos.length === 8) e164 = `+506${digitos}`
  else if (digitos.length === 10) e164 = `+1${digitos}`
  else if (digitos.length >= 11) e164 = `+${digitos}`
  else return null
  const largo = e164.length - 1
  return largo >= MIN && largo <= MAX ? e164 : null
}

// Para leerlo: +506 8888 1234, +1 305 555 0123; los demás países, tal cual
export function telefonoLegible(e164: string): string {
  const d = e164.replace(/\D/g, '')
  if (/^506\d{8}$/.test(d)) return `+506 ${d.slice(3, 7)} ${d.slice(7)}`
  if (/^1\d{10}$/.test(d)) return `+1 ${d.slice(1, 4)} ${d.slice(4, 7)} ${d.slice(7)}`
  if (/^52\d{10}$/.test(d)) return `+52 ${d.slice(2, 5)} ${d.slice(5, 8)} ${d.slice(8)}`
  return e164
}

export const enlaceWhatsApp = (e164: string) => `https://wa.me/${e164.replace(/\D/g, '')}`
export const enlaceLlamada = (e164: string) => `tel:${e164}`
