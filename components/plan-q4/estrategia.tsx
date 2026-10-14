import Link from 'next/link'
import { ArrowLeft, ChevronRight } from 'lucide-react'
import { contextoHtml } from '@/lib/plan-q4/markdown'
import type { PlanBlock } from '@/lib/plan-q4/parse'
import { compareTasks, matchesPersona, type PersonaFilter } from '@/lib/plan-q4/rules'
import { PERSONA_NAMES, type GuiaData, type Persona, type PlanTask } from '@/lib/plan-q4/types'
import { viewHref } from '@/lib/plan-q4/vistas'
import { Markdown } from '@/components/plan-q4/markdown'
import { TaskList, type TaskListProps } from '@/components/plan-q4/task-list'
import { TipoBadge } from '@/components/plan-q4/tipo-badge'

type ListContext = Pick<TaskListProps, 'today' | 'week' | 'doneIds' | 'canEdit' | 'textos'>

interface Props {
  blocks: PlanBlock[]
  guia: GuiaData | null
  tasks: PlanTask[]
  pending: Map<string, number>
  bloque: string | null
  persona: PersonaFilter
  actor: Persona | null
  list: ListContext
}

// Grupos de la guía; los bloques que no estén en ninguno van a "Otros"
function grupos(blocks: PlanBlock[], guia: GuiaData | null): { titulo: string; bloques: PlanBlock[] }[] {
  const byKey = new Map(blocks.map((b) => [b.key, b]))
  const out = (guia?.grupos ?? []).map((g) => ({ titulo: g.titulo, bloques: g.bloques.flatMap((k) => byKey.get(k) ?? []) }))
  const usados = new Set(out.flatMap((g) => g.bloques.map((b) => b.key)))
  const resto = blocks.filter((b) => !usados.has(b.key))
  if (resto.length > 0) out.push({ titulo: out.length ? 'Otros' : 'Bloques del plan', bloques: resto })
  return out.filter((g) => g.bloques.length > 0)
}

export function EstrategiaView({ blocks, guia, tasks, pending, bloque, persona, actor, list }: Props) {
  const block = blocks.find((b) => b.key === bloque)

  if (block) {
    return (
      <div className="space-y-5">
        <Link href={viewHref({ vista: 'estrategia' }, persona)} className="inline-flex items-center gap-1.5 text-sm text-white/55 hover:text-white">
          <ArrowLeft size={14} strokeWidth={1.5} absoluteStrokeWidth aria-hidden />
          Estrategia
        </Link>
        <div className="flex flex-wrap items-center gap-2">
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
              showPersona={persona === 'todos'}
              emptyText={persona === 'todos' ? 'Este bloque no tiene tareas.' : `${PERSONA_NAMES[persona]} no tiene tareas en este bloque.`}
              newTask={{ bloque: block.key, responsable: persona === 'todos' ? (actor ?? 'ale') : persona }}
            />
            <details open className="group border-t border-white/[0.06] pt-5">
              <summary className="flex w-fit cursor-pointer list-none items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-white/40 hover:text-white/60 [&::-webkit-details-marker]:hidden">
                <ChevronRight size={14} aria-hidden className="transition-transform group-open:rotate-90" />
                Por qué y cómo
              </summary>
              <Markdown html={contextoHtml(block.contexto)} className="mt-4" />
            </details>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <p className="-mt-4 text-sm text-white/45">El porqué de cada decisión del plan. Para consultar cuando haga falta.</p>
      {grupos(blocks, guia).map((g) => (
        <section key={g.titulo}>
          <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-white/40">{g.titulo}</h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {g.bloques.map((b) => {
              const n = pending.get(b.key) ?? 0
              return (
                <Link
                  key={b.key}
                  href={viewHref({ vista: 'estrategia', bloque: b.key }, persona)}
                  className="pn-solid flex items-center gap-3 rounded-[14px] p-3.5 transition-colors hover:bg-white/[0.05]"
                >
                  <span className="w-8 shrink-0 font-mono text-[11px] text-white/40">{b.code ?? ''}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm text-white leading-snug">{b.titulo}</span>
                    <span className="mt-0.5 block text-[11px] text-white/40">
                      {b.tipo === 'accion' ? (n > 0 ? `${n} ${n === 1 ? 'tarea pendiente' : 'tareas pendientes'}` : 'Sin pendientes') : 'Para leer'}
                    </span>
                  </span>
                  <ChevronRight size={15} strokeWidth={1.5} absoluteStrokeWidth className="shrink-0 text-white/30" aria-hidden />
                </Link>
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}
