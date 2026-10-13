'use client'

import { useRouter } from 'next/navigation'
import { planHref, type PersonaFilter } from '@/lib/plan-q4/rules'
import type { PlanTab } from '@/components/plan-q4/plan-nav'

function optionLabel(t: PlanTab): string {
  const name = t.code ? `${t.code} · ${t.titulo}` : t.titulo
  if (!t.tipo) return name
  const tipo = t.tipo === 'accion' ? 'Acción' : 'Lectura'
  return t.pending ? `${name} — ${tipo} · ${t.pending} pendiente${t.pending === 1 ? '' : 's'}` : `${name} — ${tipo}`
}

export function TabSelect({ tabs, active, persona }: { tabs: PlanTab[]; active: string; persona: PersonaFilter }) {
  const router = useRouter()
  return (
    <label className="lg:hidden block mb-5">
      <span className="sr-only">Pestaña del plan</span>
      <select
        value={active}
        onChange={(e) => router.push(planHref(e.target.value, persona))}
        className="w-full bg-[#0c0c0f] border border-white/[0.1] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#5bb6ff]/50"
      >
        {tabs.map((t) => (
          <option key={t.key} value={t.key}>
            {optionLabel(t)}
          </option>
        ))}
      </select>
    </label>
  )
}
