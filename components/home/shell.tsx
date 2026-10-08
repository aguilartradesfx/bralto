import './home.css'
import type { ReactNode } from 'react'
import { getTranslations } from 'next-intl/server'
import { showPending } from '@/lib/home/pending'
import { themeBootScript } from '@/lib/home/theme'
import { LEGAL_REVIEWED, legalPagesVisible } from '@/lib/legal'
import { ConsentBanner } from './consent-banner'
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
  const tc = await getTranslations({ locale, namespace: 'Home.consent' })
  // Privacidad y términos son borradores: el enlace solo aparece donde se ven las páginas (lib/legal.ts)
  const legal = legalPagesVisible({ reviewed: LEGAL_REVIEWED, pendingVisible: showPending(process.env) })

  return (
    <div className={`hm ${sora.variable} ${jetbrainsMono.variable}`} data-theme="dark" suppressHydrationWarning>
      {/* Fija el tema antes del primer pintado (sin flash); debe ser el primer hijo */}
      <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      {/* Primer foco del teclado: salta las paradas del nav (se ve solo al enfocarlo) */}
      <a href="#contenido" className="hm-skip hm-btn hm-btn--solid hm-btn--sm">
        {t('skip')}
      </a>
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
      <div id="contenido" tabIndex={-1} className="hm-content">
        {children}
      </div>
      <HomeFooter locale={locale} showLegal={legal} />
      <Specular />
      <ConsentBanner
        labels={{
          title: tc('title'),
          text: tc('text'),
          privacy: tc('privacy'),
          essential: tc('essential'),
          accept: tc('accept'),
        }}
        privacyHref={legal ? `/${locale}/privacidad` : undefined}
      />
    </div>
  )
}
