// Idioma para quien entra sin /es ni /en en la URL. Primero la elección que la persona ya hizo
// (cookie NEXT_LOCALE), después el idioma de su navegador y, solo si no pide español ni inglés,
// el país de la IP: alguien con el navegador en inglés que está en Costa Rica quiere inglés.

export type SiteLocale = 'es' | 'en'

const SITE_LOCALES: readonly SiteLocale[] = ['es', 'en']

// Países de habla hispana: con navegador en otro idioma, ahí se muestra español
const SPANISH_COUNTRIES = new Set([
  'MX', 'ES', 'AR', 'CO', 'PE', 'CL', 'EC', 'VE', 'GT', 'CU', 'BO',
  'DO', 'HN', 'PY', 'SV', 'NI', 'CR', 'PA', 'UY', 'GQ', 'PR',
])

const isSiteLocale = (value: string | null | undefined): value is SiteLocale =>
  !!value && (SITE_LOCALES as readonly string[]).includes(value)

// Idiomas del Accept-Language por prioridad (q), solo el idioma base: "es-CR;q=0.9" → "es"
function browserLanguages(header: string): string[] {
  return header
    .split(',')
    .map((part, i) => {
      const [tag, ...params] = part.trim().split(';')
      const q = params.map((p) => p.trim()).find((p) => p.startsWith('q='))
      return { lang: tag.trim().toLowerCase().split('-')[0], q: q ? Number(q.slice(2)) || 0 : 1, i }
    })
    .filter((entry) => entry.lang && entry.lang !== '*' && entry.q > 0)
    .sort((a, b) => b.q - a.q || a.i - b.i)
    .map((entry) => entry.lang)
}

export function preferredLocale({
  cookie,
  acceptLanguage,
  country,
}: {
  cookie?: string | null
  acceptLanguage?: string | null
  country?: string | null
}): SiteLocale {
  if (isSiteLocale(cookie)) return cookie
  const fromBrowser = browserLanguages(acceptLanguage ?? '').find(isSiteLocale)
  if (fromBrowser) return fromBrowser
  return SPANISH_COUNTRIES.has((country ?? '').toUpperCase()) ? 'es' : 'en'
}
