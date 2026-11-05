'use client'

import { useCallback, useEffect, useLayoutEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { X } from 'lucide-react'
import type { EntradaNav, ItemNav } from '@/lib/panel/navegacion'
import type { PanelPermission } from '@/lib/panel-access'
import type { UserProfile } from '@/types/user-profiles'
import { MenuLateral, type Cuentas } from './menu-lateral'
import { BarraSuperior } from './barra-superior'
import { AccionesRapidas } from './acciones-rapidas'
import { TRAZO } from './iconos'

export const MENU_KEY = 'bralto-panel-menu'
// Ajustes pide cambiar el ancho del menú con este evento (detail: true = corto)
export const EVENTO_MENU = 'pn:menu'

// Lee la preferencia del menú antes del primer pintado (si quedó corto, abre corto, sin salto). Hijo directo de .pn
export const menuBootScript = `(function(){try{if(localStorage.getItem(${JSON.stringify(MENU_KEY)})==='corto')document.currentScript.parentElement.dataset.menu='corto'}catch(e){}})()`

interface Props {
  menu: EntradaNav[]
  pie: ItemNav[]
  cuentas: Cuentas
  perfil: Pick<UserProfile, PanelPermission> | null
  nombre: string
  correo: string
  children: React.ReactNode
}

// El marco del panel: el menú a la izquierda (corto o largo, y en el teléfono un cajón), la barra de arriba,
// las acciones rápidas (⌘K) y la página
export function Marco({ menu, pie, cuentas, perfil, nombre, correo, children }: Props) {
  const pathname = usePathname()
  const [corto, setCorto] = useState(false)
  const [cajon, setCajon] = useState(false)
  const [acciones, setAcciones] = useState(false)

  useLayoutEffect(() => {
    setCorto(document.querySelector<HTMLElement>('.pn')?.dataset.menu === 'corto')
  }, [])

  const fijarCorto = useCallback((siguiente: boolean) => {
    setCorto(() => {
      const raiz = document.querySelector<HTMLElement>('.pn')
      if (raiz) {
        if (siguiente) raiz.dataset.menu = 'corto'
        else delete raiz.dataset.menu
      }
      try {
        localStorage.setItem(MENU_KEY, siguiente ? 'corto' : 'largo')
      } catch {}
      return siguiente
    })
  }, [])

  const alternarCorto = useCallback(() => fijarCorto(!(document.querySelector<HTMLElement>('.pn')?.dataset.menu === 'corto')), [fijarCorto])

  useEffect(() => {
    const pedir = (e: Event) => fijarCorto(!!(e as CustomEvent<boolean>).detail)
    window.addEventListener(EVENTO_MENU, pedir)
    return () => window.removeEventListener(EVENTO_MENU, pedir)
  }, [fijarCorto])

  // ⌘K / Ctrl+K abre las acciones rápidas desde cualquier página
  useEffect(() => {
    const teclas = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setAcciones((a) => !a)
      }
    }
    window.addEventListener('keydown', teclas)
    return () => window.removeEventListener('keydown', teclas)
  }, [])

  // Al cambiar de página se cierra el cajón del teléfono
  useEffect(() => setCajon(false), [pathname])

  const admin = !!perfil?.is_admin

  return (
    <>
      <a href="#contenido" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[70] focus:rounded-md focus:bg-[var(--pn-card)] focus:px-3 focus:py-2 focus:text-sm">
        Saltar al contenido
      </a>
      <aside className="pn-side fixed inset-y-0 left-0 z-40 hidden w-[var(--pn-side-w)] border-r border-fg/[0.06] bg-[var(--pn-side)] transition-[width] duration-200 md:block">
        <MenuLateral menu={menu} pie={pie} cuentas={cuentas} corto={corto} onCorto={alternarCorto} onAcciones={() => setAcciones(true)} />
      </aside>

      {cajon && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Menú">
          <button type="button" className="absolute inset-0 bg-black/50" aria-label="Cerrar el menú" onClick={() => setCajon(false)} />
          <aside className="pn-rise absolute inset-y-0 left-0 w-[280px] max-w-[85vw] border-r border-fg/[0.06] bg-[var(--pn-side)]">
            <button type="button" onClick={() => setCajon(false)} className="absolute right-3 top-5 z-10 rounded-md p-1.5 text-fg/50 hover:text-fg" aria-label="Cerrar el menú">
              <X size={16} {...TRAZO} />
            </button>
            <MenuLateral
              menu={menu}
              pie={pie}
              cuentas={cuentas}
              corto={false}
              onCorto={() => setCajon(false)}
              onAcciones={() => {
                setCajon(false)
                setAcciones(true)
              }}
              onNavegar={() => setCajon(false)}
            />
          </aside>
        </div>
      )}

      <div className="min-h-dvh transition-[padding] duration-200 md:pl-[var(--pn-side-w)]">
        <BarraSuperior nombre={nombre} correo={correo} admin={admin} cuentas={cuentas} onAcciones={() => setAcciones(true)} onMenu={() => setCajon(true)} />
        <main id="contenido" className="pn-main">
          {children}
        </main>
      </div>

      <AccionesRapidas abierto={acciones} onCerrar={() => setAcciones(false)} menu={menu} perfil={perfil} />
    </>
  )
}
