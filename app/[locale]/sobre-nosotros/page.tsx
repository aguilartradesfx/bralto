import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { AboutPage } from '@/components/about-page'

type Props = { params: Promise<{ locale: string }> }

const BASE_URL = 'https://bralto.io'

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'AboutPage.meta' })
  return {
    title: t('title'),
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

export default function SobreNosotrosPage() {
  return (
    <>
      <Navbar />
      <main>
        <AboutPage />
      </main>
      <Footer />
    </>
  )
}
