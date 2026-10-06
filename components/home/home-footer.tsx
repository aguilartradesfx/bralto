import { getTranslations } from 'next-intl/server'
import { BraltoLogo } from './logo'
import type { Locale } from './primitives'
import { SERVICE_PATHS, type MegaGroup } from './services'

export async function HomeFooter({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'Home' })
  // Mismas etiquetas que el megamenú; FunnelLab es externo y se queda en el nav
  const services = (t.raw('nav.groups') as MegaGroup[]).flatMap((g) => g.items).filter((item) => SERVICE_PATHS[item.key])

  return (
    <footer className="hm-footer">
      <div className="hm-wrap hm-footer__grid">
        <div className="hm-footer__brand">
          <BraltoLogo />
          <p>{t('footer.tagline')}</p>
          <p className="hm-footer__legal">{t('footer.copyright', { year: new Date().getFullYear() })}</p>
        </div>

        <nav className="hm-footer__col" aria-labelledby="hm-footer-services">
          <h2 id="hm-footer-services">{t('footer.services')}</h2>
          <ul>
            {services.map((item) => (
              <li key={item.key}>
                <a href={`/${locale}${SERVICE_PATHS[item.key]}`}>{item.label}</a>
              </li>
            ))}
          </ul>
        </nav>

        <nav className="hm-footer__col" aria-labelledby="hm-footer-company">
          <h2 id="hm-footer-company">{t('footer.company')}</h2>
          <ul>
            <li>
              <a href={`/${locale}/casos`}>{t('nav.links.casos')}</a>
            </li>
            <li>
              <a href={`/${locale}/plataforma`}>{t('nav.links.plataforma')}</a>
            </li>
            <li>
              <a href={`/${locale}/sobre-nosotros`}>{t('nav.links.about')}</a>
            </li>
            <li>
              <a href={`/${locale}/agendar`}>{t('nav.cta')}</a>
            </li>
            <li>
              <a href={locale === 'es' ? '/en' : '/es'} hrefLang={locale === 'es' ? 'en' : 'es'}>
                {locale === 'es' ? 'English' : 'Español'}
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  )
}
