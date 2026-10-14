'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { FileText, Users, LogOut, Menu, X, LayoutDashboard, ScrollText, ClipboardList, UserCog, Target, type LucideIcon } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { hasPermission, requiredPermission } from '@/lib/panel-access'
import type { UserProfile } from '@/types/user-profiles'
import { PlanNavItem } from '@/components/internal/plan-subnav'
import { useState } from 'react'

const NAV_ITEMS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: '/admin', label: 'Inicio', icon: LayoutDashboard },
  { href: '/plan-q4', label: 'Plan Q4', icon: Target },
  { href: '/contratos', label: 'Contratos', icon: FileText },
  { href: '/clientes', label: 'Clientes', icon: Users },
  { href: '/solicitudes', label: 'Solicitudes', icon: ClipboardList },
  { href: '/propuestas', label: 'Propuestas', icon: ScrollText },
  { href: '/usuarios', label: 'Usuarios', icon: UserCog },
]

export function InternalNav({ profile }: { profile: UserProfile | null }) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const visibleItems = NAV_ITEMS.filter((item) => hasPermission(profile, requiredPermission(item.href)))

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const navContent = (
    <>
      {/* Logo */}
      <div className="px-5 py-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <Image src="/logo-white.svg" alt="Bralto" width={90} height={22} className="h-5 w-auto object-contain" />
          <span className="font-mono text-white/40 text-[10px] uppercase tracking-widest mt-0.5">
            interno
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {visibleItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`)
          if (href === '/plan-q4') return <PlanNavItem key={href} active={active} onNavigate={() => setMobileOpen(false)} />
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              aria-current={active ? 'page' : undefined}
              className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                active ? 'pn-chip-on text-white' : 'text-white/55 hover:text-white hover:bg-white/[0.05]'
              }`}
            >
              <Icon size={15} strokeWidth={1.5} absoluteStrokeWidth />
              {label}
              {active && <span className="pn-signal ml-auto" aria-hidden />}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 pb-4 border-t border-white/[0.06] pt-3">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-white/40 hover:text-white/70 hover:bg-white/[0.05] transition-colors w-full"
        >
          <LogOut size={15} strokeWidth={1.5} absoluteStrokeWidth />
          Cerrar sesión
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed left-3 top-3 bottom-3 w-56 pn-glass rounded-[20px] flex-col z-40">
        {navContent}
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 pn-glass pn-glass--dense flex items-center justify-between px-4 z-40">
        <div className="flex items-center gap-2">
          <Image src="/logo-white.svg" alt="Bralto" width={80} height={20} className="h-5 w-auto object-contain" />
          <span className="font-mono text-white/40 text-[10px] uppercase tracking-widest">interno</span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="text-white/60 hover:text-white p-1"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50" onClick={() => setMobileOpen(false)}>
          <div className="absolute inset-0 bg-black/60" />
          <aside
            className="absolute left-0 top-0 h-full w-64 pn-glass pn-glass--dense rounded-r-[20px] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {navContent}
          </aside>
        </div>
      )}
    </>
  )
}
