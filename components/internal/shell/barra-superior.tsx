'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { ArrowUpRight, Bell, CalendarDays, Check, ChevronDown, LogOut, Menu, Search, Settings, Sparkles } from 'lucide-react'
import { tituloDe } from '@/lib/panel/navegacion'
import { createClient } from '@/lib/supabase/client'
import { iniciales } from '@/lib/crm/tipos'
import { ThemeToggle } from '@/components/home/theme-toggle'
import type { Cuentas } from './menu-lateral'
import { TRAZO } from './iconos'

interface Props {
  nombre: string
  correo: string
  admin: boolean
  cuentas: Cuentas
  onAcciones: () => void
  onMenu: () => void
}

// Arriba de cada página: el nombre de la sección, el cambio a Knox y, a la derecha, buscar, agenda, avisos, tema y tu cuenta
export function BarraSuperior(props: Props) {
  return (
    <Suspense fallback={<Barra {...props} vista={null} />}>
      <BarraConVista {...props} />
    </Suspense>
  )
}

function BarraConVista(props: Props) {
  return <Barra {...props} vista={useSearchParams().get('vista')} />
}

function Barra({ nombre, correo, admin, cuentas, onAcciones, onMenu, vista }: Props & { vista: string | null }) {
  const pathname = usePathname()
  const titulo = tituloDe(pathname, vista)
  const esperando = cuentas.mensajes ?? 0
  const tareas = cuentas.tareas ?? 0

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 bg-[var(--pn-bg)] px-4 md:h-[72px] md:px-8">
      <button type="button" onClick={onMenu} className="pn-icon-btn md:hidden" aria-label="Abrir el menú">
        <Menu size={16} {...TRAZO} />
      </button>
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <p className="truncate text-[19px] tracking-[-0.01em] text-fg md:text-[22px]">{titulo}</p>
        {admin && <Cambiar />}
      </div>

      <div className="flex items-center gap-1.5">
        <button type="button" onClick={onAcciones} className="pn-icon-btn" aria-label="Buscar (⌘K)" title="Buscar (⌘K)">
          <Search size={15} {...TRAZO} />
        </button>
        {admin && (
          <Link href="/calendario" className="pn-icon-btn hidden sm:inline-grid" aria-label="Calendario de redes" title="Calendario de redes">
            <CalendarDays size={15} {...TRAZO} />
          </Link>
        )}
        {admin && <Avisos esperando={esperando} tareas={tareas} />}
        <span className="mx-1 hidden sm:block">
          <ThemeToggle label="Cambiar entre tema claro y oscuro" />
        </span>
        <Cuenta nombre={nombre} correo={correo} />
      </div>
    </header>
  )
}

// Cierra un menú desplegable al tocar afuera o con Esc
function useDesplegable() {
  const [abierto, setAbierto] = useState(false)
  const caja = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!abierto) return
    const fuera = (e: PointerEvent) => {
      if (caja.current && !caja.current.contains(e.target as Node)) setAbierto(false)
    }
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setAbierto(false)
    document.addEventListener('pointerdown', fuera)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('pointerdown', fuera)
      document.removeEventListener('keydown', esc)
    }
  }, [abierto])
  return { abierto, setAbierto, caja }
}

// «Panel ⌄»: pasar al centro de mando de Knox o al sitio
function Cambiar() {
  const { abierto, setAbierto, caja } = useDesplegable()
  return (
    <div ref={caja} className="relative hidden sm:block">
      <button type="button" onClick={() => setAbierto(!abierto)} aria-expanded={abierto} className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[12.5px] text-fg/45 transition-colors hover:text-fg">
        Cambiar a Knox
        <ChevronDown size={13} {...TRAZO} className={`transition-transform ${abierto ? 'rotate-180' : ''}`} />
      </button>
      {abierto && (
        <div className="pn-pop pn-rise absolute left-0 top-full z-40 mt-1.5 w-64 rounded-[12px] p-1.5">
          <p className="flex items-center gap-2.5 rounded-[8px] px-2.5 py-2 text-[13px] text-fg">
            <Check size={14} {...TRAZO} className="text-[var(--pn-accent-ink)]" />
            Panel interno
            <span className="ml-auto text-[11px] text-fg/35">aquí</span>
          </p>
          <a href="https://knox.bralto.io" className="flex items-center gap-2.5 rounded-[8px] px-2.5 py-2 text-[13px] text-fg/75 hover:bg-fg/[0.05] hover:text-fg">
            <Sparkles size={14} {...TRAZO} className="text-fg/45" />
            Knox · centro de mando
            <ArrowUpRight size={13} {...TRAZO} className="ml-auto text-fg/35" />
          </a>
          <a href="https://www.bralto.io" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 rounded-[8px] px-2.5 py-2 text-[13px] text-fg/75 hover:bg-fg/[0.05] hover:text-fg">
            <ArrowUpRight size={14} {...TRAZO} className="text-fg/45" />
            El sitio web
          </a>
        </div>
      )}
    </div>
  )
}

