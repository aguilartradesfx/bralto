'use client'
import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Menu, X, ChevronDown, Globe, Zap, BarChart3, MessageSquare, Cpu, LayoutDashboard, ChevronRight } from 'lucide-react'

const STRIPE_URL = 'https://buy.stripe.com/7sY7sK4ZBcuE61487P5EY0t'

const megaMenuCols = [
  {
    heading: 'Presencia digital',
    items: [
      { label: 'Sitios web profesionales', href: '/servicios/sitios-web', icon: Globe, desc: 'Diseño, SEO y entrega rápida' },
      { label: 'Producción de contenido', href: '/servicios/produccion-contenido', icon: BarChart3, desc: 'Videos, stories y estrategia' },
      { label: 'Campañas publicitarias', href: '/servicios/campanas', icon: MessageSquare, desc: 'Ads en Meta, Google y más' },
      { label: 'Asesoría de marketing', href: '/servicios/asesoria', icon: Zap, desc: 'Estrategia y posicionamiento' },
    ],
  },
  {
    heading: 'Automatización e IA',
    items: [
      { label: 'Automatización de procesos', href: '/servicios/automatizacion', icon: Cpu, desc: 'Flujos, agentes y workflows' },
      { label: 'Sistemas internos a medida', href: '/servicios/sistemas-internos', icon: LayoutDashboard, desc: 'CRMs, dashboards y herramientas' },
    ],
  },
]

