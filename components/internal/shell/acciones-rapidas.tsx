'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowUpRight, CornerDownLeft, Moon, Plus, Search, Sparkles, type LucideIcon } from 'lucide-react'
import { esGrupo, type EntradaNav } from '@/lib/panel/navegacion'
import { hasPermission, requiredPermission, type PanelPermission } from '@/lib/panel-access'
import type { UserProfile } from '@/types/user-profiles'
import { ICONOS, TRAZO } from './iconos'

interface Opcion {
  id: string
  label: string
  grupo: string
  icono: LucideIcon
  pronto?: boolean
  href?: string
  externo?: boolean
  hacer?: () => void
}

const CREAR = [
  { href: '/crm/nuevo', label: 'Nuevo contacto' },
  { href: '/solicitudes/nueva', label: 'Nueva solicitud de propuesta' },
  { href: '/contratos/nuevo', label: 'Nuevo contrato' },
]

// Sin tildes ni mayúsculas: «contratos» encuentra «Contratos», «campana» encuentra «Campañas»
const plano = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

// El mismo botón del tema de la barra de arriba (guarda la preferencia y anima el cambio)
function cambiarTema() {
  document.querySelector<HTMLButtonElement>('.hm-toggle')?.click()
}

// Las acciones rápidas (⌘K): ir a cualquier sección, crear algo nuevo, abrir Knox o cambiar el tema
export function AccionesRapidas({ abierto, onCerrar, menu, perfil }: { abierto: boolean; onCerrar: () => void; menu: EntradaNav[]; perfil: Pick<UserProfile, PanelPermission> | null }) {
  const router = useRouter()
  const [q, setQ] = useState('')
  const [i, setI] = useState(0)
  const entrada = useRef<HTMLInputElement>(null)
  const lista = useRef<HTMLUListElement>(null)

  const opciones = useMemo<Opcion[]>(() => {
    const ir = menu.flatMap((e) =>
      (esGrupo(e) ? e.items.map((it) => ({ it, grupo: e.label })) : [{ it: e, grupo: 'Ir a' }]).map(({ it, grupo }) => ({
        id: it.href,
        label: it.label,
        grupo,
        icono: ICONOS[it.icono],
        pronto: it.pronto,
        href: it.href,
      })),
    )
    const crear = CREAR.filter((c) => hasPermission(perfil, requiredPermission(c.href))).map((c) => ({ id: c.href, label: c.label, grupo: 'Crear', icono: Plus, href: c.href }))
    const otras: Opcion[] = [
      ...(perfil?.is_admin ? [{ id: 'knox', label: 'Abrir Knox, el centro de mando', grupo: 'Otras', icono: Sparkles, href: 'https://knox.bralto.io', externo: true }] : []),
      { id: 'sitio', label: 'Abrir el sitio web', grupo: 'Otras', icono: ArrowUpRight, href: 'https://www.bralto.io', externo: true },
      { id: 'tema', label: 'Cambiar entre tema claro y oscuro', grupo: 'Otras', icono: Moon, hacer: cambiarTema },
      { id: 'ajustes', label: 'Ajustes', grupo: 'Otras', icono: ICONOS.ajustes, href: '/ajustes' },
    ]
    return [...crear, ...ir, ...otras]
  }, [menu, perfil])

  const visibles = useMemo(() => {
    const t = plano(q.trim())
    return t ? opciones.filter((o) => plano(`${o.label} ${o.grupo}`).includes(t)) : opciones
  }, [opciones, q])

  useEffect(() => {
    if (!abierto) return
    setQ('')
    setI(0)
    const t = setTimeout(() => entrada.current?.focus(), 0)
    return () => clearTimeout(t)
  }, [abierto])

  useEffect(() => setI(0), [q])

  useEffect(() => {
    lista.current?.querySelector<HTMLElement>(`[data-i="${i}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [i])

  if (!abierto) return null

  function elegir(o: Opcion | undefined) {
    if (!o) return
    onCerrar()
    if (o.hacer) return o.hacer()
    if (!o.href) return
    if (o.externo) window.open(o.href, '_blank', 'noopener')
    else router.push(o.href)
  }

  function teclas(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setI((n) => Math.min(n + 1, visibles.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setI((n) => Math.max(n - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      elegir(visibles[i])
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onCerrar()
    }
  }

  let grupoAnterior = ''
  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center px-4 pt-[12vh]" role="dialog" aria-modal="true" aria-label="Acciones rápidas" onKeyDown={teclas}>
      <button type="button" className="absolute inset-0 cursor-default bg-black/50" aria-label="Cerrar" tabIndex={-1} onClick={onCerrar} />
      <div className="pn-pop pn-rise relative w-full max-w-[560px] overflow-hidden rounded-[14px]">
        <div className="flex items-center gap-2.5 border-b border-fg/[0.07] px-4">
          <Search size={16} {...TRAZO} className="text-fg/40" />
          <input
            ref={entrada}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Busca una sección o una acción…"
            className="h-12 flex-1 bg-transparent text-[15px] text-fg placeholder:text-fg/35 focus:!shadow-none"
            aria-controls="acciones-lista"
            aria-activedescendant={visibles[i] ? `accion-${i}` : undefined}
            role="combobox"
            aria-expanded="true"
          />
          <kbd className="font-mono text-[11px] text-fg/35">esc</kbd>
        </div>
        <ul ref={lista} id="acciones-lista" role="listbox" className="pn-scroll max-h-[50vh] overflow-y-auto p-1.5">
          {visibles.length === 0 && <li className="px-3 py-8 text-center text-sm text-fg/45">Nada con «{q}».</li>}
          {visibles.map((o, n) => {
            const titulo = o.grupo !== grupoAnterior ? o.grupo : null
            grupoAnterior = o.grupo
            const Icono = o.icono
            return (
              <li key={`${o.grupo}-${o.id}`} role="presentation">
                {titulo && <p className="px-2.5 pb-1 pt-2.5 text-[11px] font-medium text-fg/40">{titulo}</p>}
                <button
                  type="button"
                  id={`accion-${n}`}
                  data-i={n}
                  role="option"
                  aria-selected={n === i}
                  onMouseMove={() => setI(n)}
                  onClick={() => elegir(o)}
                  className={`flex w-full items-center gap-2.5 rounded-[9px] px-2.5 py-2 text-left text-[13.5px] ${n === i ? 'bg-fg/[0.06] text-fg' : 'text-fg/75'}`}
                >
                  <Icono size={15} {...TRAZO} className={n === i ? 'text-[var(--pn-accent-ink)]' : 'text-fg/45'} />
                  <span className="flex-1 truncate">{o.label}</span>
                  {o.pronto && <span className="pn-pronto">Pronto</span>}
                  {o.externo && <ArrowUpRight size={13} {...TRAZO} className="text-fg/35" />}
                  {n === i && <CornerDownLeft size={13} {...TRAZO} className="text-fg/35" />}
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
