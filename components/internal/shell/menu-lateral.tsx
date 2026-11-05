'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { ChevronRight, PanelLeft, Plus, Sparkles } from 'lucide-react'
import { esGrupo, estaActivo, grupoActivo, type Cuenta, type EntradaNav, type GrupoNav, type ItemNav } from '@/lib/panel/navegacion'
import { BraltoLogo } from '@/components/home/logo'
import { ICONOS, TRAZO } from './iconos'

export type Cuentas = Partial<Record<Cuenta, number>>

interface Props {
  menu: EntradaNav[]
  pie: ItemNav[]
  cuentas: Cuentas
  corto: boolean
  onCorto: () => void
  onAcciones: () => void
  onNavegar?: () => void
}

const GRUPOS_KEY = 'bralto-panel-grupos'

// El menú del panel: Inicio, los grupos que se despliegan (CRM, Ventas…) y abajo Ayuda y Ajustes. Corto: solo íconos
export function MenuLateral(props: Props) {
  return (
    <Suspense fallback={<Menu {...props} vista={null} />}>
      <MenuConVista {...props} />
    </Suspense>
  )
}

function MenuConVista(props: Props) {
  // La vista del Plan Q4 va en ?vista= (sus entradas se distinguen por eso)
  const vista = useSearchParams().get('vista')
  return <Menu {...props} vista={vista} />
}

function Menu({ menu, pie, cuentas, corto, onCorto, onAcciones, onNavegar, vista }: Props & { vista: string | null }) {
  const pathname = usePathname()
  const activo = grupoActivo(pathname, vista)
  const [abiertos, setAbiertos] = useState<string[]>(activo ? [activo] : ['crm'])

  // Los grupos que dejaste abiertos (y el de la página abierta, siempre)
  useEffect(() => {
    let guardados: string[] = []
    try {
      guardados = JSON.parse(localStorage.getItem(GRUPOS_KEY) ?? '[]')
    } catch {}
    setAbiertos((antes) => [...new Set([...(Array.isArray(guardados) ? guardados : []), ...antes])])
  }, [])

  useEffect(() => {
    if (activo) setAbiertos((antes) => (antes.includes(activo) ? antes : [...antes, activo]))
  }, [activo])

  function alternar(id: string) {
    setAbiertos((antes) => {
      const siguiente = antes.includes(id) ? antes.filter((g) => g !== id) : [...antes, id]
      try {
        localStorage.setItem(GRUPOS_KEY, JSON.stringify(siguiente))
      } catch {}
      return siguiente
    })
  }

  // Corto: al tocar un grupo, el menú se abre con ese grupo desplegado
  function abrirGrupo(id: string) {
    if (corto) {
      onCorto()
      setAbiertos((antes) => (antes.includes(id) ? antes : [...antes, id]))
    } else alternar(id)
  }

  return (
    <div className="flex h-full flex-col">
      <div className={`flex items-center pt-5 pb-4 ${corto ? 'flex-col gap-3 px-2' : 'justify-between px-4'}`}>
        <Link href="/admin" onClick={onNavegar} className="flex min-w-0 items-center gap-2.5" aria-label="Bralto, Inicio">
          <Marca />
          {!corto && (
            <span className="min-w-0">
              <span className="block text-[15px] font-medium leading-none tracking-tight text-fg">Bralto</span>
              <span className="mt-1 block text-[11px] leading-none text-fg/45">Panel interno</span>
            </span>
          )}
        </Link>
        <button type="button" onClick={onCorto} className="hidden rounded-md p-1.5 text-fg/40 transition-colors hover:bg-fg/[0.05] hover:text-fg md:block" aria-label={corto ? 'Abrir el menú' : 'Achicar el menú'} title={corto ? 'Abrir el menú' : 'Achicar el menú'}>
          <PanelLeft size={15} {...TRAZO} />
        </button>
      </div>

      {/* Acciones rápidas (⌘K) */}
      <div className={`flex items-center gap-1.5 pb-4 ${corto ? 'flex-col px-2' : 'px-3'}`}>
        <button
          type="button"
          onClick={onAcciones}
          className={`pn-solid flex h-8 items-center gap-2 rounded-[9px] text-[13px] text-fg/50 transition-colors hover:text-fg ${corto ? 'w-8 justify-center' : 'flex-1 px-2.5'}`}
          aria-label="Acciones rápidas"
          title="Acciones rápidas (⌘K)"
        >
          <Plus size={14} {...TRAZO} />
          {!corto && (
            <>
              <span className="flex-1 text-left">Acciones rápidas</span>
              <kbd className="font-mono text-[10.5px] text-fg/35">⌘K</kbd>
            </>
          )}
        </button>
        <Link href="https://knox.bralto.io" className="pn-icon-btn !h-8 !w-8 shrink-0 text-[var(--pn-accent-ink)]" aria-label="Abrir Knox, el centro de mando" title="Knox · centro de mando">
          <Sparkles size={14} {...TRAZO} />
        </Link>
      </div>

      <nav aria-label="Secciones del panel" className="pn-scroll flex-1 overflow-y-auto px-3 pb-3">
        <ul className="space-y-0.5">
          {menu.map((e) =>
            esGrupo(e) ? (
              <Grupo key={e.id} grupo={e} abierto={abiertos.includes(e.id)} activo={activo === e.id} corto={corto} onAlternar={() => abrirGrupo(e.id)}>
                {e.items.map((i) => (
                  <Entrada key={i.href} item={i} on={estaActivo(i, pathname, vista)} cuenta={i.cuenta ? cuentas[i.cuenta] : undefined} corto={false} sub onNavegar={onNavegar} />
                ))}
              </Grupo>
            ) : (
              <Entrada key={e.href} item={e} on={estaActivo(e, pathname, vista)} cuenta={e.cuenta ? cuentas[e.cuenta] : undefined} corto={corto} onNavegar={onNavegar} />
            ),
          )}
        </ul>
      </nav>

      <ul className="space-y-0.5 border-t border-fg/[0.06] px-3 py-3">
        {pie.map((i) => (
          <Entrada key={i.href} item={i} on={estaActivo(i, pathname, vista)} corto={corto} onNavegar={onNavegar} />
        ))}
      </ul>
    </div>
  )
}

