import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'
import { LegalPage } from '@/components/home/legal-page'
import { showPending } from '@/lib/home/pending'
import { LEGAL_REVIEWED, legalPagesVisible } from '@/lib/legal'
import { TERMS } from './content'
import { SITE_URL } from '@/lib/seo'

type Props = { params: Promise<{ locale: string }> }

const toLocale = (locale: string) => (locale === 'en' ? 'en' : 'es')

export function generateStaticParams() {
  return [{ locale: 'es' }, { locale: 'en' }]
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = toLocale((await params).locale)
  return {
    title: LEGAL_REVIEWED ? TERMS.title : `${TERMS.title} (borrador)`,
    // Si vuelve a ser borrador: fuera de los buscadores
    robots: LEGAL_REVIEWED ? undefined : { index: false, follow: false },
    alternates: { canonical: `${SITE_URL}/${locale}/terminos` },
  }
}

export default async function TerminosPage({ params }: Props) {
  const locale = toLocale((await params).locale)
  setRequestLocale(locale)
  // Como borrador, en producción no existe (lib/legal.ts)
  if (!legalPagesVisible({ reviewed: LEGAL_REVIEWED, pendingVisible: showPending(process.env) })) notFound()
  return <LegalPage locale={locale} doc={TERMS} />
}
