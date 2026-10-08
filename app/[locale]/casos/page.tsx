import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { clients } from '@/app/servicios/sitios-web/clients'
import { CaseRow } from '@/components/home/case-row'
import { FinalCta } from '@/components/home/final-cta'
import { SITE_URL } from '@/lib/seo'

type Props = { params: Promise<{ locale: string }> }

const toLocale = (locale: string) => (locale === 'en' ? 'en' : 'es')

export function generateStaticParams() {
  return [{ locale: 'es' }, { locale: 'en' }]
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = toLocale((await params).locale)
  const t = await getTranslations({ locale, namespace: 'Home.casesPage' })
  const title = t('metaTitle')
  const description = t('metaDescription')
  return {
    title: { absolute: title },
    description,
    alternates: {
      canonical: `${SITE_URL}/${locale}/casos`,
      languages: { es: `${SITE_URL}/es/casos`, en: `${SITE_URL}/en/casos`, 'x-default': `${SITE_URL}/es/casos` },
    },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/${locale}/casos`,
      siteName: 'Bralto',
      type: 'website',
      locale: locale === 'es' ? 'es_LA' : 'en_US',
      images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'Bralto' }],
    },
  }
}

// Todos los casos reales, seleccionables: cada uno lleva a su página
export default async function CasosPage({ params }: Props) {
  const locale = toLocale((await params).locale)
  setRequestLocale(locale)
  const t = await getTranslations({ locale, namespace: 'Home' })

  return (
    <main>
      <section className="hm-hero hm-hero--page" aria-labelledby="hm-cases-page-title">
        <div className="hm-wrap">
          <h1 id="hm-cases-page-title" className="hm-page-title">
            <span className="hm-hero__l1">{t('casesPage.titleLight')}</span>{' '}
            <span className="hm-hero__l2">{t('casesPage.titleBold')}</span>
          </h1>
          <p className="hm-lead hm-in">{t('casesPage.lead')}</p>
        </div>
      </section>

      <section className="hm-section hm-section--tight hm-section--joined" aria-label={t('casesPage.eyebrow')}>
        <div className="hm-wrap">
          <ul className="hm-cases hm-cases--page">
            {clients.map((client, i) => (
              <li key={client.id}>
                <CaseRow client={client} locale={locale} viewLabel={t('cases.view')} size="feature" priority={i === 0} />
              </li>
            ))}
          </ul>
        </div>
      </section>

      <FinalCta locale={locale} />
    </main>
  )
}
