// Datos de contacto de /agendar: validación en el navegador (la regla del servidor en
// lib/diagnostic/diagnostic.ts, más una cantidad de dígitos posible) y código de país.

export type ContactFields = { nombre: string; apellido: string; telefono: string; email: string }
export type ContactField = keyof ContactFields

type Locale = 'es' | 'en'

// Usuario, @ y un dominio con al menos un punto y terminación de dos o más caracteres
const EMAIL = /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)*\.[^\s@.]{2,}$/

export function isValidEmail(value: string): boolean {
  return EMAIL.test(value.trim())
}

// Lo que acepta el servidor: dígitos, espacios, paréntesis, puntos y guiones (el + no: el
// código de país va en su selector)
const PHONE_CHARS = /^[\d\s().-]{4,20}$/

export function isValidPhone(value: string): boolean {
  const phone = value.trim()
  const digits = phone.replace(/\D/g, '').length
  return PHONE_CHARS.test(phone) && digits >= 6 && digits <= 15
}

/** Campos inválidos, en el orden del formulario */
export function invalidContactFields(fields: ContactFields): ContactField[] {
  const invalid: ContactField[] = []
  if (!fields.nombre.trim()) invalid.push('nombre')
  if (!fields.apellido.trim()) invalid.push('apellido')
  if (!isValidPhone(fields.telefono)) invalid.push('telefono')
  if (!isValidEmail(fields.email)) invalid.push('email')
  return invalid
}

// Códigos del selector y los países (ISO 3166) que cubre cada uno
const DIAL_CODES: [code: string, regions: string[]][] = [
  ['+1', ['US', 'CA']],
  ['+52', ['MX']],
  ['+57', ['CO']],
  ['+54', ['AR']],
  ['+56', ['CL']],
  ['+51', ['PE']],
  ['+593', ['EC']],
  ['+58', ['VE']],
  ['+507', ['PA']],
  ['+506', ['CR']],
  ['+502', ['GT']],
  ['+503', ['SV']],
  ['+504', ['HN']],
  ['+505', ['NI']],
  ['+598', ['UY']],
  ['+591', ['BO']],
  ['+595', ['PY']],
  ['+34', ['ES']],
  ['+55', ['BR']],
  ['+44', ['GB']],
]

const CODE_BY_REGION = new Map(DIAL_CODES.flatMap(([code, regions]) => regions.map((region) => [region, code] as const)))

// Zona horaria → país, para cuando el idioma no dice el país ("es", "es-419")
const REGION_BY_ZONE: Record<string, string> = {
  'America/Costa_Rica': 'CR',
  'America/Mexico_City': 'MX',
  'America/Monterrey': 'MX',
  'America/Merida': 'MX',
  'America/Cancun': 'MX',
  'America/Chihuahua': 'MX',
  'America/Hermosillo': 'MX',
  'America/Mazatlan': 'MX',
  'America/Tijuana': 'MX',
  'America/Bogota': 'CO',
  'America/Santiago': 'CL',
  'America/Lima': 'PE',
  'America/Guayaquil': 'EC',
  'America/Caracas': 'VE',
  'America/Panama': 'PA',
  'America/Guatemala': 'GT',
  'America/El_Salvador': 'SV',
  'America/Tegucigalpa': 'HN',
  'America/Managua': 'NI',
  'America/Montevideo': 'UY',
  'America/La_Paz': 'BO',
  'America/Asuncion': 'PY',
  'Europe/Madrid': 'ES',
  'Atlantic/Canary': 'ES',
  'Europe/London': 'GB',
  'America/Sao_Paulo': 'BR',
  'America/Fortaleza': 'BR',
  'America/Recife': 'BR',
  'America/Bahia': 'BR',
  'America/Manaus': 'BR',
  'America/New_York': 'US',
  'America/Chicago': 'US',
  'America/Denver': 'US',
  'America/Phoenix': 'US',
  'America/Los_Angeles': 'US',
  'America/Anchorage': 'US',
  'Pacific/Honolulu': 'US',
  'America/Toronto': 'CA',
  'America/Vancouver': 'CA',
}

function regionOfZone(timeZone: string): string | undefined {
  if (timeZone.startsWith('America/Argentina/')) return 'AR'
  return REGION_BY_ZONE[timeZone]
}

/** Código de país por defecto: el país del idioma del navegador, si no el de su zona horaria */
export function guessDialCode(hints: { languages: readonly string[]; timeZone?: string; locale: Locale }): string {
  for (const tag of hints.languages) {
    const region = tag
      .split('-')
      .slice(1)
      .find((part) => /^[a-z]{2}$/i.test(part))
      ?.toUpperCase()
    const code = region && CODE_BY_REGION.get(region)
    if (code) return code
  }
  const region = hints.timeZone ? regionOfZone(hints.timeZone) : undefined
  const code = region && CODE_BY_REGION.get(region)
  if (code) return code
  return hints.locale === 'en' ? '+1' : '+506'
}

/** Opciones del selector con los países en el idioma de la página, en orden alfabético */
export function dialCodeOptions(locale: Locale): { code: string; label: string }[] {
  const names = new Intl.DisplayNames([locale], { type: 'region' })
  const collator = new Intl.Collator(locale)
  return DIAL_CODES.map(([code, regions]) => ({ code, name: regions.map((r) => names.of(r) ?? r).join(' / ') }))
    .sort((a, b) => collator.compare(a.name, b.name))
    .map(({ code, name }) => ({ code, label: `${code} · ${name}` }))
}
