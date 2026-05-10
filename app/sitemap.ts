import type { MetadataRoute } from 'next'

const BASE_URL = 'https://bralto.io'
const LOCALES = ['es', 'en'] as const

type Route = {
  priority: number
  changeFrequency: 'weekly' | 'monthly'
  path: string
}

const ROUTES: Route[] = [
  { priority: 1.0,  changeFrequency: 'weekly',  path: '' },
  { priority: 0.9,  changeFrequency: 'monthly', path: '/precios' },
  { priority: 0.9,  changeFrequency: 'monthly', path: '/agendar' },
  { priority: 0.8,  changeFrequency: 'monthly', path: '/sobre-nosotros' },
  { priority: 0.85, changeFrequency: 'monthly', path: '/servicios/sitios-web' },
  { priority: 0.85, changeFrequency: 'monthly', path: '/servicios/automatizacion' },
  { priority: 0.85, changeFrequency: 'monthly', path: '/servicios/produccion-contenido' },
  { priority: 0.85, changeFrequency: 'monthly', path: '/servicios/campanas' },
  { priority: 0.85, changeFrequency: 'monthly', path: '/servicios/sistemas-internos' },
  { priority: 0.85, changeFrequency: 'monthly', path: '/servicios/asesoria' },
]

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  const entries: MetadataRoute.Sitemap = []

  for (const locale of LOCALES) {
    for (const route of ROUTES) {
      entries.push({
        url: `${BASE_URL}/${locale}${route.path}`,
        lastModified: now,
        changeFrequency: route.changeFrequency,
        priority: route.priority,
        alternates: {
          languages: {
            es: `${BASE_URL}/es${route.path}`,
            en: `${BASE_URL}/en${route.path}`,
            'x-default': `${BASE_URL}/es${route.path}`,
          },
        },
      })
    }
  }

  return entries
}
