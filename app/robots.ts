import { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/seo'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Sin /_next/: ahí están el CSS, el JS y las imágenes optimizadas que Google necesita para
        // ver la página. /payment-info no se bloquea: tiene noindex y Google tiene que poder leerlo
        disallow: ['/api/', '/admin/'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
