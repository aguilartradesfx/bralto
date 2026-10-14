import { redirect } from 'next/navigation'
import { getPlanActor, getPlanContent, getPlanTasks } from '@/lib/plan-q4/data'
import { parseEtapas } from '@/lib/plan-q4/etapas'
import { costaRicaToday, weekStart } from '@/lib/plan-q4/fechas'
import { pendingByBlock } from '@/lib/plan-q4/rules'
import { resolveView, resumenEquipo, type ViewParams } from '@/lib/plan-q4/vistas'
import { EquipoView } from '@/components/plan-q4/equipo'
import { EstrategiaView } from '@/components/plan-q4/estrategia'
import { EtapasView } from '@/components/plan-q4/etapas-view'
import { Inicio } from '@/components/plan-q4/inicio'
import { MisTareasView } from '@/components/plan-q4/mis-tareas'
import { VistasNav } from '@/components/plan-q4/vistas-nav'

export const metadata = { title: 'Plan Q4' }

export default async function PlanQ4Page({ searchParams }: { searchParams: Promise<ViewParams> }) {
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

  const { blocks, resumen, guia } = content
  const view = resolveView(await searchParams, blocks.map((b) => b.key), actor.slug)
  const today = costaRicaToday()
  const week = weekStart(today)
  const { tasks, checks } = await getPlanTasks(week)
  const doneIds = checks.filter((c) => c.done).map((c) => c.task_id)
  const doneThisWeek = new Set(doneIds)
  const equipo = resumenEquipo(tasks, today, doneThisWeek)
  const mia = actor.slug ? (equipo.find((r) => r.persona === actor.slug) ?? null) : null
  const { etapas, decisiones } = parseEtapas(blocks)
  const list = { today, week, doneIds, canEdit: actor.slug !== null, areas: guia?.areas }

  return (
    <div className="p-4 md:p-8 max-w-5xl">
      <div className="mb-5">
        <h1 className="text-xl font-semibold text-white">Plan Q4</h1>
        <p className="mt-0.5 text-sm text-white/40">Octubre a diciembre 2026</p>
      </div>
      {!list.canEdit && <p className="mb-4 text-xs text-amber-300/80">Podés ver el plan; marcar y editar tareas es solo del equipo del plan.</p>}

      <div className="mb-6">
        <VistasNav active={view.vista} persona={view.persona} pendientes={(mia?.semana ?? 0) + (mia?.vencidas ?? 0)} />
      </div>

      {view.vista === 'inicio' && (
        <Inicio guia={guia} resumen={resumen} etapas={etapas} tasks={tasks} today={today} actor={actor.slug} persona={view.persona} miSemana={mia} />
      )}
      {view.vista === 'tareas' && <MisTareasView tasks={tasks} persona={view.persona} list={list} />}
      {view.vista === 'etapas' && (
        <EtapasView etapas={etapas} decisiones={decisiones} guia={guia} tasks={tasks} mes={view.etapa} persona={view.persona} actor={actor.slug} list={list} />
      )}
      {view.vista === 'equipo' && <EquipoView resumen={equipo} guia={guia} actor={actor.slug} />}
      {view.vista === 'estrategia' && (
        <EstrategiaView
          blocks={blocks}
          guia={guia}
          tasks={tasks}
          pending={pendingByBlock(tasks, today, doneThisWeek, view.persona)}
          bloque={view.bloque}
          persona={view.persona}
          actor={actor.slug}
          list={{ today, week, doneIds, canEdit: list.canEdit }}
        />
      )}
    </div>
  )
}
