import Link from 'next/link'
import type { PersonaFilter } from '@/lib/plan-q4/rules'
import { PERSONAS, PERSONA_NAMES } from '@/lib/plan-q4/types'

const OPTIONS: { value: PersonaFilter; label: string }[] = [
  ...PERSONAS.map((p) => ({ value: p, label: PERSONA_NAMES[p] })),
  { value: 'todos', label: 'Todos' },
]

// hrefFor: la URL de la vista actual con otra persona
export function PersonaFilterBar({ persona, hrefFor }: { persona: PersonaFilter; hrefFor: (p: PersonaFilter) => string }) {
  return (
    <nav aria-label="Ver las tareas de" className="flex flex-wrap gap-x-5 gap-y-1">
      {OPTIONS.map(({ value, label }) => {
        const active = persona === value
        return (
          <Link
            key={value}
            href={hrefFor(value)}
            aria-current={active ? 'true' : undefined}
            className={`py-1 text-sm transition-colors ${
              active ? 'text-fg underline decoration-fg/40 underline-offset-[6px]' : 'text-fg/40 hover:text-fg/75'
            }`}
          >
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