const navLinks = [
  { label: 'Inicio', href: '#inicio' },
  { label: 'Cómo Funciona', href: '#como-funciona' },
  { label: 'Casos Reales', href: '#casos-reales' },
  { label: 'Precio', href: '#inversion' },
  { label: 'Plataforma', href: '#plataforma' },
]

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [megaOpen, setMegaOpen] = useState(false)
  const [servicesAccordion, setServicesAccordion] = useState(false)
  const megaRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  // Close megamenu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        megaRef.current && !megaRef.current.contains(e.target as Node) &&
        triggerRef.current && !triggerRef.current.contains(e.target as Node)
      ) {
        setMegaOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        scrolled
          ? 'border-b border-white/[0.06] bg-[#080808]/80 backdrop-blur-xl'
          : 'bg-transparent'
      )}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        {/* Logo */}
        <a href="#inicio" className="flex items-center">
          <Image
            src="/logo.png"
            alt="Bralto"
            width={120}
            height={36}
            className="h-8 w-auto object-contain"
            priority
          />
        </a>

        {/* Desktop links */}
        <ul className="hidden lg:flex items-center gap-8">
          {navLinks.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="text-sm text-white/55 hover:text-white transition-colors duration-200 font-medium"
              >
                {link.label}
              </a>
            </li>
          ))}

          {/* Servicios trigger */}
          <li className="relative">
            <button
              ref={triggerRef}
              onClick={() => setMegaOpen(o => !o)}
              className={cn(
                'flex items-center gap-1.5 text-sm font-medium transition-colors duration-200',
                megaOpen ? 'text-white' : 'text-white/55 hover:text-white'
              )}
            >
              Servicios
              <ChevronDown
                size={14}
                className={cn('transition-transform duration-200', megaOpen && 'rotate-180')}
              />
            </button>

            {/* Megamenu panel */}
            {megaOpen && (
              <div
                ref={megaRef}
                className="absolute top-full left-1/2 -translate-x-1/2 mt-4 w-[560px] rounded-2xl border border-white/8 bg-[#0e0e0e]/95 backdrop-blur-xl shadow-2xl shadow-black/60 overflow-hidden animate-fade-in-up"
              >
                <div className="grid grid-cols-2 gap-0 p-5">
                  {megaMenuCols.map((col) => (
                    <div key={col.heading}>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/25 mb-3 px-2">
                        {col.heading}
                      </p>
                      <ul className="space-y-0.5">
                        {col.items.map((item) => (
                          <li key={item.href}>
                            <Link
                              href={item.href}
                              onClick={() => setMegaOpen(false)}
                              className="flex items-start gap-3 rounded-xl px-2 py-2.5 hover:bg-white/[0.05] transition-colors group"
                            >
                              <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/5 border border-white/8 group-hover:bg-[#F97316]/10 group-hover:border-[#F97316]/20 transition-all">
                                <item.icon size={13} className="text-white/35 group-hover:text-[#F97316] transition-colors" />
                              </div>
                              <div>
                                <p className="text-sm text-white/70 group-hover:text-white font-medium leading-tight transition-colors">
                                  {item.label}
                                </p>
                                <p className="text-xs text-white/30 mt-0.5">{item.desc}</p>
                              </div>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>

                {/* Footer bar */}
                <div className="border-t border-white/[0.06] px-5 py-3 flex items-center justify-between bg-white/[0.015]">
                  <Link
                    href="/precios"
                    onClick={() => setMegaOpen(false)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-white/45 hover:text-white transition-colors"
                  >
                    Ver todos los servicios
                    <ChevronRight size={12} />
                  </Link>
                  <Link
                    href="/agendar"
                    onClick={() => setMegaOpen(false)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-[#F97316] hover:text-[#ea6c0c] transition-colors"
                  >
                    Agendá una llamada gratis
                    <ChevronRight size={12} />
                  </Link>
                </div>
              </div>
            )}
          </li>
        </ul>

        {/* Desktop CTAs */}
        <div className="hidden lg:flex items-center gap-3">
          <a
            href="/agendar"
            className="inline-flex items-center rounded-lg border border-white/[0.14] px-5 py-2.5 text-sm font-semibold text-white/70 transition-all duration-200 hover:border-white/30 hover:text-white"
          >
            Agenda una llamada
          </a>
          <a
            href={STRIPE_URL}
            className="inline-flex items-center rounded-lg bg-[#F97316] px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-[#ea6c0c] hover:shadow-[0_0_20px_rgba(249,115,22,0.35)]"
          >
            Empezar Ahora
          </a>
        </div>

        {/* Mobile toggle */}
        <button
          className="lg:hidden p-2 text-white/60 hover:text-white"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-white/[0.06] bg-[#080808]/95 backdrop-blur-xl px-6 py-4">
          <ul className="flex flex-col gap-4 mb-4">
            {navLinks.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="text-sm text-white/60 hover:text-white transition-colors"
                >
                  {link.label}
                </a>
              </li>
            ))}

            {/* Servicios accordion */}
            <li>
              <button
                onClick={() => setServicesAccordion(o => !o)}
                className="flex items-center justify-between w-full text-sm text-white/60 hover:text-white transition-colors"
              >
                Servicios
                <ChevronDown
                  size={14}
                  className={cn('transition-transform duration-200', servicesAccordion && 'rotate-180')}
                />
              </button>

              {servicesAccordion && (
                <div className="mt-3 pl-2 space-y-4">
                  {megaMenuCols.map((col) => (
                    <div key={col.heading}>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/25 mb-2">
                        {col.heading}
                      </p>
                      <ul className="space-y-2">
                        {col.items.map((item) => (
                          <li key={item.href}>
                            <Link
                              href={item.href}
                              onClick={() => setMobileOpen(false)}
                              className="flex items-center gap-2.5 text-sm text-white/50 hover:text-white transition-colors"
                            >
                              <item.icon size={13} className="text-white/25 shrink-0" />
                              {item.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}

                  <Link
                    href="/agendar"
                    onClick={() => setMobileOpen(false)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#F97316]"
                  >
                    Agendá una llamada gratis <ChevronRight size={11} />
                  </Link>
                </div>
              )}
            </li>
          </ul>

          <a
            href="/agendar"
            className="block text-center rounded-lg border border-white/[0.14] px-5 py-3 text-sm font-semibold text-white/70 mb-2"
            onClick={() => setMobileOpen(false)}
          >
            Agenda una llamada
          </a>
          <a
            href={STRIPE_URL}
            className="block text-center rounded-lg bg-[#F97316] px-5 py-3 text-sm font-semibold text-white"
            onClick={() => setMobileOpen(false)}
          >
            Empezar Ahora
          </a>
        </div>
      )}
    </header>
  )
}
