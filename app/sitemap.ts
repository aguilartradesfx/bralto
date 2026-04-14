import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://bralto.io'

  const routes: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'] }[] = [
    { path: '',                                    priority: 1.0,  changeFrequency: 'weekly'  },
    { path: '/precios',                            priority: 0.9,  changeFrequency: 'monthly' },
    { path: '/agendar',                            priority: 0.9,  changeFrequency: 'monthly' },
    { path: '/servicios/sitios-web',               priority: 0.85, changeFrequency: 'monthly' },
    { path: '/servicios/automatizacion',           priority: 0.85, changeFrequency: 'monthly' },
    { path: '/servicios/produccion-contenido',     priority: 0.85, changeFrequency: 'monthly' },
    { path: '/servicios/campanas',                 priority: 0.85, changeFrequency: 'monthly' },
    { path: '/servicios/sistemas-internos',        priority: 0.85, changeFrequency: 'monthly' },
    { path: '/servicios/asesoria',                 priority: 0.85, changeFrequency: 'monthly' },
  ]

  return routes.map(({ path, priority, changeFrequency }) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
    changeFrequency,
    priority,
  }))
}
