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

const navLinks = [
  { label: 'Inicio',        href: '#inicio' },
  { label: 'Cómo Funciona', href: '#como-funciona' },
  { label: 'Casos Reales',  href: '#casos-reales' },
  { label: 'Plataforma',    href: '#plataforma' },
]

const serviceCols = [
  {
    heading: 'Presencia digital',
    items: [
      { label: 'Sitios web profesionales', href: '/servicios/sitios-web',           icon: Globe,          desc: 'Diseño, SEO y entrega rápida' },
      { label: 'Producción de contenido',  href: '/servicios/produccion-contenido', icon: BarChart3,      desc: 'Videos, stories y estrategia' },
      { label: 'Campañas publicitarias',   href: '/servicios/campanas',             icon: MessageSquare,  desc: 'Ads en Meta, Google y más' },
      { label: 'Asesoría de marketing',    href: '/servicios/asesoria',             icon: Zap,            desc: 'Estrategia y posicionamiento' },
    ],
  },
  {
    heading: 'Automatización e IA',
    items: [
      { label: 'Automatización de procesos', href: '/servicios/automatizacion',    icon: Cpu,             desc: 'Flujos, agentes y workflows' },
      { label: 'Sistemas internos a medida', href: '/servicios/sistemas-internos', icon: LayoutDashboard, desc: 'CRMs, dashboards y herramientas' },
      { label: 'FunnelLab',                  href: '/servicios/funnel-labs',       icon: TrendingUp,      desc: 'Simulá tu funnel antes de invertir' },
    ],
  },
]

