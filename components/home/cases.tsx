import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { clients } from '@/app/servicios/sitios-web/clients'
import { ConnectedCarousel, type ConnectedItem } from '@/components/ui/connected-carousel'
import { firstSentence } from '@/lib/home/text'
import { Arrow } from './icons'
import { SectionHead, type Locale } from './primitives'

// Casos reales del home: un carrusel con la portada de cada proyecto, lo que se construyó, el
// punto de partida (la primera frase de su historia) y el link a su página; arriba, a /casos
export async function Cases({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'Home.cases' })

  const items: ConnectedItem[] = clients.map((client) => {
    const info = locale === 'en' && client.en ? client.en : client
    const story = (locale === 'en' ? client.en?.story : undefined) ?? client.story
    return {
      id: client.id,
      title: info.tagline,
      text: firstSentence(story),
      name: client.name,
      tag: info.industry,
      image: client.coverImage,
      alt: info.coverAlt ?? client.coverAlt,
      href: `/${locale}/servicios/sitios-web/${client.id}`,
    }
  })

  return (
    <section id="casos-reales" className="hm-section" aria-labelledby="hm-cases-title">
      <div className="hm-wrap">
        <div className="hm-cases__head">
          <SectionHead id="hm-cases-title" light={t('titleLight')} bold={t('titleBold')} />
          <Link href={`/${locale}/casos`} className="hm-btn hm-btn--glass hm-glass hm-rv">
            {t('all')}
            <Arrow />
          </Link>
        </div>

        <ConnectedCarousel
          className="hm-cases__carousel"
          items={items}
          ariaLabel={t('carousel')}
          viewLabel={t('view')}
          viewIcon={<Arrow />}
          linkClassName="hm-btn hm-btn--glass hm-glass hm-btn--sm"
          positionLabel={t.raw('position') as string}
        />
      </div>
    </section>
  )
}
