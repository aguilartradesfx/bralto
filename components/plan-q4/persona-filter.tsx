import Link from 'next/link'
import { planHref, type PersonaFilter } from '@/lib/plan-q4/rules'
import { PERSONAS, PERSONA_NAMES } from '@/lib/plan-q4/types'

const OPTIONS: { value: PersonaFilter; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  ...PERSONAS.map((p) => ({ value: p, label: PERSONA_NAMES[p] })),
]

export function PersonaFilterBar({ tab, persona }: { tab: string; persona: PersonaFilter }) {
  return (
    <nav aria-label="Filtrar por persona" className="flex gap-1 p-1 bg-white/[0.03] border border-white/[0.07] rounded-lg">
      {OPTIONS.map(({ value, label }) => {
        const active = persona === value
        return (
          <Link
            key={value}
            href={planHref(tab, value)}
            aria-current={active ? 'true' : undefined}
            className={`px-3 py-2 text-xs font-medium rounded-md transition-colors ${
              active ? 'bg-[#5bb6ff]/10 text-[#5bb6ff]' : 'text-white/50 hover:text-white/80'
            }`}
          >
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
