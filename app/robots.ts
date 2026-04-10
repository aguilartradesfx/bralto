import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/admin/', '/_next/', '/87-payment/', '/payment-info/'],
      },
    ],
    sitemap: 'https://bralto.io/sitemap.xml',
  }
}
