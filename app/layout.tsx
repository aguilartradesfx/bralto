import type { Metadata } from 'next'
import './globals.css'
import { CookieConsent } from '@/components/cookie-consent'

export const metadata: Metadata = {
  metadataBase: new URL('https://bralto.io'),
  title: 'Bralto — Infraestructura Digital para tu Negocio',
  description:
    'Analizamos su negocio, automatizamos su operación, y le entregamos todo funcionando sobre su propia plataforma. Agentes de IA, sitios web, integraciones — todo a la medida.',
  keywords: [
    'automatización de ventas',
    'agentes de IA',
    'infraestructura digital',
    'WhatsApp automatizado',
    'CRM latinoamérica',
    'automatización negocios',
    'seguimiento automático',
  ],
  authors: [{ name: 'Bralto', url: 'https://bralto.io' }],
  creator: 'Bralto',
  openGraph: {
    type: 'website',
    locale: 'es_ES',
    url: 'https://bralto.io',
    siteName: 'Bralto',
    title: 'Bralto — Infraestructura Digital para tu Negocio',
    description:
      'Agentes de IA que atienden, califican, agendan y venden 24/7 en WhatsApp, Instagram, tu web y más.',
    images: [
      {
        url: 'https://storage.googleapis.com/msgsndr/hdVpvshZP3RGJQbxx8GA/media/6823c9f977a9d4672be32ac7.png',
        width: 1200,
        height: 630,
        alt: 'Bralto — Infraestructura Digital',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Bralto — Infraestructura Digital para tu Negocio',
    description:
      'Agentes de IA que atienden, califican, agendan y venden 24/7.',
    images: [
      'https://storage.googleapis.com/msgsndr/hdVpvshZP3RGJQbxx8GA/media/6823c9f977a9d4672be32ac7.png',
    ],
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
}

const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Bralto',
  url: 'https://bralto.io',
  logo: 'https://storage.googleapis.com/msgsndr/hdVpvshZP3RGJQbxx8GA/media/6823c9f977a9d4672be32ac7.png',
  description:
    'Infraestructura de operaciones digitales. Agentes de IA para automatizar ventas, atención al cliente y operaciones.',
  founder: {
    '@type': 'Person',
    name: 'Alejandro Aguilar',
  },
  sameAs: ['https://bralto.io'],
  offers: {
    '@type': 'Offer',
    price: '87',
    priceCurrency: 'USD',
    description: 'Plataforma todo en uno de automatización empresarial',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className="dark">
      <head>
        {/* Disable browser scroll restoration so the page always loads at the top */}
        <script dangerouslySetInnerHTML={{ __html: `if(history.scrollRestoration)history.scrollRestoration='manual';history.replaceState(null,'',window.location.pathname);window.scrollTo(0,0);` }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <link rel="canonical" href="https://bralto.io" />
        {/* Hubot Sans — used only in the Hero headline */}
        <link rel="preconnect" href="https://fonts.cdnfonts.com" />
        <link rel="stylesheet" href="https://fonts.cdnfonts.com/css/hubot-sans" />
      </head>
      <body>
        {children}
        <CookieConsent />
      </body>
    </html>
  )
}
