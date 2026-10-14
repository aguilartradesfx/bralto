import { redirect } from 'next/navigation'
import { getPlanActor, getPlanContent, getPlanTasks } from '@/lib/plan-q4/data'
import { parseEtapas } from '@/lib/plan-q4/etapas'
import { costaRicaToday, weekStart } from '@/lib/plan-q4/fechas'
import { pendingByBlock } from '@/lib/plan-q4/rules'
import { contextoHtml } from '@/lib/plan-q4/markdown'
import { resolveView, resumenEquipo, VISTA_LABELS, type ViewParams } from '@/lib/plan-q4/vistas'
import { EquipoView } from '@/components/plan-q4/equipo'
import { EstrategiaView } from '@/components/plan-q4/estrategia'
import { EtapasView } from '@/components/plan-q4/etapas-view'
import { Inicio } from '@/components/plan-q4/inicio'
import { MisTareasView } from '@/components/plan-q4/mis-tareas'

export const metadata = { title: 'Plan Q4' }

export default async function PlanQ4Page({ searchParams }: { searchParams: Promise<ViewParams> }) {
  const actor = await getPlanActor()
  if (!actor) redirect('/login')

  const content = await getPlanContent()
  if (!content) {
    return (
      <div className="p-4 md:p-8">
        <h1 className="text-xl font-semibold text-fg">Plan Q4</h1>
        <p className="mt-2 text-sm text-fg/50">El plan todavía no está cargado.</p>
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
  // Qué es / cómo hacerlo de cada tarea, en HTML (marked se queda en el servidor)
  const textos = Object.fromEntries(
    tasks.map((t) => [
      t.id,
      {
        descripcionHtml: t.descripcion ? contextoHtml(t.descripcion) : undefined,
        instruccionesHtml: t.instrucciones ? contextoHtml(t.instrucciones) : undefined,
      },
    ]),
  )
  const list = { today, week, doneIds, canEdit: actor.slug !== null, areas: guia?.areas, textos }

  return (
    <div className="p-4 md:p-8 max-w-5xl">
      <div className="mb-8">
        <p className="font-mono text-[11px] uppercase tracking-widest text-fg/40">Plan Q4 · Octubre a diciembre 2026</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-fg">{view.vista === 'inicio' ? 'El plan del trimestre' : VISTA_LABELS[view.vista]}</h1>
      </div>
      {!list.canEdit && <p className="mb-4 text-xs text-amber-300/80">Podés ver el plan; marcar y editar tareas es solo del equipo del plan.</p>}

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
          list={{ today, week, doneIds, canEdit: list.canEdit, textos }}
        />
      )}
    </div>
  )
}
