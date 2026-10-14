'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { BookOpen, ChevronDown, Flag, House, ListChecks, Target, Users, type LucideIcon } from 'lucide-react'
import { VISTA_LABELS, VISTAS, type Vista } from '@/lib/plan-q4/vistas'

const ICONS: Record<Vista, LucideIcon> = {
  inicio: House,
  tareas: ListChecks,
  etapas: Flag,
  equipo: Users,
  estrategia: BookOpen,
}

// Vista abierta según la URL (los links viejos ?tab=b8 abren Estrategia)
function useVistaActual(): Vista {
  const params = useSearchParams()
  const vista = params.get('vista')
  if (vista && (VISTAS as readonly string[]).includes(vista)) return vista as Vista
  return params.get('tab') && params.get('tab') !== 'resumen' ? 'estrategia' : 'inicio'
}

function Items({ onNavigate }: { onNavigate: () => void }) {
  const actual = useVistaActual()
  return (
    <>
      {VISTAS.map((vista) => {
        const Icon = ICONS[vista]
        const on = vista === actual
        return (
          <Link
            key={vista}
            href={`/plan-q4?vista=${vista}`}
            onClick={onNavigate}
            aria-current={on ? 'page' : undefined}
            className={`flex items-center gap-2.5 px-3 py-1.5 rounded-[10px] text-[13px] transition-colors ${
              on ? 'pn-chip-on text-fg' : 'text-fg/50 hover:text-fg hover:bg-fg/[0.05]'
            }`}
          >
            <Icon size={14} strokeWidth={1.5} absoluteStrokeWidth aria-hidden />
            {VISTA_LABELS[vista]}
          </Link>
        )
      })}
    </>
  )
}

// "Plan Q4" en el menú lateral, con sus vistas desplegadas debajo
export function PlanNavItem({ active, onNavigate }: { active: boolean; onNavigate: () => void }) {
  const [open, setOpen] = useState(active)
  return (
    <div>
      <div className="flex items-center gap-1">
        <Link
          href="/plan-q4"
          onClick={onNavigate}
          aria-current={active ? 'true' : undefined}
          className={`flex flex-1 items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
            active ? 'text-fg' : 'text-fg/55 hover:text-fg hover:bg-fg/[0.05]'
          }`}
        >
          <Target size={15} strokeWidth={1.5} absoluteStrokeWidth />
          Plan Q4
          {active && <span className="pn-signal ml-auto" aria-hidden />}
        </Link>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-label={open ? 'Plegar las secciones del plan' : 'Desplegar las secciones del plan'}
          className="p-2 rounded-lg text-fg/40 hover:text-fg hover:bg-fg/[0.05] transition-colors"
        >
          <ChevronDown size={14} strokeWidth={1.5} absoluteStrokeWidth className={`transition-transform ${open ? '' : '-rotate-90'}`} />
        </button>
      </div>
      {open && (
        <div className="ml-[21px] mt-0.5 mb-1 border-l border-fg/[0.08] pl-2 space-y-0.5">
          {active ? (
            <Suspense fallback={null}>
              <Items onNavigate={onNavigate} />
            </Suspense>
          ) : (
            VISTAS.map((vista) => {
              const Icon = ICONS[vista]
              return (
                <Link
                  key={vista}
                  href={`/plan-q4?vista=${vista}`}
                  onClick={onNavigate}
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-[10px] text-[13px] text-fg/50 hover:text-fg hover:bg-fg/[0.05] transition-colors"
                >
                  <Icon size={14} strokeWidth={1.5} absoluteStrokeWidth aria-hidden />
                  {VISTA_LABELS[vista]}
                </Link>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
