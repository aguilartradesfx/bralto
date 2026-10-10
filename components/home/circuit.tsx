import { getTranslations } from 'next-intl/server'
import { CircuitDeal } from './circuit-deal'
import { SectionHead, type Locale } from './primitives'

type Layer = { title: string; body: string }

// Un sitio web es solo la puerta: detrás van las seis capas del sistema (atraer, captar, atender,
// clientes, operación, accesos), que salen de detrás de "Su sitio web" con el scroll
export async function Circuit({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'Home.system' })
  const layers = t.raw('layers') as Layer[]

  return (
    <section id="como-funciona" className="hm-section hm-section--stage" aria-labelledby="hm-system-title">
      <div className="hm-wrap">
        <SectionHead compact center id="hm-system-title" eyebrow={t('eyebrow')} light={t('titleLight')} bold={t('titleBold')} />

        <CircuitDeal hubLabel={t('hubLabel')} hubTitle={t('hubTitle')} layers={layers} />

        <p className="hm-closing hm-rv">
          {t('closingLight')} <span className="b">{t('closingBold')}</span>
        </p>
      </div>
    </section>
  )
}
