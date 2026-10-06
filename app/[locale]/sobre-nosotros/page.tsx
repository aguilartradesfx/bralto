import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import SobreNosotrosView from './_view'

type Props = { params: Promise<{ locale: string }> }

const BASE_URL = 'https://bralto.io'

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
      canonical: `${BASE_URL}/${locale}/sobre-nosotros`,
      languages: {
        es: `${BASE_URL}/es/sobre-nosotros`,
        en: `${BASE_URL}/en/sobre-nosotros`,
        'x-default': `${BASE_URL}/es/sobre-nosotros`,
      },
    },
  }
}

export default async function SobreNosotrosPage({ params }: Props) {
  const locale = toLocale((await params).locale)
  setRequestLocale(locale)
  return <SobreNosotrosView locale={locale} />
}
