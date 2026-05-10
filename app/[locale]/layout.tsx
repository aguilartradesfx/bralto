import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'
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

const BASE_URL = 'https://bralto.io'

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const l = (locale === 'en' ? 'en' : 'es') as Locale

  const titles: Record<Locale, string> = {
    es: 'Bralto — Automatización e Infraestructura Digital para Negocios',
    en: 'Bralto — Automation & Digital Infrastructure for Businesses',
  }

  const descriptions: Record<Locale, string> = {
    es: 'Automatizamos la operación de tu negocio con IA, CRM, WhatsApp y sistemas integrados. Para empresas que ya están establecidas y quieren escalar sin caos.',
    en: 'We automate your business operations with AI, CRM, WhatsApp, and integrated systems. For established companies that want to scale without chaos.',
  }

  return {
    title: {
      default: titles[l],
      template: '%s | Bralto',
    },
    description: descriptions[l],
    keywords: KEYWORDS[l],
    alternates: {
      canonical: `${BASE_URL}/${l}`,
      languages: {
        es: `${BASE_URL}/es`,
        en: `${BASE_URL}/en`,
        'x-default': `${BASE_URL}/es`,
      },
    },
    openGraph: {
      title: titles[l],
      description: descriptions[l],
      url: `${BASE_URL}/${l}`,
      siteName: 'Bralto',
      type: 'website',
      locale: l === 'es' ? 'es_LA' : 'en_US',
      images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'Bralto' }],
    },
    twitter: {
      card: 'summary_large_image',
      title: titles[l],
      description: descriptions[l],
      images: ['/og-image.jpg'],
    },
  }
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params

  if (!routing.locales.includes(locale as 'es' | 'en')) {
    notFound()
  }

  const messages = await getMessages()

  return (
    <>
      <HtmlLang locale={locale} />
      <NextIntlClientProvider messages={messages}>
        {children}
      </NextIntlClientProvider>
    </>
  )
}

// Sets document.documentElement.lang on the client so search engines
// and screen readers see the right language attribute.
function HtmlLang({ locale }: { locale: string }) {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `document.documentElement.lang="${locale}"`,
      }}
    />
  )
}
