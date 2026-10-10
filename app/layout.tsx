import type { Metadata, Viewport } from 'next'
import './globals.css'
import { SITE_URL } from '@/lib/seo'

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#050505' },
    { media: '(prefers-color-scheme: light)', color: '#e8e8e8' },
  ],
}

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  icons: {
    icon: '/Favicon.png',
    shortcut: '/Favicon.png',
    apple: '/Favicon.png',
  },
  title: {
    default: 'Automatización e infraestructura digital para negocios | Bralto',
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
  authors: [{ name: 'Bralto', url: SITE_URL }],
  creator: 'Bralto',
  publisher: 'Bralto',
  openGraph: {
    type: 'website',
    locale: 'es_LA',
    url: SITE_URL,
    siteName: 'Bralto',
    title: 'Automatización e infraestructura digital para negocios | Bralto',
    description:
      'Automatizamos la operación de tu negocio con IA, CRM, WhatsApp y más. Servicio integral para restaurantes, clínicas, inmobiliarias y empresas en LATAM, España y Estados Unidos.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Bralto: automatización digital para negocios',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Automatización e infraestructura digital para negocios | Bralto',
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
  manifest: '/manifest.json',
}

// Cada sección pone su <html> con su idioma (components/document.tsx); aquí solo pasan los hijos.
// El 404 de la raíz (app/not-found.tsx) también arma el suyo.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children
}
