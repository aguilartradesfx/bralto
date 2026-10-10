import Image from 'next/image'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { Arrow, Check } from '@/components/home/icons'
import { SectionHead, type Locale } from '@/components/home/primitives'
import '@/components/home/pages.css'
// Retrato del cierre: WebP 1080×1440 (53 KB, el original es un JPG de 1.2 MB)
import signaturePhoto from './alejandro-aguilar-firma.webp'

const PHOTO_1 = 'https://assets.cdn.filesafe.space/hdVpvshZP3RGJQbxx8GA/media/69ffbef9728556272106b8ac.jpg'

const ALT = {
  es: { founder: 'Alejandro Aguilar, fundador de Bralto' },
  en: { founder: 'Alejandro Aguilar, founder of Bralto' },
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
            <SectionHead id="ab-origin-title" light={t('origin.headline')} bold={t('origin.headlineItalic')} />
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
          <h2 id="ab-mission-title" className="hm-subtitle">
            {t('mission.eyebrow')}
          </h2>
          <div className="ab-mission">
            {(['card1', 'card2'] as const).map((card) => (
              <div key={card} className="ab-mission__card hm-rv">
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
            <p className="ab-signature">
              {/* El nombre va al lado: la foto no repite el texto alternativo */}
              <Image src={signaturePhoto} alt="" width={48} height={48} className="ab-signature__photo" placeholder="blur" />
              {t('close.signature')}
            </p>
            <Link href={`/${locale}/agendar`} className="hm-btn hm-btn--solid">
              {t('close.cta')}
              <Arrow />
            </Link>
            <p className="ab-close__note">{cta('note')}</p>
          </div>
        </div>
      </section>
    </main>
  )
}
