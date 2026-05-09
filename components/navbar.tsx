'use client'
import React, { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import {
  Menu as MenuIcon, X, ChevronDown,
  Globe, Zap, BarChart3, MessageSquare, Cpu, LayoutDashboard, TrendingUp,
  ArrowRight, ArrowUpRight,
} from 'lucide-react'
import { useTranslations, useLocale } from 'next-intl'
import { usePathname } from 'next/navigation'

export function Navbar() {
  const t        = useTranslations('Navbar')
  const locale   = useLocale()
  const pathname = usePathname()
  const otherLocale = locale === 'es' ? 'en' : 'es'
  const switchHref  = pathname.replace(`/${locale}`, `/${otherLocale}`)

  const [scrolled,           setScrolled]           = useState(false)
  const [megaOpen,           setMegaOpen]           = useState(false)
  const [mobileOpen,         setMobileOpen]         = useState(false)
  const [mobileServicesOpen, setMobileServicesOpen] = useState(false)

  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const panelRef   = useRef<HTMLDivElement>(null)

  const navLinks = [
    { label: t('navLinks.inicio'),        href: `/${locale}/#inicio` },
    { label: t('navLinks.comoFunciona'),  href: `/${locale}/#como-funciona` },
    { label: t('navLinks.casosReales'),   href: `/${locale}/#casos-reales` },
    { label: t('navLinks.plataforma'),    href: `/${locale}/#plataforma` },
  ]

  const serviceCols = [
    {
      heading: t('presenciaHeading'),
      items: [
        { label: t('items.sitiosWeb.label'),           href: `/${locale}/servicios/sitios-web`,           icon: Globe,          desc: t('items.sitiosWeb.desc') },
        { label: t('items.produccionContenido.label'), href: `/${locale}/servicios/produccion-contenido`, icon: BarChart3,      desc: t('items.produccionContenido.desc') },
        { label: t('items.campanas.label'),            href: `/${locale}/servicios/campanas`,             icon: MessageSquare,  desc: t('items.campanas.desc') },
        { label: t('items.asesoria.label'),            href: `/${locale}/servicios/asesoria`,             icon: Zap,            desc: t('items.asesoria.desc') },
      ],
    },
    {
      heading: t('automacionHeading'),
      items: [
        { label: t('items.automatizacion.label'),    href: `/${locale}/servicios/automatizacion`,    icon: Cpu,             desc: t('items.automatizacion.desc') },
        { label: t('items.sistemasInternos.label'),  href: `/${locale}/servicios/sistemas-internos`, icon: LayoutDashboard, desc: t('items.sistemasInternos.desc') },
        { label: t('items.funnelLab.label'),         href: 'https://funnellabs.bralto.io',           icon: TrendingUp,      desc: t('items.funnelLab.desc') },
      ],
    },
  ]

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { setMegaOpen(false); setMobileOpen(false) } }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const openMega    = () => { if (closeTimer.current) clearTimeout(closeTimer.current); setMegaOpen(true) }
  const closeSoon   = () => { closeTimer.current = setTimeout(() => setMegaOpen(false), 200) }
  const closeMega   = () => { if (closeTimer.current) clearTimeout(closeTimer.current); setMegaOpen(false) }
  const closeMobile = () => setMobileOpen(false)

  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = panelRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    el.style.setProperty('--mouse-x', `${e.clientX - r.left}px`)
    el.style.setProperty('--mouse-y', `${e.clientY - r.top}px`)
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex flex-col items-center pointer-events-none">

      {/* ── Pill nav ── */}
      <div
        className={cn(
          'pointer-events-auto mt-4 flex items-center gap-1 px-2 py-2 rounded-full transition-all duration-300',
          scrolled
            ? 'border border-white/[0.08] bg-[#060607]/90 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.6)]'
            : 'border border-white/[0.06] bg-[#060607]/70 backdrop-blur-xl'
        )}
      >
        {/* Logo */}
        <a href={`/${locale}`} className="flex items-center shrink-0 px-3 py-1.5">
          <Image
            src="/logo-white.svg"
            alt="Bralto"
            width={90}
            height={28}
            className="h-6 w-auto object-contain"
            priority
          />
        </a>

        {/* Desktop links — hidden on mobile */}
        <div className="hidden lg:flex items-center gap-0.5">
          {/* Servicios mega trigger */}
          <button
            onMouseEnter={openMega}
            onMouseLeave={closeSoon}
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-3.5 py-2 text-[13px] font-medium transition-colors duration-200',
              megaOpen
                ? 'text-white bg-white/[0.07]'
                : 'text-white/50 hover:text-white hover:bg-white/[0.05]'
            )}
          >
            {t('services')}
            <ChevronDown size={12} className={cn('transition-transform duration-200 opacity-60', megaOpen && 'rotate-180')} />
          </button>

          {/* Nav links */}
          {navLinks.slice(0, 3).map(link => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-full px-3.5 py-2 text-[13px] font-medium text-white/50 hover:text-white hover:bg-white/[0.05] transition-all duration-200"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Locale toggle */}
        <div className="hidden lg:flex items-center rounded-full px-1.5 py-1 gap-0.5 ml-1" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
          {(['es', 'en'] as const).map(l =>
            l === locale ? (
              <span key={l} className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white/[0.1] text-white uppercase">{l}</span>
            ) : (
              <Link key={l} href={switchHref} className="text-[11px] font-bold px-2 py-0.5 rounded-full text-white/35 hover:text-white/60 uppercase transition-colors">{l}</Link>
            )
          )}
        </div>

        {/* Divider */}
        <div className="hidden lg:block w-px h-5 bg-white/[0.08] mx-1" />

        {/* CTAs */}
        <div className="hidden lg:flex items-center gap-1.5 pr-1">
          <Link
            href={`/${locale}/agendar`}
            className="rounded-full px-4 py-2 text-[13px] font-medium text-white/50 hover:text-white transition-colors duration-200"
          >
            {t('bookCall')}
          </Link>
          <Link
            href={`/${locale}/precios`}
            className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-[13px] font-semibold text-black uppercase tracking-wide hover:bg-white/90 transition-all duration-200"
          >
            {t('seeServices')}
            <ArrowRight size={12} />
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="lg:hidden pointer-events-auto p-2 mr-1 text-white/60 hover:text-white transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={18} /> : <MenuIcon size={18} />}
        </button>
      </div>

      {/* ── Mega dropdown — anchored below the pill ── */}
      {megaOpen && (
        <div
          className="pointer-events-auto mt-2 px-4"
          style={{ width: '85vw' }}
          onMouseEnter={openMega}
          onMouseLeave={closeSoon}
        >
          <div
            ref={panelRef}
            onMouseMove={onMouseMove}
            className="menu-panel rounded-2xl"
            style={{
              background: 'rgba(8, 8, 10, 0.75)',
              backdropFilter: 'blur(32px) saturate(180%)',
              WebkitBackdropFilter: 'blur(32px) saturate(180%)',
            }}
          >
            <div className="p-5">
              <div style={{ display: 'flex', flexDirection: 'row', gap: '20px', alignItems: 'flex-start', width: '100%' }}>

                {/* Col 1: Navegación */}
                <div style={{ width: '160px', flexShrink: 0 }}>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/25 mb-3 px-1">
                    {t('navigationHeading')}
                  </p>
                  <ul className="space-y-0.5">
                    {navLinks.map(link => (
                      <li key={link.href}>
                        <a
                          href={link.href}
                          onClick={closeMega}
                          className="group flex items-center justify-between rounded-xl px-3 py-2 text-sm font-medium text-white/55 hover:text-white hover:bg-white/[0.05] transition-all"
                        >
                          {link.label}
                          <ArrowUpRight size={10} className="opacity-0 group-hover:opacity-35 transition-opacity shrink-0 ml-2" />
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>

                <div style={{ width: '1px', alignSelf: 'stretch', background: 'rgba(255,255,255,0.06)', flexShrink: 0 }} />

                {/* Cols 2 & 3: Servicios */}
                {serviceCols.map((col, i) => (
                  <React.Fragment key={col.heading}>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/25 mb-3 px-1">
                        {col.heading}
                      </p>
                      <ul className="space-y-0.5">
                        {col.items.map(item => (
                          <li key={item.href}>
                            <Link
                              href={item.href}
                              onClick={closeMega}
                              className="group flex items-start gap-3 rounded-xl px-3 py-2 hover:bg-white/[0.05] transition-colors"
                            >
                              <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-white/[0.04] border border-white/[0.07] group-hover:bg-[#5bb6ff]/10 group-hover:border-[#5bb6ff]/20 transition-all">
                                <item.icon size={12} className="text-white/30 group-hover:text-[#5bb6ff] transition-colors" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-white/65 group-hover:text-white transition-colors leading-tight whitespace-nowrap">
                                  {item.label}
                                </p>
                                <p className="text-xs text-white/28 mt-0.5 whitespace-nowrap">{item.desc}</p>
                              </div>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                    {i === 0 && (
                      <div style={{ width: '1px', alignSelf: 'stretch', background: 'rgba(255,255,255,0.06)', flexShrink: 0 }} />
                    )}
                  </React.Fragment>
                ))}

                <div style={{ width: '1px', alignSelf: 'stretch', background: 'rgba(255,255,255,0.06)', flexShrink: 0 }} />

                {/* Col 4: CTA */}
                <div style={{ width: '190px', flexShrink: 0, background: 'rgba(91,182,255,0.04)', border: '1px solid rgba(91,182,255,0.1)', borderRadius: '14px', padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#5bb6ff]/60 mb-2">
                      {t('ctaHeading')}
                    </p>
                    <h3 className="text-sm font-semibold text-white mb-1.5 leading-snug">
                      {t('ctaTitle')}<br />{t('ctaTitle2')}
                    </h3>
                    <p className="text-xs text-white/38 leading-relaxed">
                      {t('ctaDesc')}
                    </p>
                  </div>
                  <Link
                    href={`/${locale}/agendar`}
                    onClick={closeMega}
                    className="inline-flex items-center justify-center gap-1.5 rounded-full bg-white px-4 py-2 text-xs font-semibold text-black uppercase tracking-wide hover:bg-white/90 transition-all"
                  >
                    {t('ctaBtn')}
                    <ArrowRight size={11} />
                  </Link>
                </div>

              </div>

              <div className="mt-4 pt-4 border-t border-white/[0.05] flex items-center justify-between">
                <Link href={`/${locale}/precios`} onClick={closeMega} className="text-xs font-medium text-white/28 hover:text-white/60 transition-colors">
                  {t('seeAll')}
                </Link>
                <Link href={`/${locale}/agendar`} onClick={closeMega} className="text-xs font-medium text-[#5bb6ff]/70 hover:text-[#5bb6ff] transition-colors">
                  {t('bookFree')}
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Mobile menu — full-width sheet ── */}
      {mobileOpen && (
        <div className="pointer-events-auto w-full mt-2 px-4 lg:hidden">
          <div
            className="rounded-2xl border border-white/[0.07] overflow-hidden"
            style={{
              background: 'rgba(8,8,10,0.95)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
            }}
          >
            <div className="p-4">
              <ul className="flex flex-col gap-0.5 mb-3">
                {navLinks.map(link => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      onClick={closeMobile}
                      className="block rounded-xl px-3 py-2.5 text-sm font-medium text-white/55 hover:text-white hover:bg-white/[0.05] transition-all"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>

              <div className="mb-3">
                <button
                  onClick={() => setMobileServicesOpen(o => !o)}
                  className="flex items-center justify-between w-full rounded-xl px-3 py-2.5 text-sm font-medium text-white/55 hover:text-white hover:bg-white/[0.05] transition-all"
                >
                  {t('services')}
                  <ChevronDown size={14} className={cn('transition-transform duration-200 opacity-50', mobileServicesOpen && 'rotate-180')} />
                </button>
                {mobileServicesOpen && (
                  <div className="mt-1 pl-3 space-y-4">
                    {serviceCols.map(col => (
                      <div key={col.heading}>
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/25 mb-2 px-2">{col.heading}</p>
                        <ul className="space-y-0.5">
                          {col.items.map(item => (
                            <li key={item.href}>
                              <Link
                                href={item.href}
                                onClick={closeMobile}
                                className="flex items-center gap-2.5 rounded-xl px-2 py-2 text-sm text-white/45 hover:text-white hover:bg-white/[0.04] transition-all"
                              >
                                <item.icon size={12} className="text-white/25 shrink-0" />
                                {item.label}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2 pt-3 border-t border-white/[0.06]">
                <Link
                  href={`/${locale}/agendar`}
                  onClick={closeMobile}
                  className="block text-center rounded-full border border-white/[0.12] px-5 py-3 text-sm font-medium text-white/60 hover:text-white transition-all"
                >
                  {t('bookCall')}
                </Link>
                <Link
                  href={`/${locale}/precios`}
                  onClick={closeMobile}
                  className="block text-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-black uppercase tracking-wide hover:bg-white/90 transition-colors"
                >
                  {t('seeServices')}
                </Link>
                <div className="flex items-center justify-center gap-3 pt-1">
                  <span className="text-xs text-white/25">{locale === 'es' ? 'Idioma' : 'Language'}</span>
                  <div className="flex items-center rounded-full px-1.5 py-1 gap-0.5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    {(['es', 'en'] as const).map(l =>
                      l === locale ? (
                        <span key={l} className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-white/[0.1] text-white uppercase">{l}</span>
                      ) : (
                        <Link key={l} href={switchHref} onClick={closeMobile} className="text-[11px] font-bold px-2.5 py-0.5 rounded-full text-white/35 hover:text-white/60 uppercase transition-colors">{l}</Link>
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
