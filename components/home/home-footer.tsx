import { getTranslations } from 'next-intl/server'
import { BraltoLogo } from './logo'
import type { Locale } from './primitives'

const SERVICES = [
  ['sitiosWeb', 'sitios-web'],
  ['produccionContenido', 'produccion-contenido'],
  ['campanas', 'campanas'],
  ['asesoria', 'asesoria'],
  ['automatizacion', 'automatizacion'],
  ['sistemasInternos', 'sistemas-internos'],
] as const

export async function HomeFooter({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'Home' })
  // Las etiquetas de servicios y "Sobre nosotros" son las mismas del nav del resto del sitio
  const nav = await getTranslations({ locale, namespace: 'Navbar' })

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
            {SERVICES.map(([key, slug]) => (
              <li key={slug}>
                <a href={`/${locale}/servicios/${slug}`}>{nav(`items.${key}.label`)}</a>
              </li>
            ))}
          </ul>
        </nav>

        <nav className="hm-footer__col" aria-labelledby="hm-footer-company">
          <h2 id="hm-footer-company">{t('footer.company')}</h2>
          <ul>
            <li>
              <a href={`/${locale}/sobre-nosotros`}>{nav('navLinks.sobreNosotros')}</a>
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
