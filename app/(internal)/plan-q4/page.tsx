import { redirect } from 'next/navigation'
import { ChevronRight } from 'lucide-react'
import { costaRicaToday, weekStart } from '@/lib/plan-q4/fechas'
import { getPlanActor, getPlanContent, getPlanTasks } from '@/lib/plan-q4/data'
import { contextoHtml } from '@/lib/plan-q4/markdown'
import { compareTasks, matchesPersona, pendingByBlock, resolvePersona, resolveTab, RESUMEN_TAB } from '@/lib/plan-q4/rules'
import { PERSONA_NAMES } from '@/lib/plan-q4/types'
import { Markdown } from '@/components/plan-q4/markdown'
import { PersonaFilterBar } from '@/components/plan-q4/persona-filter'
import { PlanNav, type PlanTab } from '@/components/plan-q4/plan-nav'
import { Resumen } from '@/components/plan-q4/resumen'
import { TaskList } from '@/components/plan-q4/task-list'
import { TipoBadge } from '@/components/plan-q4/tipo-badge'

export const metadata = { title: 'Plan Q4' }

export default async function PlanQ4Page({ searchParams }: { searchParams: Promise<{ tab?: string; persona?: string }> }) {
  const actor = await getPlanActor()
  if (!actor) redirect('/login')

  const content = await getPlanContent()
  if (!content) {
    return (
      <div className="p-4 md:p-8">
        <h1 className="text-xl font-semibold text-white">Plan Q4</h1>
        <p className="mt-2 text-sm text-white/50">El plan todavía no está cargado.</p>
      </div>
    )
  }

  const { blocks, resumen } = content
  const params = await searchParams
  const tab = resolveTab(params.tab, [RESUMEN_TAB, ...blocks.map((b) => b.key)])
  const persona = resolvePersona(params.persona, actor.slug)
  const today = costaRicaToday()
  const week = weekStart(today)
  const { tasks, checks } = await getPlanTasks(week)
  const doneIds = checks.filter((c) => c.done).map((c) => c.task_id)
  const pending = pendingByBlock(tasks, today, new Set(doneIds), persona)
  const list = { today, week, doneIds, canEdit: actor.slug !== null }

  const tabs: PlanTab[] = [
    { key: RESUMEN_TAB, code: null, titulo: 'Resumen', tipo: null, pending: null },
    ...blocks.map((b) => ({
      key: b.key,
      code: b.code,
      titulo: b.titulo,
      tipo: b.tipo,
      pending: b.tipo === 'accion' ? (pending.get(b.key) ?? 0) : null,
    })),
  ]
  const block = blocks.find((b) => b.key === tab)

  return (
    <div className="p-4 md:p-8 max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl font-semibold text-white">Plan Q4</h1>
          <p className="mt-0.5 text-sm text-white/40">Octubre a diciembre 2026</p>
        </div>
        <PersonaFilterBar tab={tab} persona={persona} />
      </div>
      {!list.canEdit && <p className="mb-5 text-xs text-amber-300/80">Podés ver el plan; editar tareas es solo del equipo del plan.</p>}

      <div className="lg:grid lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-8">
        <PlanNav tabs={tabs} active={tab} persona={persona} />
        <section className="min-w-0">
          {!block ? (
            <Resumen resumen={resumen} blocks={blocks} tasks={tasks} persona={persona} list={list} />
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2 mb-5">
                {block.code && <span className="font-mono text-xs text-white/40">{block.code}</span>}
                <h2 className="text-lg font-semibold text-white">{block.titulo}</h2>
                <TipoBadge tipo={block.tipo} />
              </div>
              {block.tipo === 'lectura' ? (
                <Markdown html={contextoHtml(block.contexto)} />
              ) : (
                <>
                  <TaskList
                    tasks={tasks.filter((t) => t.bloque === block.key && matchesPersona(t, persona)).sort(compareTasks)}
                    {...list}
                    emptyText={persona === 'todos' ? 'Este bloque no tiene tareas.' : `${PERSONA_NAMES[persona]} no tiene tareas en este bloque.`}
                    newTask={{ bloque: block.key, responsable: persona === 'todos' ? (actor.slug ?? 'ale') : persona }}
                  />
                  <details open className="group mt-8 border-t border-white/[0.06] pt-5">
                    <summary className="flex w-fit cursor-pointer list-none items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-white/40 hover:text-white/60 [&::-webkit-details-marker]:hidden">
                      <ChevronRight size={14} aria-hidden className="transition-transform group-open:rotate-90" />
                      Contexto
                    </summary>
                    <Markdown html={contextoHtml(block.contexto)} className="mt-4" />
                  </details>
                </>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  )
}
