import Link from 'next/link'
import type { PersonaFilter } from '@/lib/plan-q4/rules'
import { PERSONAS, PERSONA_NAMES } from '@/lib/plan-q4/types'

const OPTIONS: { value: PersonaFilter; label: string }[] = [
  ...PERSONAS.map((p) => ({ value: p, label: PERSONA_NAMES[p] })),
  { value: 'todos', label: 'Todo el equipo' },
]

// hrefFor: la URL de la vista actual con otra persona
export function PersonaFilterBar({ persona, hrefFor }: { persona: PersonaFilter; hrefFor: (p: PersonaFilter) => string }) {
  return (
    <nav aria-label="Ver las tareas de" className="flex flex-wrap gap-1 p-1 w-fit bg-white/[0.03] border border-white/[0.07] rounded-[14px]">
      {OPTIONS.map(({ value, label }) => {
        const active = persona === value
        return (
          <Link
            key={value}
            href={hrefFor(value)}
            aria-current={active ? 'true' : undefined}
            className={`px-3 py-2 text-xs font-medium rounded-[10px] transition-colors ${
              active ? 'pn-chip-on text-white' : 'text-white/50 hover:text-white/80'
            }`}
          >
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
