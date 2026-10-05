import './home.css'
import { getTranslations } from 'next-intl/server'
import { showPending } from '@/lib/home/pending'
import { themeBootScript } from '@/lib/home/theme'
import { Cases } from './cases'
import { Circuit } from './circuit'
import { Compare } from './compare'
import { Faq } from './faq'
import { FinalCta } from './final-cta'
import { jetbrainsMono, sora } from './fonts'
import { Hero } from './hero'
import { HomeFooter } from './home-footer'
import { HomeNav } from './home-nav'
import { BraltoLogo } from './logo'
import { Guarantee, Offer } from './offer'
import { Platform } from './platform'
import { Ambient, type Locale } from './primitives'
import { Specular } from './specular'
import { Testimonials } from './testimonials'

export async function HomePage({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'Home.nav' })
  // Casos, testimonios y el link a la comunidad tienen datos pendientes: fuera de producción
  const pending = showPending(process.env)

  const links = [
    { href: '#como-funciona', label: t('links.sistema') },
    ...(pending ? [{ href: '#casos-reales', label: t('links.casos') }] : []),
    { href: '#plataforma', label: t('links.plataforma') },
    { href: '#faq', label: t('links.faq') },
  ]

  return (
    <div className={`hm ${sora.variable} ${jetbrainsMono.variable}`} data-theme="dark" suppressHydrationWarning>
      {/* Fija el tema antes del primer pintado (sin flash); debe ser el primer hijo */}
      <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      <Ambient />
      <HomeNav
        locale={locale}
        logo={<BraltoLogo />}
        links={links}
        labels={{
          nav: t('label'),
          home: t('home'),
          cta: t('cta'),
          theme: t('theme'),
          menu: t('menu'),
          close: t('close'),
          language: t('language'),
        }}
      />
      <main>
        <Hero locale={locale} />
        <Compare locale={locale} />
        <Circuit locale={locale} />
        {pending && <Cases locale={locale} />}
        <Platform locale={locale} />
        <Offer locale={locale} showCommunity={pending} />
        <Guarantee locale={locale} />
        {pending && <Testimonials locale={locale} />}
        <Faq locale={locale} />
        <FinalCta locale={locale} />
      </main>
      <HomeFooter locale={locale} />
      <Specular />
    </div>
  )
}
