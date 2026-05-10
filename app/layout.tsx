import type { Metadata } from 'next'
import { Geist, Geist_Mono, Instrument_Serif } from 'next/font/google'
import './globals.css'
import { CookieConsent } from '@/components/cookie-consent'
import { OrganizationJsonLd, WebSiteJsonLd, LocalBusinessJsonLd } from '@/components/seo/JsonLd'

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
        {/* Google Tag Manager */}
        <script dangerouslySetInnerHTML={{ __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','GTM-KTGZ86BC');` }} />
        {/* Disable browser scroll restoration */}
        <script dangerouslySetInnerHTML={{ __html: `if(history.scrollRestoration)history.scrollRestoration='manual';history.replaceState(null,'',window.location.pathname);window.scrollTo(0,0);` }} />
        <OrganizationJsonLd />
        <WebSiteJsonLd />
        <LocalBusinessJsonLd />
      </head>
      <body>
        {/* Google Tag Manager (noscript) */}
        <noscript dangerouslySetInnerHTML={{ __html: `<iframe src="https://www.googletagmanager.com/ns.html?id=GTM-KTGZ86BC" height="0" width="0" style="display:none;visibility:hidden"></iframe>` }} />
        {/* Atmospheric background — fixed, renders once, behind all content */}
        <div aria-hidden="true" className="atmo-ambient" />
        <div aria-hidden="true" className="atmo-grid" />
        {/* All content above background layers */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          {children}
          <CookieConsent />
        </div>
      </body>
    </html>
  )
}
