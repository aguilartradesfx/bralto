'use client'

import { useEffect, useState } from 'react'
import { Moon, PanelLeft, PanelLeftClose, Sun } from 'lucide-react'
import { THEME_STORAGE_KEY } from '@/lib/home/theme'
import { EVENTO_MENU } from '@/components/internal/shell/marco'
import { ICONO } from '@/components/crm/piezas'

type Tema = 'dark' | 'light'

// El tema (oscuro o claro, el mismo del sitio) y el ancho del menú. Se guardan en este navegador
export function Apariencia() {
  const [tema, setTema] = useState<Tema>('dark')
  const [corto, setCorto] = useState(false)

  useEffect(() => {
    const raiz = document.querySelector<HTMLElement>('.pn')
    if (!raiz) return
    setTema(raiz.dataset.theme === 'light' ? 'light' : 'dark')
    setCorto(raiz.dataset.menu === 'corto')
    const observar = new MutationObserver(() => {
      setTema(raiz.dataset.theme === 'light' ? 'light' : 'dark')
      setCorto(raiz.dataset.menu === 'corto')
    })
    observar.observe(raiz, { attributes: true, attributeFilter: ['data-theme', 'data-menu'] })
    return () => observar.disconnect()
  }, [])

  function cambiarTema(t: Tema) {
    if (t === tema) return
    // El botón de la barra de arriba guarda la preferencia y anima el cambio
    const boton = document.querySelector<HTMLButtonElement>('.hm-toggle')
    if (boton) boton.click()
    else {
      try {
        localStorage.setItem(THEME_STORAGE_KEY, t)
      } catch {}
      const raiz = document.querySelector<HTMLElement>('.pn')
      if (raiz) raiz.dataset.theme = t
    }
  }

  function cambiarMenu(c: boolean) {
    if (c === corto) return
    // El marco del panel lo escucha, lo cambia y lo guarda
    window.dispatchEvent(new CustomEvent(EVENTO_MENU, { detail: c }))
  }

  return (
    <>
      <Fila titulo="Tema" detalle="El mismo del sitio. Se guarda en este navegador.">
        <div className="pn-tabs" role="radiogroup" aria-label="Tema">
          <Opcion on={tema === 'dark'} onClick={() => cambiarTema('dark')} icono={<Moon size={13} {...ICONO} />}>
            Oscuro
          </Opcion>
          <Opcion on={tema === 'light'} onClick={() => cambiarTema('light')} icono={<Sun size={13} {...ICONO} />}>
            Claro
          </Opcion>
        </div>
      </Fila>
      <Fila titulo="Menú de la izquierda" detalle="Corto deja solo los íconos y le da más espacio a la página.">
        <div className="pn-tabs" role="radiogroup" aria-label="Menú">
          <Opcion on={!corto} onClick={() => cambiarMenu(false)} icono={<PanelLeft size={13} {...ICONO} />}>
            Largo
          </Opcion>
          <Opcion on={corto} onClick={() => cambiarMenu(true)} icono={<PanelLeftClose size={13} {...ICONO} />}>
            Corto
          </Opcion>
        </div>
      </Fila>
    </>
  )
}

function Opcion({ on, onClick, icono, children }: { on: boolean; onClick: () => void; icono: React.ReactNode; children: React.ReactNode }) {
  return (
    <button type="button" role="radio" aria-checked={on} aria-selected={on} onClick={onClick} className="pn-tab inline-flex items-center gap-1.5">
      {icono}
      {children}
    </button>
  )
}

export function Fila({ titulo, detalle, children }: { titulo: string; detalle?: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-2 border-b border-fg/[0.06] py-4 last:border-0 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] sm:gap-6">
      <div>
        <p className="text-[13px] text-fg">{titulo}</p>
        {detalle && <p className="mt-0.5 text-[12px] text-fg/45">{detalle}</p>}
      </div>
      <div className="flex min-w-0 flex-wrap items-center gap-2 text-[13px] text-fg/80">{children}</div>
    </div>
  )
}
