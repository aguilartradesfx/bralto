import type { Metadata } from 'next'
import { Geist, Geist_Mono, Instrument_Serif } from 'next/font/google'
import './globals.css'
import { ParticlesBackground } from '@/components/particles-background'
import { OrganizationJsonLd, WebSiteJsonLd } from '@/components/seo/JsonLd'
import { tagManagerBootScript } from '@/lib/consent'
import { PRIVATE_SURFACE_JS } from '@/lib/host-routing'
import { scrollRestorationScript } from '@/lib/scroll-restoration'

const GTM_ID = 'GTM-KTGZ86BC'

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-geist',
  display: 'swap',
})

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
  display: 'swap',
})

const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-instrument-serif',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://bralto.io'),
  icons: {
    icon: '/Favicon.png',
    shortcut: '/Favicon.png',
    apple: '/Favicon.png',
  },
  title: {
    default: 'Bralto — Automatización e Infraestructura Digital para Negocios',
    template: '%s | Bralto',
  },
  description:
    'Automatizamos la operación de tu negocio con IA, CRM, WhatsApp y más. Servicio integral para restaurantes, clínicas, inmobiliarias y empresas en Latinoamérica, España y Estados Unidos.',
  keywords: [
    'automatización de negocios',
    'CRM para empresas',
    'agencia de marketing digital Costa Rica',
    'mejor empresa de marketing Costa Rica',
    'automatización WhatsApp negocios',
    'infraestructura digital LATAM',
    'agencia de automatización',
    'marketing digital Latinoamérica',
    'plataforma todo en uno negocios',
    'agentes de IA para ventas',
    'CRM para restaurantes',
    'CRM para clínicas',
    'CRM para inmobiliarias',
    'marketing digital España',
    'automatización de ventas',
    'chatbot WhatsApp empresas',
    'agencia digital Costa Rica',
    'Bralto',
  ],
  authors: [{ name: 'Bralto', url: 'https://bralto.io' }],
  creator: 'Bralto',
  publisher: 'Bralto',
  openGraph: {
    type: 'website',
    locale: 'es_LA',
    url: 'https://bralto.io',
    siteName: 'Bralto',
    title: 'Bralto — Automatización e Infraestructura Digital para Negocios',
    description:
      'Automatizamos la operación de tu negocio con IA, CRM, WhatsApp y más. Servicio integral para restaurantes, clínicas, inmobiliarias y empresas en LATAM, España y Estados Unidos.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Bralto — Automatización Digital para Negocios',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Bralto — Automatización e Infraestructura Digital para Negocios',
    description:
      'Automatizamos la operación de tu negocio con IA, CRM, WhatsApp y más. LATAM, España y Estados Unidos.',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://bralto.io',
  },
  manifest: '/manifest.json',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html suppressHydrationWarning className={`dark ${geist.variable} ${geistMono.variable} ${instrumentSerif.variable}`}>
      <head>
        {/* GTM según el consentimiento de cookies (lib/consent.ts); nunca en el panel ni en la firma de contratos */}
        <script
          dangerouslySetInnerHTML={{ __html: tagManagerBootScript({ gtmId: GTM_ID, privateSurfaceJs: PRIVATE_SURFACE_JS }) }}
        />
        {/* Cada carga arranca arriba; la URL (query y #ancla) queda intacta */}
        <script dangerouslySetInnerHTML={{ __html: scrollRestorationScript }} />
        <OrganizationJsonLd />
        <WebSiteJsonLd />
      </head>
      <body>
        {/* Sin el iframe noscript de GTM: sin JavaScript no hay banner para aceptar ni rechazar */}
        {/* Partículas con scroll: una sola vez para todo el sitio público */}
        <ParticlesBackground />
        {/* All content above background layers; el banner de cookies vive en SiteShell */}
        <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
      </body>
    </html>
  )
}
