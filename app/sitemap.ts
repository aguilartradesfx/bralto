import type { MetadataRoute } from 'next'
import { clients } from '@/app/servicios/sitios-web/clients'
import { LEGAL_REVIEWED } from '@/lib/legal'
import { listForSitemap } from '@/lib/news/store'
import { SITE_URL } from '@/lib/seo'

const LOCALES = ['es', 'en'] as const

type Route = {
  priority: number
  changeFrequency: 'weekly' | 'monthly'
  path: string
}

const ROUTES: Route[] = [
  { priority: 1.0,  changeFrequency: 'weekly',  path: '' },
  { priority: 0.9,  changeFrequency: 'monthly', path: '/servicios' },
  { priority: 0.9,  changeFrequency: 'monthly', path: '/agendar' },
  { priority: 0.8,  changeFrequency: 'monthly', path: '/sobre-nosotros' },
  { priority: 0.8,  changeFrequency: 'monthly', path: '/plataforma' },
  { priority: 0.85, changeFrequency: 'monthly', path: '/servicios/sitios-web' },
  { priority: 0.85, changeFrequency: 'monthly', path: '/servicios/automatizacion' },
  { priority: 0.85, changeFrequency: 'monthly', path: '/servicios/agentes-ia' },
  { priority: 0.85, changeFrequency: 'monthly', path: '/servicios/produccion-contenido' },
  { priority: 0.85, changeFrequency: 'monthly', path: '/servicios/campanas' },
  { priority: 0.85, changeFrequency: 'monthly', path: '/servicios/sistemas-internos' },
  { priority: 0.85, changeFrequency: 'monthly', path: '/servicios/asesoria' },
  { priority: 0.8,  changeFrequency: 'monthly', path: '/casos' },
  { priority: 0.7,  changeFrequency: 'weekly',  path: '/noticias' },
  ...clients.map((c): Route => ({ priority: 0.7, changeFrequency: 'monthly', path: `/servicios/sitios-web/${c.id}` })),
  // Privacidad y términos, solo publicados (como borrador dan 404 en producción)
  ...(LEGAL_REVIEWED
    ? (['/privacidad', '/terminos'] as const).map((path): Route => ({ priority: 0.3, changeFrequency: 'monthly', path }))
    : []),
]

// Las noticias cambian todos los días (y una oculta debe salir enseguida)
export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()
  const entries: MetadataRoute.Sitemap = []

  for (const locale of LOCALES) {
    for (const route of ROUTES) {
      entries.push({
        url: `${SITE_URL}/${locale}${route.path}`,
        lastModified: now,
        changeFrequency: route.changeFrequency,
        priority: route.priority,
        alternates: {
          languages: {
            es: `${SITE_URL}/es${route.path}`,
            en: `${SITE_URL}/en${route.path}`,
            'x-default': `${SITE_URL}/es${route.path}`,
          },
        },
      })
    }
  }

  // Cada nota publicada, en los dos idiomas; si Supabase falla, el resto del sitemap sale igual
  const news = await listForSitemap().catch(() => [])
  for (const locale of LOCALES) {
    for (const n of news) {
      const path = `/noticias/${n.slug}`
      entries.push({
        url: `${SITE_URL}/${locale}${path}`,
        lastModified: new Date(n.actualizada_en),
        changeFrequency: 'monthly',
        priority: 0.6,
        alternates: {
          languages: {
            es: `${SITE_URL}/es${path}`,
            en: `${SITE_URL}/en${path}`,
            'x-default': `${SITE_URL}/es${path}`,
          },
        },
      })
    }
  }

  return entries
}
