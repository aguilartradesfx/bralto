import Link from 'next/link'
import { planHref, type PersonaFilter } from '@/lib/plan-q4/rules'
import { TabSelect } from '@/components/plan-q4/tab-select'

export interface PlanTab {
  key: string
  code: string | null
  titulo: string
  tipo: 'lectura' | 'accion' | null // null: Resumen
  pending: number | null // solo en las de acción
}

export function PlanNav({ tabs, active, persona }: { tabs: PlanTab[]; active: string; persona: PersonaFilter }) {
  return (
    <>
      <TabSelect tabs={tabs} active={active} persona={persona} />
      <nav aria-label="Pestañas del plan" className="hidden lg:block sticky top-6 self-start space-y-0.5">
        {tabs.map((t) => {
          const isActive = t.key === active
          return (
            <Link
              key={t.key}
              href={planHref(t.key, persona)}
              aria-current={isActive ? 'page' : undefined}
              className={`flex items-start gap-2 px-3 py-2 rounded-md transition-colors ${
                isActive ? 'pn-chip-on' : 'hover:bg-white/[0.04]'
              }`}
            >
              <span className={`w-7 shrink-0 pt-0.5 font-mono text-[11px] ${isActive ? 'text-white/70' : 'text-white/35'}`}>
                {t.code ?? ''}
              </span>
              <span className="min-w-0 flex-1">
                <span className={`block text-sm leading-snug ${isActive ? 'text-white' : 'text-white/70'}`}>{t.titulo}</span>
                {t.tipo && (
                  <span className={`block mt-0.5 text-[10px] uppercase tracking-wider ${t.tipo === 'accion' ? 'text-white/60' : 'text-white/30'}`}>
                    {t.tipo === 'accion' ? 'Acción' : 'Lectura'}
                  </span>
                )}
              </span>
              {!!t.pending && (
                <span className="shrink-0 mt-0.5 min-w-[20px] px-1.5 rounded-full bg-white/[0.08] text-[11px] leading-5 text-white/70 text-center">
                  {t.pending}
                  <span className="sr-only"> pendientes</span>
                </span>
              )}
            </Link>
          )
        })}
      </nav>
    </>
  )
}
