import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import SobreNosotrosView from './_view'
import { SITE_URL } from '@/lib/seo'

type Props = { params: Promise<{ locale: string }> }

const toLocale = (locale: string) => (locale === 'en' ? 'en' : 'es')

export function generateStaticParams() {
  return [{ locale: 'es' }, { locale: 'en' }]
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = toLocale((await params).locale)
  const t = await getTranslations({ locale, namespace: 'AboutPage.meta' })
  return {
    // El título ya incluye la marca: sin la plantilla "| Bralto"
    title: { absolute: t('title') },
    description: t('description'),
    alternates: {
      canonical: `${SITE_URL}/${locale}/sobre-nosotros`,
      languages: {
        es: `${SITE_URL}/es/sobre-nosotros`,
        en: `${SITE_URL}/en/sobre-nosotros`,
        'x-default': `${SITE_URL}/es/sobre-nosotros`,
      },
    },
  }
}

export default async function SobreNosotrosPage({ params }: Props) {
  const locale = toLocale((await params).locale)
  setRequestLocale(locale)
  return <SobreNosotrosView locale={locale} />
}