function Avisos({ esperando, tareas }: { esperando: number; tareas: number }) {
  const { abierto, setAbierto, caja } = useDesplegable()
  const hay = esperando + tareas > 0
  return (
    <div ref={caja} className="relative">
      <button type="button" onClick={() => setAbierto(!abierto)} aria-expanded={abierto} className="pn-icon-btn relative" aria-label={hay ? 'Avisos: hay pendientes' : 'Avisos'} title="Avisos">
        <Bell size={15} {...TRAZO} />
        {hay && <span className="absolute right-[7px] top-[7px] h-1.5 w-1.5 rounded-full bg-[var(--pn-accent)] ring-2 ring-[var(--pn-card)]" aria-hidden />}
      </button>
      {abierto && (
        <div className="pn-pop pn-rise absolute right-0 top-full z-40 mt-1.5 w-72 rounded-[12px] p-1.5">
          <p className="px-2.5 pb-1.5 pt-1.5 text-[12px] font-medium text-fg/45">Avisos</p>
          {!hay && <p className="px-2.5 pb-3 text-[13px] text-fg/55">Todo al día. Nadie te está esperando.</p>}
          {esperando > 0 && (
            <Link href="/crm/mensajes" onClick={() => setAbierto(false)} className="flex items-center gap-2.5 rounded-[8px] px-2.5 py-2 text-[13px] text-fg/80 hover:bg-fg/[0.05]">
              <span className="pn-signal" aria-hidden />
              <span className="flex-1">{esperando === 1 ? '1 persona te está esperando' : `${esperando} personas te están esperando`}</span>
            </Link>
          )}
          {tareas > 0 && (
            <Link href="/crm/tareas" onClick={() => setAbierto(false)} className="flex items-center gap-2.5 rounded-[8px] px-2.5 py-2 text-[13px] text-fg/80 hover:bg-fg/[0.05]">
              <span className="h-1.5 w-1.5 rounded-full bg-fg/40" aria-hidden />
              <span className="flex-1">{tareas === 1 ? '1 tarea pendiente' : `${tareas} tareas pendientes`}</span>
            </Link>
          )}
        </div>
      )}
    </div>
  )
}

function Cuenta({ nombre, correo }: { nombre: string; correo: string }) {
  const router = useRouter()
  const { abierto, setAbierto, caja } = useDesplegable()

  async function salir() {
    await createClient().auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div ref={caja} className="relative">
      <button type="button" onClick={() => setAbierto(!abierto)} aria-expanded={abierto} aria-label="Tu cuenta" className="grid h-8 w-8 place-items-center rounded-full bg-[var(--pn-accent-soft)] text-[11px] font-medium text-[var(--pn-accent-ink)] ring-1 ring-inset ring-[var(--pn-accent-line)] transition-transform active:scale-95">
        {iniciales(nombre || correo)}
      </button>
      {abierto && (
        <div className="pn-pop pn-rise absolute right-0 top-full z-40 mt-1.5 w-64 rounded-[12px] p-1.5">
          <div className="px-2.5 pb-2 pt-1.5">
            <p className="truncate text-[13px] font-medium text-fg">{nombre || 'Tu cuenta'}</p>
            <p className="truncate text-[12px] text-fg/45">{correo}</p>
          </div>
          <div className="flex items-center justify-between rounded-[8px] px-2.5 py-1.5 sm:hidden">
            <span className="text-[13px] text-fg/75">Tema</span>
            <ThemeToggle label="Cambiar entre tema claro y oscuro" />
          </div>
          <Link href="/ajustes" onClick={() => setAbierto(false)} className="flex items-center gap-2.5 rounded-[8px] px-2.5 py-2 text-[13px] text-fg/75 hover:bg-fg/[0.05] hover:text-fg">
            <Settings size={14} {...TRAZO} className="text-fg/45" />
            Ajustes
          </Link>
          <button type="button" onClick={salir} className="flex w-full items-center gap-2.5 rounded-[8px] px-2.5 py-2 text-left text-[13px] text-fg/75 hover:bg-fg/[0.05] hover:text-fg">
            <LogOut size={14} {...TRAZO} className="text-fg/45" />
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  )
}
