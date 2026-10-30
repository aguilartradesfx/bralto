import { limpiarWhatsapp } from './campos.ts'

// El selector de país del WhatsApp en la ventana del candado. La lista es la del público de Bralto
// (América, España y algunos de Europa); quien sea de otro lado elige «Otro país» y escribe el número
// completo con su código. `digitos` es el largo del número de celular sin el código del país (y sin el
// 0 de adelante), para revisar que no le falte ni le sobre nada; `ejemplo` es lo que se ve en el campo.

export type Pais = { iso: string; nombre: string; codigo: string; digitos: [number, number]; ejemplo: string }

export const OTRO = 'otro'

export const PAISES: Pais[] = [
  { iso: 'DE', nombre: 'Alemania', codigo: '49', digitos: [10, 11], ejemplo: '1512 3456789' },
  { iso: 'AR', nombre: 'Argentina', codigo: '54', digitos: [10, 11], ejemplo: '9 11 2345 6789' },
  { iso: 'BZ', nombre: 'Belice', codigo: '501', digitos: [7, 7], ejemplo: '622 1234' },
  { iso: 'BO', nombre: 'Bolivia', codigo: '591', digitos: [8, 8], ejemplo: '7123 4567' },
  { iso: 'BR', nombre: 'Brasil', codigo: '55', digitos: [10, 11], ejemplo: '11 91234 5678' },
  { iso: 'CA', nombre: 'Canadá', codigo: '1', digitos: [10, 10], ejemplo: '416 555 0123' },
  { iso: 'CL', nombre: 'Chile', codigo: '56', digitos: [9, 9], ejemplo: '9 1234 5678' },
  { iso: 'CO', nombre: 'Colombia', codigo: '57', digitos: [10, 10], ejemplo: '300 123 4567' },
  { iso: 'CR', nombre: 'Costa Rica', codigo: '506', digitos: [8, 8], ejemplo: '8888 8888' },
  { iso: 'CU', nombre: 'Cuba', codigo: '53', digitos: [8, 8], ejemplo: '5123 4567' },
  { iso: 'EC', nombre: 'Ecuador', codigo: '593', digitos: [9, 9], ejemplo: '99 123 4567' },
  { iso: 'SV', nombre: 'El Salvador', codigo: '503', digitos: [8, 8], ejemplo: '7012 3456' },
  { iso: 'ES', nombre: 'España', codigo: '34', digitos: [9, 9], ejemplo: '612 34 56 78' },
  { iso: 'US', nombre: 'Estados Unidos', codigo: '1', digitos: [10, 10], ejemplo: '201 555 0123' },
  { iso: 'FR', nombre: 'Francia', codigo: '33', digitos: [9, 9], ejemplo: '6 12 34 56 78' },
  { iso: 'GT', nombre: 'Guatemala', codigo: '502', digitos: [8, 8], ejemplo: '5123 4567' },
  { iso: 'GQ', nombre: 'Guinea Ecuatorial', codigo: '240', digitos: [9, 9], ejemplo: '222 123 456' },
  { iso: 'HN', nombre: 'Honduras', codigo: '504', digitos: [8, 8], ejemplo: '9123 4567' },
  { iso: 'IT', nombre: 'Italia', codigo: '39', digitos: [9, 10], ejemplo: '312 345 6789' },
  { iso: 'MX', nombre: 'México', codigo: '52', digitos: [10, 10], ejemplo: '55 1234 5678' },
  { iso: 'NI', nombre: 'Nicaragua', codigo: '505', digitos: [8, 8], ejemplo: '8123 4567' },
  { iso: 'NL', nombre: 'Países Bajos', codigo: '31', digitos: [9, 9], ejemplo: '6 12345678' },
  { iso: 'PA', nombre: 'Panamá', codigo: '507', digitos: [8, 8], ejemplo: '6123 4567' },
  { iso: 'PY', nombre: 'Paraguay', codigo: '595', digitos: [9, 9], ejemplo: '981 123 456' },
  { iso: 'PE', nombre: 'Perú', codigo: '51', digitos: [9, 9], ejemplo: '912 345 678' },
  { iso: 'PT', nombre: 'Portugal', codigo: '351', digitos: [9, 9], ejemplo: '912 345 678' },
  { iso: 'PR', nombre: 'Puerto Rico', codigo: '1', digitos: [10, 10], ejemplo: '787 555 0123' },
  { iso: 'GB', nombre: 'Reino Unido', codigo: '44', digitos: [10, 10], ejemplo: '7700 900123' },
  { iso: 'DO', nombre: 'República Dominicana', codigo: '1', digitos: [10, 10], ejemplo: '809 555 0123' },
  { iso: 'CH', nombre: 'Suiza', codigo: '41', digitos: [9, 9], ejemplo: '78 123 45 67' },
  { iso: 'UY', nombre: 'Uruguay', codigo: '598', digitos: [8, 8], ejemplo: '94 123 456' },
  { iso: 'VE', nombre: 'Venezuela', codigo: '58', digitos: [10, 10], ejemplo: '412 123 4567' },
]

const POR_ISO = new Map(PAISES.map((p) => [p.iso, p]))

export function pais(iso: string): Pais | undefined {
  return POR_ISO.get(iso)
}

// La bandera sale de las dos letras del país (símbolos regionales de Unicode)
export function bandera(iso: string): string {
  return String.fromCodePoint(...[...iso.toUpperCase()].map((l) => 0x1f1e6 + l.charCodeAt(0) - 65))
}

// El país que Vercel detecta por la IP (x-vercel-ip-country). Sin dato (en local) va Costa Rica; si
// es un país que no está en la lista, «Otro país», para que escriba el número con su código.
export function paisPorDefecto(detectado: string | null | undefined): string {
  if (!detectado) return 'CR'
  const iso = detectado.toUpperCase()
  return POR_ISO.has(iso) ? iso : OTRO
}

// El número completo, listo para guardar («+50688888888»), o null si no está bien. Si la persona lo
// escribe con «+» o «00», se toma tal cual (manda sobre el selector); si no, va el código del país
// elegido, sin el 0 de adelante que en varios países se marca dentro del país.
export function whatsappCompleto(iso: string, numero: string): string | null {
  const escrito = numero.trim()
  if (escrito.startsWith('+') || escrito.startsWith('00')) return limpiarWhatsapp(escrito)
  const p = POR_ISO.get(iso)
  if (!p) return null
  const digitos = escrito.replace(/\D/g, '').replace(/^0/, '')
  if (digitos.length < p.digitos[0] || digitos.length > p.digitos[1]) return null
  return limpiarWhatsapp(`+${p.codigo}${digitos}`)
}
