import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./i18n/request.ts')

const nextConfig: NextConfig = {
  serverExternalPackages: ['handlebars'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: 'assets.cdn.filesafe.space',
      },
      {
        protocol: 'https',
        hostname: 'hoirqrkdgbmvpwutwuwj.supabase.co',
      },
      // Portadas de las noticias de IA
      {
        protocol: 'https',
        hostname: 'pjwmfllnyauobityaile.supabase.co',
        pathname: '/storage/v1/object/public/noticias/**',
      },
    ],
  },
  // La fuente de la firma de las portadas viaja con la función que publica las noticias
  outputFileTracingIncludes: { '/api/noticias': ['./lib/news/fonts/**'] },
  transpilePackages: ['@splinetool/react-spline', '@splinetool/runtime'],
  // El índice de servicios vivía en /precios (sin precios): los enlaces viejos y los anuncios siguen
  async redirects() {
    return [{ source: '/:locale(es|en)/precios', destination: '/:locale/servicios', permanent: true }]
  },
}

export default withNextIntl(nextConfig)
