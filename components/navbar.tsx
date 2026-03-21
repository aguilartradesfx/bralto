'use client'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { Menu, X } from 'lucide-react'

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

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
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
        </ul>

        {/* Desktop CTA */}
        <div className="hidden lg:flex items-center gap-3">
          <a
            href="/agendar"
            className="inline-flex items-center rounded-lg border border-white/[0.14] px-5 py-2.5 text-sm font-semibold text-white/70 transition-all duration-200 hover:border-white/30 hover:text-white"
          >
            Agenda una llamada
          </a>
          <a
            href="https://checkout.bralto.io"
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
          </ul>
          <a
            href="/agendar"
            className="block text-center rounded-lg border border-white/[0.14] px-5 py-3 text-sm font-semibold text-white/70 mb-2"
            onClick={() => setMobileOpen(false)}
          >
            Agenda una llamada
          </a>
          <a
            href="https://checkout.bralto.io"
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
