'use client'

import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Arrow } from './icons'
import type { Locale } from './primitives'
import { serviceHref, type MegaGroup } from './services'
import { ThemeToggle } from './theme-toggle'

export type NavLabels = {
  nav: string
  home: string
  sistema: string
  casos: string
  plataforma: string
  about: string
  services: string
  cta: string
  back: string
  theme: string
  menu: string
  close: string
  language: string
  megaEyebrow: string
  megaTitle: string
  megaText: string
  megaNote: string
  megaAll: string
}

type Props = { locale: Locale; logo: ReactNode; groups: MegaGroup[]; labels: NavLabels }

// Flujos donde el nav no debe distraer: sin links ni megamenú
const FOCUS_PATHS = ['/agendar', '/confirmacion', '/listo']
// Los mismos fuera de /es y /en (solo en español)
const FOCUS_ROOT_PATHS = ['/payment-info']

function LangSwitch({ locale, label, pathname }: { locale: Locale; label: string; pathname: string }) {
  const rest = pathname.replace(/^\/(es|en)(?=\/|$)/, '')
  return (
    <span className="hm-lang" role="group" aria-label={label}>
      {(['es', 'en'] as const).map((l) =>
        l === locale ? (
          <span key={l} aria-current="true">
            {l.toUpperCase()}
          </span>
        ) : (
          <a key={l} href={`/${l}${rest}`} hrefLang={l} lang={l}>
            {l.toUpperCase()}
          </a>
        ),
      )}
    </span>
  )
}

