import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/admin/', '/_next/', '/payment-info/'],
      },
    ],
    sitemap: 'https://bralto.io/sitemap.xml',
  }
}