// El cuadrito con el símbolo de Bralto (como el ícono de una app)
export function Marca({ grande = false }: { grande?: boolean }) {
  return (
    <span className={`grid shrink-0 place-items-center rounded-[10px] bg-fg/[0.06] text-fg ring-1 ring-inset ring-fg/[0.1] ${grande ? 'h-11 w-11' : 'h-8 w-8'}`}>
      <BraltoLogo isotipo className={grande ? 'h-6 w-auto' : 'h-[18px] w-auto'} />
    </span>
  )
}

function Grupo({ grupo, abierto, activo, corto, onAlternar, children }: { grupo: GrupoNav; abierto: boolean; activo: boolean; corto: boolean; onAlternar: () => void; children: React.ReactNode }) {
  const Icono = ICONOS[grupo.icono]
  const id = `grupo-${grupo.id}`
  if (corto) {
    return (
      <li>
        <button type="button" onClick={onAlternar} title={grupo.label} aria-label={grupo.label} className={`flex h-9 w-full items-center justify-center rounded-[9px] transition-colors ${activo ? 'pn-chip-on text-[var(--pn-accent-ink)]' : 'text-fg/50 hover:bg-fg/[0.05] hover:text-fg'}`}>
          <Icono size={16} {...TRAZO} />
        </button>
      </li>
    )
  }
  return (
    <li>
      <button
        type="button"
        onClick={onAlternar}
        aria-expanded={abierto}
        aria-controls={id}
        className={`group flex h-8 w-full items-center gap-2 rounded-[9px] px-2 text-[13px] transition-colors ${activo ? 'text-fg' : 'text-fg/50 hover:text-fg'}`}
      >
        <ChevronRight size={13} {...TRAZO} className={`shrink-0 text-fg/35 transition-transform duration-200 ${abierto ? 'rotate-90' : ''}`} />
        <span className="flex-1 truncate text-left">{grupo.label}</span>
      </button>
      <ul id={id} hidden={!abierto} className="mb-1.5 mt-0.5 space-y-0.5">
        {children}
      </ul>
    </li>
  )
}

function Entrada({ item, on, cuenta, corto, sub = false, onNavegar }: { item: ItemNav; on: boolean; cuenta?: number; corto: boolean; sub?: boolean; onNavegar?: () => void }) {
  const Icono = ICONOS[item.icono]
  return (
    <li>
      <Link
        href={item.href}
        onClick={onNavegar}
        aria-current={on ? 'page' : undefined}
        title={corto ? item.label : undefined}
        aria-label={corto ? item.label : undefined}
        className={`group relative flex items-center gap-2.5 rounded-[9px] text-[13px] transition-colors ${corto ? 'h-9 justify-center' : `h-8 ${sub ? 'pl-[26px] pr-2' : 'px-2'}`} ${
          on ? 'pn-chip-on text-fg' : 'text-fg/60 hover:bg-fg/[0.04] hover:text-fg'
        }`}
      >
        <Icono size={corto ? 16 : 15} {...TRAZO} className={`shrink-0 transition-colors ${on ? 'text-[var(--pn-accent-ink)]' : 'text-fg/45 group-hover:text-fg/75'}`} />
        {!corto && <span className="flex-1 truncate">{item.label}</span>}
        {!corto && item.pronto && <span className="pn-pronto">Pronto</span>}
        {!corto && !!cuenta && <span className={`pn-count ${item.cuenta === 'mensajes' ? 'pn-count--accent' : ''}`}>{cuenta > 99 ? '99+' : cuenta}</span>}
        {corto && !!cuenta && <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[var(--pn-accent)]" aria-hidden />}
      </Link>
    </li>
  )
}
