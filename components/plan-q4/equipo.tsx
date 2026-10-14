import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { contextoHtml } from '@/lib/plan-q4/markdown'
import { PERSONA_NAMES, type GuiaData, type Persona } from '@/lib/plan-q4/types'
import { viewHref, type ResumenPersona } from '@/lib/plan-q4/vistas'
import { Markdown } from '@/components/plan-q4/markdown'

export function EquipoView({ resumen, guia, actor }: { resumen: ResumenPersona[]; guia: GuiaData | null; actor: Persona | null }) {
  return (
    <div className="space-y-4">
      <p className="-mt-4 text-sm text-white/45">Qué hace cada quien y cómo va su semana.</p>
      <div className="grid gap-3 md:grid-cols-3">
        {resumen.map((r) => {
          const pct = r.total ? Math.round((r.hechas / r.total) * 100) : 0
          return (
            <section key={r.persona} className="pn-glass rounded-[20px] p-5 flex flex-col">
              <h3 className="text-base font-semibold text-white">
                {PERSONA_NAMES[r.persona]}
                {r.persona === actor && <span className="ml-2 text-xs font-normal text-white/45">(vos)</span>}
              </h3>
              {guia?.equipo[r.persona] && <Markdown html={contextoHtml(guia.equipo[r.persona]!)} className="mt-2 text-[13px]" />}
              <dl className="mt-4 grid grid-cols-2 gap-2">
                <div className="pn-solid rounded-[12px] p-3">
                  <dt className="text-[11px] text-white/45">Esta semana</dt>
                  <dd className="mt-0.5 text-lg font-semibold tabular-nums text-white">{r.semana}</dd>
                </div>
                <div className="pn-solid rounded-[12px] p-3">
                  <dt className="text-[11px] text-white/45">Vencidas</dt>
                  <dd className={`mt-0.5 text-lg font-semibold tabular-nums ${r.vencidas > 0 ? 'text-red-300' : 'text-white'}`}>{r.vencidas}</dd>
                </div>
              </dl>
              <div className="mt-4 flex items-center justify-between text-xs text-white/50">
                <span>Tareas hechas del trimestre</span>
                <span className="tabular-nums">
                  {r.hechas}/{r.total}
                </span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/[0.06]" aria-hidden>
                <div className="h-full rounded-full bg-white/80" style={{ width: `${pct}%` }} />
              </div>
              <Link
                href={viewHref({ vista: 'tareas' }, r.persona)}
                className="pn-btn-glass mt-5 inline-flex w-fit items-center gap-2 px-4 py-2 text-sm"
              >
                Ver sus tareas
                <ArrowRight size={14} strokeWidth={1.5} absoluteStrokeWidth aria-hidden />
              </Link>
            </section>
          )
        })}
      </div>
    </div>
  )
}
