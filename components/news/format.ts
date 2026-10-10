import type { NewsRow } from '@/lib/news/types'

export type NewsLocale = 'es' | 'en'

export const formatNewsDate = (iso: string, locale: NewsLocale) =>
  new Intl.DateTimeFormat(locale === 'es' ? 'es-CR' : 'en-US', {
    dateStyle: 'long',
    timeZone: 'America/Costa_Rica',
  }).format(new Date(iso))

// Los campos de una nota en el idioma de la página
export const localized = (row: NewsRow, locale: NewsLocale) => ({
  titulo: locale === 'es' ? row.titulo_es : row.titulo_en,
  resumen: locale === 'es' ? row.resumen_es : row.resumen_en,
  cuerpo: locale === 'es' ? row.cuerpo_es : row.cuerpo_en,
  imagenAlt: locale === 'es' ? row.imagen_alt_es : row.imagen_alt_en,
})
