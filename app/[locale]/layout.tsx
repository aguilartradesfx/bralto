import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'
import type { Metadata } from 'next'

type Props = {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  if (locale !== 'en') return {}
  return {
    title: {
      default: 'Bralto — Automation & Digital Infrastructure for Businesses',
      template: '%s | Bralto',
    },
    description:
      'We automate your business operations with AI, CRM, WhatsApp, and more. Full-service for restaurants, clinics, real estate agencies, and companies across Latin America, Spain, and the United States.',
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
