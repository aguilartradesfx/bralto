'use client'

import { useEffect, useState, type ReactNode } from 'react'
import type { Locale } from './primitives'
import { ThemeToggle } from './theme-toggle'

type NavLink = { href: string; label: string }

type Props = {
  locale: Locale
  logo: ReactNode
  links: NavLink[]
  labels: { nav: string; home: string; cta: string; theme: string; menu: string; close: string; language: string }
}

function LangSwitch({ locale, label }: { locale: Locale; label: string }) {
  return (
    <span className="hm-lang" role="group" aria-label={label}>
      {(['es', 'en'] as const).map((l) =>
        l === locale ? (
          <span key={l} aria-current="true">
            {l.toUpperCase()}
          </span>
        ) : (
          <a key={l} href={`/${l}`} hrefLang={l} lang={l}>
            {l.toUpperCase()}
          </a>
        ),
      )}
    </span>
  )
}

export function HomeNav({ locale, logo, links, labels }: Props) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const cta = (
    <a href={`/${locale}/agendar`} className="hm-btn hm-btn--solid hm-btn--sm">
      {labels.cta}
    </a>
  )

  return (
    <header className="hm-nav">
      <nav className="hm-nav__bar hm-glass" aria-label={labels.nav}>
        <a href={`/${locale}`} className="hm-nav__logo" aria-label={labels.home}>
          {logo}
        </a>
        <ul className="hm-nav__links">
          {links.map((l) => (
            <li key={l.href}>
              <a className="hm-nav__link" href={l.href}>
                {l.label}
              </a>
            </li>
          ))}
        </ul>
        <div className="hm-nav__right">
          <LangSwitch locale={locale} label={labels.language} />
          <ThemeToggle label={labels.theme} />
          <span className="hm-nav__cta">{cta}</span>
          <button
            type="button"
            className="hm-nav__menu"
            aria-expanded={open}
            aria-controls="hm-menu"
            onClick={() => setOpen((o) => !o)}
          >
            <span className="hm-nav__burger" aria-hidden="true" />
            {open ? labels.close : labels.menu}
          </button>
        </div>
      </nav>

      <div id="hm-menu" className="hm-menu hm-glass" hidden={!open}>
        <ul className="hm-menu__links">
          {links.map((l) => (
            <li key={l.href}>
              <a href={l.href} onClick={() => setOpen(false)}>
                {l.label}
              </a>
            </li>
          ))}
        </ul>
        <div className="hm-menu__foot">
          <LangSwitch locale={locale} label={labels.language} />
          {cta}
        </div>
      </div>
    </header>
  )
}
