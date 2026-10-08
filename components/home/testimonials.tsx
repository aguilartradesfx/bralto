import { getTranslations } from 'next-intl/server'
import { Play } from './icons'
import { PendingBadge, Ph, SectionHead, type Locale } from './primitives'

type Quote = { text: string; author: string; role: string }

// Oculto en producción hasta tener testimonios reales (1 video + 1–2 citas)
export async function Testimonials({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'Home' })
  const quotes = t.raw('testimonials.quotes') as Quote[]

  return (
    <section className="hm-section hm-pending" aria-labelledby="hm-testimonials-title">
      <div className="hm-wrap">
        <PendingBadge label={t('pending')} />
        <SectionHead
          center
          id="hm-testimonials-title"
          light={t('testimonials.titleLight')}
          bold={t('testimonials.titleBold')}
        />

        <div className="hm-testis">
          <div className="hm-video hm-glass hm-glass--thick hm-rv">
            <div>
              <button type="button" className="hm-video__play" aria-label={t('testimonials.playLabel')} disabled>
                <Play />
              </button>
              <Ph text={t('testimonials.videoPlaceholder')} />
            </div>
          </div>
          {quotes.map((q) => (
            <figure key={q.author} className="hm-quote hm-glass hm-rv">
              <blockquote>
                <Ph text={q.text} />
              </blockquote>
              <figcaption>
                <Ph text={q.author} /> · <Ph text={q.role} />
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}
