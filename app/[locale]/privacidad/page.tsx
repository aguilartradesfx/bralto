import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'
import { LegalPage } from '@/components/home/legal-page'
import { showPending } from '@/lib/home/pending'
import { LEGAL_REVIEWED, legalPagesVisible } from '@/lib/legal'
import { PRIVACY } from './content'
import { SITE_URL } from '@/lib/seo'

type Props = { params: Promise<{ locale: string }> }

const toLocale = (locale: string) => (locale === 'en' ? 'en' : 'es')

export function generateStaticParams() {
  return [{ locale: 'es' }, { locale: 'en' }]
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = toLocale((await params).locale)
  return {
    title: LEGAL_REVIEWED ? PRIVACY.title : `${PRIVACY.title} (borrador)`,
    // Borrador: fuera de los buscadores hasta la revisión legal
    robots: LEGAL_REVIEWED ? undefined : { index: false, follow: false },
    alternates: { canonical: `${SITE_URL}/${locale}/privacidad` },
  }
}

export default async function PrivacidadPage({ params }: Props) {
  const locale = toLocale((await params).locale)
  setRequestLocale(locale)
  // Borrador pendiente de revisión legal: en producción no existe (lib/legal.ts)
  if (!legalPagesVisible({ reviewed: LEGAL_REVIEWED, pendingVisible: showPending(process.env) })) notFound()
  return <LegalPage locale={locale} doc={PRIVACY} />
}
