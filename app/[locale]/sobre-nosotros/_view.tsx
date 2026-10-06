import Image from 'next/image'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { Arrow, Check } from '@/components/home/icons'
import { SectionHead, type Locale } from '@/components/home/primitives'
import '@/components/home/pages.css'

const PHOTO_1 = 'https://assets.cdn.filesafe.space/hdVpvshZP3RGJQbxx8GA/media/69ffbef9728556272106b8ac.jpg'
const PHOTO_2 = 'https://assets.cdn.filesafe.space/hdVpvshZP3RGJQbxx8GA/media/69ffc4a9a7b9e0385a428428.jpg'

const ALT = {
  es: { founder: 'Alejandro Aguilar, fundador de Bralto', portrait: 'Alejandro Aguilar' },
  en: { founder: 'Alejandro Aguilar, founder of Bralto', portrait: 'Alejandro Aguilar' },
}

export default async function SobreNosotrosView({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'AboutPage' })
  const cta = await getTranslations({ locale, namespace: 'Home.finalCta' })
  const principles = t.raw('principles.items') as { title: string; body: string }[]

  return (
    <main>
      <section className="hm-hero hm-hero--page" aria-labelledby="ab-title">
        <div className="hm-wrap">
          <p className="hm-eyebrow hm-in">{t('hero.eyebrow')}</p>
          <h1 id="ab-title" className="hm-page-title">
            <span className="hm-hero__l1">{t('hero.headline')}</span> <span className="hm-hero__l2">{t('hero.headlineItalic')}</span>
          </h1>
          <p className="hm-lead hm-in">{t('hero.sub')}</p>
        </div>
      </section>

      <section className="hm-section hm-section--tight" aria-labelledby="ab-origin-title">
        <div className="hm-wrap ab-origin">
          <figure className="ab-photo hm-glass hm-glass--thick hm-rv">
            <Image src={PHOTO_1} alt={ALT[locale].founder} width={640} height={800} priority sizes="(min-width: 1000px) 520px, 100vw" />
          </figure>
          <div>
            <SectionHead id="ab-origin-title" eyebrow={t('origin.eyebrow')} light={t('origin.headline')} bold={t('origin.headlineItalic')} />
            <div className="ab-prose">
              <p>{t('origin.p1')}</p>
              <p>{t('origin.p2')}</p>
              <p>{t('origin.p3')}</p>
            </div>
            <p className="ab-stat">
              <span>{t('origin.statValue')}</span>
              {t('origin.statLabel')}
            </p>
          </div>
        </div>
      </section>

      <section className="hm-section" aria-labelledby="ab-mission-title">
        <div className="hm-wrap">
          <h2 id="ab-mission-title" className="hm-eyebrow">
            {t('mission.eyebrow')}
          </h2>
          <div className="ab-mission">
            {(['card1', 'card2'] as const).map((card) => (
              <div key={card} className="ab-mission__card hm-glass hm-glass--thick hm-rv">
                <p className="pg-tag">{t(`mission.${card}Label`)}</p>
                <p className="ab-mission__body">{t(`mission.${card}Body`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="hm-section" aria-labelledby="ab-principles-title">
        <div className="hm-wrap">
          <SectionHead id="ab-principles-title" eyebrow={t('principles.eyebrow')} light={t('principles.headline')} bold={t('principles.headlineItalic')} />
          <ul className="pg-checks ab-principles hm-glass hm-glass--thick hm-rv">
            {principles.map((p) => (
              <li key={p.title}>
                <Check />
                <h3>{p.title}</h3>
                <p>{p.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="hm-section hm-section--last" aria-labelledby="ab-close-title">
        <div className="hm-wrap ab-close">
          <div>
            <h2 id="ab-close-title" className="hm-h2">
              <span>{t('close.headline')}</span> <span className="b">{t('close.headlineItalic')}</span>
            </h2>
            <p className="hm-lead">{t('close.body')}</p>
            <p className="ab-signature">{t('close.signature')}</p>
            <Link href={`/${locale}/agendar`} className="hm-btn hm-btn--solid">
              {t('close.cta')}
              <Arrow />
            </Link>
            <p className="ab-close__note">{cta('note')}</p>
          </div>
          <figure className="ab-photo ab-photo--small hm-glass hm-rv">
            <Image src={PHOTO_2} alt={ALT[locale].portrait} width={480} height={560} sizes="(min-width: 1000px) 440px, 100vw" />
          </figure>
        </div>
      </section>
    </main>
  )
}
