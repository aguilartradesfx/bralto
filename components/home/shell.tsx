import './home.css'
import type { ReactNode } from 'react'
import { getTranslations } from 'next-intl/server'
import { themeBootScript } from '@/lib/home/theme'
import { jetbrainsMono, sora } from './fonts'
import { HomeFooter } from './home-footer'
import { HomeNav } from './home-nav'
import type { MegaGroup } from './services'
import { BraltoLogo } from './logo'
import { Ambient, type Locale } from './primitives'
import { Specular } from './specular'

// Estructura de todas las páginas públicas (vive en el layout de [locale]): fuentes,
// tema sin flash, fondo, nav con megamenú, footer y reflejo del vidrio.
export async function SiteShell({ locale, children }: { locale: Locale; children: ReactNode }) {
  const t = await getTranslations({ locale, namespace: 'Home.nav' })

  return (
    <div className={`hm ${sora.variable} ${jetbrainsMono.variable}`} data-theme="dark" suppressHydrationWarning>
      {/* Fija el tema antes del primer pintado (sin flash); debe ser el primer hijo */}
      <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      <Ambient />
      <HomeNav
        locale={locale}
        logo={<BraltoLogo />}
        groups={t.raw('groups') as MegaGroup[]}
        labels={{
          nav: t('label'),
          home: t('home'),
          sistema: t('links.sistema'),
          casos: t('links.casos'),
          plataforma: t('links.plataforma'),
          about: t('links.about'),
          services: t('services'),
          cta: t('cta'),
          back: t('back'),
          theme: t('theme'),
          menu: t('menu'),
          close: t('close'),
          language: t('language'),
          megaEyebrow: t('mega.eyebrow'),
          megaTitle: t('mega.title'),
          megaText: t('mega.text'),
          megaNote: t('mega.note'),
          megaAll: t('mega.all'),
        }}
      />
      {children}
      <HomeFooter locale={locale} />
      <Specular />
    </div>
  )
}
