import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { clients } from '@/app/servicios/sitios-web/clients'
import { CaseRow } from './case-row'
import { Arrow } from './icons'
import { SectionHead, type Locale } from './primitives'

// Casos reales del home: los proyectos que ya tienen su página, y el link a /casos
export async function Cases({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'Home.cases' })

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

        <ul className="hm-cases">
          {clients.map((client) => (
            <li key={client.id}>
              <CaseRow client={client} locale={locale} viewLabel={t('view')} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