export function HomeNav({ locale, logo, groups, labels }: Props) {
  const pathname = usePathname() || `/${locale}`
  const onHome = pathname === `/${locale}` || pathname === `/${locale}/`
  const focus =
    FOCUS_PATHS.some((p) => pathname.startsWith(`/${locale}${p}`)) ||
    FOCUS_ROOT_PATHS.some((p) => pathname.startsWith(p))
  const home = onHome ? '' : `/${locale}`

  const [menuOpen, setMenuOpen] = useState(false)
  const [megaOpen, setMegaOpen] = useState(false)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const megaRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  // Si lo abrió el puntero al pasar, el clic que sigue no lo cierra
  const hoverOpened = useRef(false)

  const links = [
    { href: `${home}#como-funciona`, label: labels.sistema },
    { href: `/${locale}/casos`, label: labels.casos },
    { href: `/${locale}/plataforma`, label: labels.plataforma },
    { href: `/${locale}/sobre-nosotros`, label: labels.about },
  ]

  // Al navegar se cierra todo
  useEffect(() => {
    setMenuOpen(false)
    setMegaOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!megaOpen) hoverOpened.current = false
  }, [megaOpen])

  // Al abrir el menú móvil, el foco entra a su primer elemento
  useEffect(() => {
    if (!menuOpen) return
    const frame = requestAnimationFrame(() => menuRef.current?.querySelector<HTMLElement>('summary, a[href], button')?.focus())
    return () => cancelAnimationFrame(frame)
  }, [menuOpen])

  // Tab desde el último elemento del menú vuelve al botón "Menú" en vez de irse a la página de atrás
  const onMenuKeyDown = (e: ReactKeyboardEvent) => {
    if (e.key !== 'Tab' || e.shiftKey) return
    const items = [...(menuRef.current?.querySelectorAll<HTMLElement>('summary, a[href], button') ?? [])].filter((el) => el.offsetParent !== null)
    if (document.activeElement !== items[items.length - 1]) return
    e.preventDefault()
    menuButtonRef.current?.focus()
  }

  useEffect(() => {
    if (!menuOpen && !megaOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Si el foco estaba en el panel o en el menú, vuelve a su botón en vez de perderse
        if (panelRef.current?.contains(document.activeElement)) triggerRef.current?.focus()
        if (menuRef.current?.contains(document.activeElement)) menuButtonRef.current?.focus()
        setMenuOpen(false)
        setMegaOpen(false)
      }
    }
    const onPointer = (e: PointerEvent) => {
      if (megaOpen && megaRef.current && !megaRef.current.contains(e.target as Node)) setMegaOpen(false)
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('pointerdown', onPointer)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('pointerdown', onPointer)
    }
  }, [menuOpen, megaOpen])

  const openMega = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    if (!megaOpen) hoverOpened.current = true
    setMegaOpen(true)
  }
  const closeMegaSoon = () => {
    closeTimer.current = setTimeout(() => {
      // Con el foco del teclado adentro, que el mouse salga no lo cierra
      if (!panelRef.current?.contains(document.activeElement)) setMegaOpen(false)
    }, 160)
  }

  // El panel va en el HTML después de toda la barra: el Tab se lleva a mano adentro y
  // de vuelta, para que siga justo después de "Servicios"
  const firstPanelItem = () => panelRef.current?.querySelector<HTMLElement>('a[href], button')
  const onTriggerKeyDown = (e: ReactKeyboardEvent) => {
    if (e.key !== 'Tab' || e.shiftKey || !megaOpen) return
    const first = firstPanelItem()
    if (!first) return
    e.preventDefault()
    first.focus()
  }
  const onPanelKeyDown = (e: ReactKeyboardEvent) => {
    if (e.key !== 'Tab') return
    const items = [...(panelRef.current?.querySelectorAll<HTMLElement>('a[href], button') ?? [])]
    if (e.shiftKey && document.activeElement === items[0]) {
      e.preventDefault()
      triggerRef.current?.focus()
    } else if (!e.shiftKey && document.activeElement === items[items.length - 1]) {
      e.preventDefault()
      setMegaOpen(false)
      triggerRef.current?.closest('li')?.nextElementSibling?.querySelector<HTMLElement>('a[href]')?.focus()
    }
  }

  const cta = (
    <Link href={`/${locale}/agendar`} className="hm-btn hm-btn--solid hm-btn--sm">
      {labels.cta}
    </Link>
  )

  if (focus) {
    return (
      <header className="hm-nav">
        <nav className="hm-nav__bar hm-glass" aria-label={labels.nav}>
          <Link href={`/${locale}`} className="hm-nav__logo" aria-label={labels.home}>
            {logo}
          </Link>
          <div className="hm-nav__right">
            <ThemeToggle label={labels.theme} />
            <Link href={`/${locale}`} className="hm-nav__back">
              <Arrow />
              {labels.back}
            </Link>
          </div>
        </nav>
      </header>
    )
  }

  return (
    <header className="hm-nav">
      <div ref={megaRef} className="hm-nav__wrap" onMouseLeave={closeMegaSoon}>
        <nav className="hm-nav__bar hm-glass" aria-label={labels.nav}>
          <Link href={`/${locale}`} className="hm-nav__logo" aria-label={labels.home}>
            {logo}
          </Link>
          <ul className="hm-nav__links">
            <li>
              <button
                ref={triggerRef}
                type="button"
                className="hm-nav__link hm-nav__trigger"
                aria-expanded={megaOpen}
                aria-controls="hm-mega"
                onMouseEnter={openMega}
                onClick={(e) => {
                  // Clic de puntero sobre un panel que el hover acaba de abrir: se queda abierto
                  // (detail es 0 cuando lo activa el teclado)
                  if (e.detail > 0 && hoverOpened.current) {
                    hoverOpened.current = false
                    return
                  }
                  setMegaOpen((o) => !o)
                }}
                onKeyDown={onTriggerKeyDown}
              >
                {labels.services}
                <span className="hm-nav__chev" aria-hidden="true" />
              </button>
            </li>
            {links.map((l) => (
              <li key={l.href}>
                <Link
                  className="hm-nav__link"
                  href={l.href}
                  aria-current={pathname === l.href ? 'page' : undefined}
                  onMouseEnter={closeMegaSoon}
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="hm-nav__right">
            <LangSwitch locale={locale} label={labels.language} pathname={pathname} />
            <span className="hm-nav__theme">
              <ThemeToggle label={labels.theme} />
            </span>
            <span className="hm-nav__cta">{cta}</span>
            <button
              ref={menuButtonRef}
              type="button"
              className="hm-nav__menu"
              aria-expanded={menuOpen}
              aria-controls="hm-menu"
              onClick={() => setMenuOpen((o) => !o)}
            >
              <span className="hm-nav__burger" aria-hidden="true" />
              {menuOpen ? labels.close : labels.menu}
            </button>
          </div>
        </nav>

        {/* Megamenú de servicios (escritorio) */}
        <div
          ref={panelRef}
          id="hm-mega"
          className={cn('hm-mega hm-glass hm-glass--thick', megaOpen && 'is-open')}
          onMouseEnter={openMega}
          onKeyDown={onPanelKeyDown}
          hidden={!megaOpen}
        >
          {groups.map((group) => (
            <div key={group.heading} className="hm-mega__group">
              <p className="hm-mega__heading">{group.heading}</p>
              <ul>
                {group.items.map((item) => {
                  const href = serviceHref(locale, item.key)
                  const external = item.key === 'funnelLab'
                  return (
                    <li key={item.key}>
                      <a
                        className="hm-mega__item"
                        href={href}
                        aria-current={pathname === href ? 'page' : undefined}
                        {...(external ? { target: '_blank', rel: 'noopener' } : {})}
                      >
                        <span className="hm-mega__label">
                          {item.label}
                          {external && <span aria-hidden="true"> ↗</span>}
                        </span>
                        <span className="hm-mega__desc">{item.desc}</span>
                      </a>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
          <div className="hm-mega__cta hm-inset">
            <p className="hm-mega__eyebrow">{labels.megaEyebrow}</p>
            <p className="hm-mega__title">{labels.megaTitle}</p>
            <p className="hm-mega__text">{labels.megaText}</p>
            {cta}
            <p className="hm-mega__note">{labels.megaNote}</p>
          </div>
          <div className="hm-mega__foot">
            <Link href={`/${locale}/servicios`}>
              {labels.megaAll}
              <Arrow />
            </Link>
          </div>
        </div>
      </div>

      {/* Menú móvil */}
      <div ref={menuRef} id="hm-menu" className="hm-menu hm-glass" hidden={!menuOpen} onKeyDown={onMenuKeyDown}>
        <details className="hm-menu__services">
          <summary>
            {labels.services}
            <span className="hm-nav__chev" aria-hidden="true" />
          </summary>
          {groups.map((group) => (
            <div key={group.heading} className="hm-menu__group">
              <p className="hm-mega__heading">{group.heading}</p>
              <ul>
                {group.items.map((item) => (
                  <li key={item.key}>
                    <a href={serviceHref(locale, item.key)} {...(item.key === 'funnelLab' ? { target: '_blank', rel: 'noopener' } : {})}>
                      {item.label}
                      {item.key === 'funnelLab' && <span aria-hidden="true"> ↗</span>}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </details>
        <ul className="hm-menu__links">
          {links.map((l) => (
            <li key={l.href}>
              <Link href={l.href} onClick={() => setMenuOpen(false)}>
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="hm-menu__foot">
          <LangSwitch locale={locale} label={labels.language} pathname={pathname} />
          {/* En teléfonos el tema va aquí y la barra queda en logo y menú */}
          <span className="hm-menu__theme">
            <ThemeToggle label={labels.theme} />
          </span>
          {cta}
        </div>
      </div>
    </header>
  )
}
