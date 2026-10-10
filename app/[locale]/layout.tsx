import { NextIntlClientProvider } from 'next-intl'
import { setRequestLocale } from 'next-intl/server'
import { redirect } from 'next/navigation'
import { routing } from '@/i18n/routing'
import { Document } from '@/components/document'
import { SiteShell } from '@/components/home/shell'
import { SITE_URL } from '@/lib/seo'
import type { Metadata } from 'next'

type Locale = 'es' | 'en'

type Props = {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

const KEYWORDS: Record<Locale, string[]> = {
  es: [
    'automatización de negocios',
    'CRM con IA',
    'agentes de IA',
    'integración WhatsApp Business',
    'infraestructura digital',
    'sistemas internos a medida',
    'automatización de ventas',
    'automatización de atención al cliente',
    'workflows con IA',
    'plataforma todo en uno',
    'CRM para empresas',
    'automatización WhatsApp negocios',
    'marketing digital Latinoamérica',
    'agentes de IA para ventas',
    'CRM para restaurantes',
    'CRM para clínicas',
    'CRM para inmobiliarias',
    'marketing digital España',
    'chatbot WhatsApp empresas',
    'Bralto',
  ],
  en: [
    'business automation',
    'AI-powered CRM',
    'AI agents',
    'WhatsApp Business integration',
    'digital infrastructure',
    'custom internal systems',
    'sales automation',
    'customer service automation',
    'AI workflows',
    'all-in-one platform',
    'CRM and automation for established businesses',
  ],
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const l = (locale === 'en' ? 'en' : 'es') as Locale

  const titles: Record<Locale, string> = {
    es: 'Automatización e infraestructura digital para negocios',
    en: 'Automation and digital infrastructure for businesses',
  }

  const descriptions: Record<Locale, string> = {
    es: 'Construimos e integramos sistemas a la medida que automatizan la operación comercial de su negocio: sitio web, CRM, IA, pagos y reportes, todo conectado.',
    en: "We build and integrate custom systems that automate your business's commercial operation: website, CRM, AI, payments, and reporting, all connected.",
  }

  return {
    title: {
      default: titles[l],
      template: '%s | Bralto',
    },
    description: descriptions[l],
    keywords: KEYWORDS[l],
    openGraph: {
      title: `${titles[l]} | Bralto`,
      description: descriptions[l],
      url: `${SITE_URL}/${l}`,
      siteName: 'Bralto',
      type: 'website',
      locale: l === 'es' ? 'es_LA' : 'en_US',
      images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'Bralto' }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${titles[l]} | Bralto`,
      description: descriptions[l],
      images: ['/og-image.jpg'],
    },
  }
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params

  // Un "idioma" que no es es/en es una ruta que no existe fuera de /es y /en (el middleware deja
  // pasar /Diagnostico-…, /Proposal-…; un documento de cliente mal escrito cae aquí). Se manda a
  // /es, donde el 404 del sitio es estático: un notFound() aquí sería dinámico y Next lo
  // entregaría como página de error armada en el navegador, a veces en blanco.
  if (!routing.locales.includes(locale as 'es' | 'en')) {
    redirect(`/es/${locale}`)
  }

  setRequestLocale(locale)

  const lang = locale === 'en' ? 'en' : 'es'

  return (
    <Document lang={lang}>
      {/* Las páginas se renderizan en el servidor y los componentes de cliente reciben sus
          textos por props: al navegador solo viaja el idioma, ningún mensaje */}
      <NextIntlClientProvider messages={null}>
        {/* Nav, footer, tema y fondo del diseño nuevo en todas las páginas públicas */}
        <SiteShell locale={lang}>{children}</SiteShell>
      </NextIntlClientProvider>
    </Document>
  )
}
