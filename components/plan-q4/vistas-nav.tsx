import Link from 'next/link'
import { BookOpen, Flag, House, ListChecks, Users, type LucideIcon } from 'lucide-react'
import type { PersonaFilter } from '@/lib/plan-q4/rules'
import { VISTA_LABELS, VISTAS, viewHref, type Vista } from '@/lib/plan-q4/vistas'

const ICONS: Record<Vista, LucideIcon> = {
  inicio: House,
  tareas: ListChecks,
  etapas: Flag,
  equipo: Users,
  estrategia: BookOpen,
}

// Las 5 vistas del plan. En el teléfono, ícono arriba y nombre abajo; las 5 caben sin desplazar.
export function VistasNav({ active, persona, pendientes }: { active: Vista; persona: PersonaFilter; pendientes: number }) {
  return (
    <nav aria-label="Secciones del plan" className="pn-glass rounded-[20px] p-1.5 grid grid-cols-5 gap-1 md:flex md:w-fit">
      {VISTAS.map((vista) => {
        const Icon = ICONS[vista]
        const on = vista === active
        return (
          <Link
            key={vista}
            href={viewHref({ vista }, persona)}
            aria-current={on ? 'page' : undefined}
            className={`relative flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 rounded-[14px] px-1 md:px-4 py-2 text-[11px] md:text-sm font-medium transition-colors ${
              on ? 'pn-chip-on text-white' : 'text-white/55 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            <Icon size={16} strokeWidth={1.5} absoluteStrokeWidth aria-hidden />
            <span className="whitespace-nowrap">{VISTA_LABELS[vista]}</span>
            {vista === 'tareas' && pendientes > 0 && (
              <span className="absolute top-1 right-1 md:static min-w-[18px] px-1 rounded-full bg-white/[0.12] text-[10px] leading-[18px] text-white text-center">
                {pendientes}
                <span className="sr-only"> pendientes esta semana</span>
              </span>
            )}
          </Link>
        )
      })}
    </nav>
  )
}
