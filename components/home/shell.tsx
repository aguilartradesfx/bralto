import './home.css'
import type { ReactNode } from 'react'
import { getTranslations } from 'next-intl/server'
import { themeBootScript } from '@/lib/home/theme'
import { jetbrainsMono, sora } from './fonts'
import { HomeFooter } from './home-footer'
import { HomeNav } from './home-nav'
import { BraltoLogo } from './logo'
import { Ambient, type Locale } from './primitives'
import { Specular } from './specular'

// Estructura de las páginas con el diseño nuevo (home y /casos): fuentes, tema sin
// flash, fondo, nav, footer y reflejo del vidrio.
// page = 'home' → los links del nav son anclas de la misma página; en otras páginas
// apuntan a las secciones del home.
export async function SiteShell({ locale, page, children }: { locale: Locale; page: 'home' | 'cases'; children: ReactNode }) {
  const t = await getTranslations({ locale, namespace: 'Home.nav' })
  const home = page === 'home' ? '' : `/${locale}`

  const links = [
    { href: `${home}#como-funciona`, label: t('links.sistema') },
    { href: page === 'home' ? '#casos-reales' : `/${locale}/casos`, label: t('links.casos') },
    { href: `${home}#plataforma`, label: t('links.plataforma') },
    { href: `${home}#faq`, label: t('links.faq') },
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
        languagePath={page === 'home' ? '' : '/casos'}
      />
      {children}
      <HomeFooter locale={locale} />
      <Specular />
    </div>
  )
}