export function Navbar() {
  const [scrolled,           setScrolled]           = useState(false)
  const [megaOpen,           setMegaOpen]           = useState(false)
  const [mobileOpen,         setMobileOpen]         = useState(false)
  const [mobileServicesOpen, setMobileServicesOpen] = useState(false)

  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const panelRef   = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMegaOpen(false) }
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
    // header is the containing block for the dropdown (position: relative)
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        scrolled
          ? 'border-b border-white/[0.06] bg-[#080808]/85 backdrop-blur-xl'
          : 'bg-transparent'
      )}
      style={{ position: 'fixed' }} // ensure relative children work
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">

        {/* Logo */}
        <a href="#inicio" className="flex items-center shrink-0">
          <Image src="/logo.png" alt="Bralto" width={120} height={36} className="h-8 w-auto object-contain" priority />
        </a>

        {/* Desktop CTAs */}
        <div className="hidden lg:flex items-center gap-2">

          {/* Menú trigger — hover opens/closes */}
          <button
            onMouseEnter={openMega}
            onMouseLeave={closeSoon}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-colors duration-200',
              megaOpen
                ? 'text-white bg-white/[0.08]'
                : 'text-white/55 hover:text-white hover:bg-white/[0.05]'
            )}
          >
            Menú
            <ChevronDown size={14} className={cn('transition-transform duration-200', megaOpen && 'rotate-180')} />
          </button>

          <Link
            href="/agendar"
            className="inline-flex items-center rounded-full border border-white/[0.14] px-5 py-2 text-sm font-semibold text-white/70 hover:border-white/30 hover:text-white transition-all duration-200"
          >
            Agendar llamada
          </Link>

          <Link
            href="/precios"
            className="inline-flex items-center gap-1.5 rounded-full bg-[#F97316] px-5 py-2 text-sm font-semibold text-white hover:bg-[#ea6c0c] hover:shadow-[0_0_20px_rgba(249,115,22,0.4)] transition-all duration-200"
          >
            Ver servicios
            <ArrowRight size={13} />
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="lg:hidden p-2 text-white/60 hover:text-white"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={20} /> : <MenuIcon size={20} />}
        </button>
      </nav>

      {/* ── Mega dropdown — positioned relative to the full-width header ── */}
      {megaOpen && (
        <div
          // Transparent bridge that fills from navbar bottom to panel top
          // so the mouse can travel from button to panel without closing
          className="absolute left-0 right-0"
          style={{ top: '100%', padding: '8px 12.5% 0' }}
          onMouseEnter={openMega}
          onMouseLeave={closeSoon}
        >
          {/* Glass panel with mouse-tracking glow border */}
          <div
            ref={panelRef}
            onMouseMove={onMouseMove}
            className="menu-panel rounded-2xl"
            style={{
              background: 'rgba(10, 10, 10, 0.65)',
              backdropFilter: 'blur(32px) saturate(180%)',
              WebkitBackdropFilter: 'blur(32px) saturate(180%)',
            }}
          >
            <div className="p-6">
              {/* 4-column layout via inline flex — Tailwind grid can be overridden by specificity issues */}
              <div style={{ display: 'flex', flexDirection: 'row', gap: '24px', alignItems: 'flex-start', width: '100%' }}>

                {/* Col 1: Navegación */}
                <div style={{ width: '170px', flexShrink: 0 }}>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/25 mb-4 px-1">
                    Navegación
                  </p>
                  <ul className="space-y-0.5">
                    {navLinks.map(link => (
                      <li key={link.href}>
                        <a
                          href={link.href}
                          onClick={closeMega}
                          className="group flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium text-white/60 hover:text-white hover:bg-white/[0.05] transition-all"
                        >
                          {link.label}
                          <ArrowUpRight size={11} className="opacity-0 group-hover:opacity-40 transition-opacity shrink-0 ml-2" />
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Divider */}
                <div style={{ width: '1px', alignSelf: 'stretch', background: 'rgba(255,255,255,0.06)', flexShrink: 0 }} />

                {/* Cols 2 & 3: Servicios */}
                {serviceCols.map((col, i) => (
                  <React.Fragment key={col.heading}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/25 mb-4 px-1">
                        {col.heading}
                      </p>
                      <ul className="space-y-0.5">
                        {col.items.map(item => (
                          <li key={item.href}>
                            <Link
                              href={item.href}
                              onClick={closeMega}
                              className="group flex items-start gap-3 rounded-xl px-3 py-2.5 hover:bg-white/[0.05] transition-colors"
                            >
                              <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/5 border border-white/[0.08] group-hover:bg-[#F97316]/10 group-hover:border-[#F97316]/20 transition-all">
                                <item.icon size={13} className="text-white/35 group-hover:text-[#F97316] transition-colors" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-white/70 group-hover:text-white transition-colors leading-tight">
                                  {item.label}
                                </p>
                                <p className="text-xs text-white/30 mt-0.5">{item.desc}</p>
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

                {/* Divider */}
                <div style={{ width: '1px', alignSelf: 'stretch', background: 'rgba(255,255,255,0.06)', flexShrink: 0 }} />

                {/* Col 4: CTA */}
                <div style={{ width: '210px', flexShrink: 0, background: 'rgba(249,115,22,0.05)', border: '1px solid rgba(249,115,22,0.1)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#F97316]/70 mb-3">
                      ¿Por dónde empezar?
                    </p>
                    <h3 className="text-base font-bold text-white mb-2 leading-snug">
                      30 minutos,<br />sin compromiso.
                    </h3>
                    <p className="text-xs text-white/40 leading-relaxed">
                      Entendemos tu negocio y te decimos qué tiene sentido para vos hoy.
                    </p>
                  </div>
                  <Link
                    href="/agendar"
                    onClick={closeMega}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#F97316] hover:bg-[#ea6c0c] px-4 py-2.5 text-sm font-semibold text-white transition-all hover:shadow-[0_0_20px_rgba(249,115,22,0.4)]"
                  >
                    Agendar gratis
                    <ArrowRight size={13} />
                  </Link>
                </div>

              </div>

              {/* Footer */}
              <div className="mt-5 pt-4 border-t border-white/[0.06] flex items-center justify-between">
                <Link href="/precios" onClick={closeMega} className="text-xs font-semibold text-white/30 hover:text-white transition-colors">
                  Ver todos los servicios →
                </Link>
                <Link href="/agendar" onClick={closeMega} className="text-xs font-semibold text-[#F97316] hover:text-[#ea6c0c] transition-colors">
                  Agendá una llamada gratis →
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Mobile menu ── */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-white/[0.06] bg-[#080808]/97 backdrop-blur-xl px-6 py-5">
          <ul className="flex flex-col gap-0.5 mb-4">
            {navLinks.map(link => (
              <li key={link.href}>
                <a href={link.href} onClick={closeMobile} className="block rounded-xl px-3 py-2.5 text-sm font-medium text-white/60 hover:text-white hover:bg-white/[0.05] transition-all">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>

          <div className="mb-4">
            <button
              onClick={() => setMobileServicesOpen(o => !o)}
              className="flex items-center justify-between w-full rounded-xl px-3 py-2.5 text-sm font-medium text-white/60 hover:text-white hover:bg-white/[0.05] transition-all"
            >
              Servicios
              <ChevronDown size={14} className={cn('transition-transform duration-200', mobileServicesOpen && 'rotate-180')} />
            </button>
            {mobileServicesOpen && (
              <div className="mt-2 pl-3 space-y-5">
                {serviceCols.map(col => (
                  <div key={col.heading}>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/25 mb-2 px-1">{col.heading}</p>
                    <ul className="space-y-0.5">
                      {col.items.map(item => (
                        <li key={item.href}>
                          <Link href={item.href} onClick={closeMobile} className="flex items-center gap-2.5 rounded-xl px-2 py-2 text-sm text-white/50 hover:text-white hover:bg-white/[0.04] transition-all">
                            <item.icon size={13} className="text-white/25 shrink-0" />
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

          <div className="flex flex-col gap-2 pt-4 border-t border-white/[0.06]">
            <Link href="/agendar" onClick={closeMobile} className="block text-center rounded-xl border border-white/[0.14] px-5 py-3 text-sm font-semibold text-white/70 hover:text-white transition-all">
              Agendar llamada
            </Link>
            <Link href="/precios" onClick={closeMobile} className="block text-center rounded-xl bg-[#F97316] px-5 py-3 text-sm font-semibold text-white hover:bg-[#ea6c0c] transition-colors">
              Ver servicios
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
