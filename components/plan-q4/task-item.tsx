'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check, ChevronDown, Loader2, StickyNote } from 'lucide-react'
import { formatFecha, formatStamp } from '@/lib/plan-q4/fechas'
import { diffTask, isActiveWeekly, isDueThisWeek, isOverdue } from '@/lib/plan-q4/rules'
import { ESTADOS, ESTADO_LABELS, PERSONAS, PERSONA_NAMES, type Estado, type Persona, type PlanTask } from '@/lib/plan-q4/types'
import { MAX_DESCRIPCION, MAX_INSTRUCCIONES, MAX_NOTA } from '@/lib/plan-q4/validate'
import { Field, FIELD_CLASS } from '@/components/plan-q4/field'
import { sendJson } from '@/components/plan-q4/send-json'

// Qué es / cómo hacerlo ya convertidos a HTML en el servidor
export interface TaskHtml {
  descripcionHtml?: string
  instruccionesHtml?: string
}

interface Props {
  task: PlanTask
  today: string
  week: string
  doneThisWeek: boolean
  canEdit: boolean
  area?: string // nombre corto del área ('Campañas') en listas que mezclan bloques
  html?: TaskHtml
}

const Dot = () => <span aria-hidden className="text-white/20">·</span>
const label = 'mb-1.5 text-[11px] font-medium uppercase tracking-wide text-white/40'

export function TaskItem({ task, today, week, doneThisWeek, canEdit, area, html }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, startRefresh] = useTransition()
  const working = busy || refreshing
  const semanal = task.tipo === 'semanal'
  const notStarted = semanal && !isActiveWeekly(task, today)
  const done = semanal ? doneThisWeek : task.estado === 'hecho'
  const overdue = isOverdue(task, today)
  const thisWeek = !overdue && !done && isDueThisWeek(task, today)
  const url = `/api/plan-q4/tasks/${encodeURIComponent(task.id)}`

  async function save(send: () => Promise<string | null>): Promise<boolean> {
    setBusy(true)
    setError(null)
    const err = await send()
    setBusy(false)
    if (err) {
      setError(err)
      return false
    }
    startRefresh(() => router.refresh())
    return true
  }

  function toggleDone() {
    void save(() =>
      semanal
        ? sendJson(`${url}/weeks`, 'PUT', { week_start: week, done: !done })
        : sendJson(url, 'PATCH', { estado: done ? 'pendiente' : 'hecho' }),
    )
  }

  const checkLabel = semanal
    ? done ? 'Desmarcar esta semana' : 'Marcar hecha esta semana'
    : done ? 'Marcar como pendiente' : 'Marcar como hecha'

  const fecha = semanal
    ? notStarted ? `Cada semana desde el ${formatFecha(task.fecha)}` : 'Cada semana'
    : overdue ? `Vencida · ${formatFecha(task.fecha)}` : formatFecha(task.fecha)

  return (
    <li className="py-2.5">
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={toggleDone}
          disabled={!canEdit || working || editing || notStarted}
          aria-label={checkLabel}
          aria-pressed={done}
          className="-m-1.5 p-1.5 shrink-0 disabled:cursor-not-allowed"
        >
          <span
            className={`flex h-[18px] w-[18px] items-center justify-center rounded-[6px] border transition-colors ${
              done
                ? 'border-emerald-400/60 bg-emerald-500/20 text-emerald-300'
                : notStarted
                  ? 'border-dashed border-white/15'
                  : 'border-white/30 hover:border-white/70'
            }`}
          >
            {working ? <Loader2 size={11} className="animate-spin" /> : done ? <Check size={12} strokeWidth={2.5} /> : null}
          </span>
        </button>

        <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="group min-w-0 flex-1 text-left">
          <span className={`block text-sm leading-snug transition-colors ${done ? 'text-white/35 line-through' : 'text-white/90 group-hover:text-white'}`}>
            {task.titulo}
          </span>
          <span className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-[11px] text-white/40">
            {area && (
              <>
                <span>{area}</span>
                <Dot />
              </>
            )}
            <span className={overdue ? 'text-red-300' : thisWeek ? 'text-amber-300' : ''}>{fecha}</span>
            <Dot />
            <span>
              {PERSONA_NAMES[task.responsable]}
              {task.apoyo && ` con ${PERSONA_NAMES[task.apoyo]}`}
            </span>
            {task.estado === 'en_curso' && (
              <>
                <Dot />
                <span className="text-white/80">En curso</span>
              </>
            )}
            {task.nota && <StickyNote size={11} className="ml-1" aria-label="Tiene nota" />}
          </span>
        </button>

        <ChevronDown size={14} aria-hidden className={`mt-1 shrink-0 text-white/25 transition-transform ${open ? 'rotate-180' : ''}`} />
      </div>

      {error && !open && <p className="mt-2 ml-8 text-xs text-red-300">{error}</p>}

      {open && (
        <div className="mt-3 mb-1 ml-8 space-y-4">
          {html?.descripcionHtml && (
            <div>
              <p className={label}>Qué es</p>
              <div className="plan-md" dangerouslySetInnerHTML={{ __html: html.descripcionHtml }} />
            </div>
          )}
          {html?.instruccionesHtml && (
            <div>
              <p className={label}>Cómo hacerlo</p>
              <div className="plan-md" dangerouslySetInnerHTML={{ __html: html.instruccionesHtml }} />
            </div>
          )}
          {!html?.descripcionHtml && !html?.instruccionesHtml && <p className="text-xs text-white/40">Esta tarea todavía no tiene instrucciones.</p>}
          {task.nota && !editing && (
            <div>
              <p className={label}>Nota</p>
              <p className="text-sm text-white/70 whitespace-pre-line">{task.nota}</p>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.06] pt-3">
            <p className="text-[11px] text-white/35">
              <span className="font-mono">{task.id}</span>
              {task.estado && ` · ${ESTADO_LABELS[task.estado]}`}
              {task.actualizado_por && task.actualizado_en && ` · ${PERSONA_NAMES[task.actualizado_por]}, ${formatStamp(task.actualizado_en)}`}
            </p>
            {canEdit && !editing && (
              <button type="button" onClick={() => setEditing(true)} className="pn-btn-glass px-3.5 py-1.5 text-xs">
                Editar
              </button>
            )}
          </div>

          {editing && (
            <TaskEditor
              task={task}
              working={working}
              error={error}
              onCancel={() => {
                setEditing(false)
                setError(null)
              }}
              onSave={async (patch) => {
                if (await save(() => sendJson(url, 'PATCH', patch))) setEditing(false)
              }}
            />
          )}
        </div>
      )}
    </li>
  )
}

interface EditorProps {
  task: PlanTask
  working: boolean
  error: string | null
  onCancel: () => void
  onSave: (patch: object) => void
}

function TaskEditor({ task, working, error, onCancel, onSave }: EditorProps) {
  // La tarea como estaba al abrir: se guarda solo lo que se tocó acá, sin pisar lo que otro cambió mientras tanto
  const [base] = useState(task)
  const [estado, setEstado] = useState<Estado>(task.estado ?? 'pendiente')
  const [responsable, setResponsable] = useState<Persona>(task.responsable)
  const [apoyo, setApoyo] = useState<Persona | ''>(task.apoyo ?? '')
  const [fecha, setFecha] = useState(task.fecha)
  const [nota, setNota] = useState(task.nota ?? '')
  const [descripcion, setDescripcion] = useState(task.descripcion ?? '')
  const [instrucciones, setInstrucciones] = useState(task.instrucciones ?? '')
  const delPanel = task.origen === 'panel'

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const patch = diffTask(base, { estado, responsable, apoyo: apoyo || null, fecha, nota, descripcion, instrucciones })
    if (Object.keys(patch).length === 0) onCancel()
    else onSave(patch)
  }

  return (
    <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
      {task.tipo === 'unica' && (
        <Field label="Estado">
          <select value={estado} onChange={(e) => setEstado(e.target.value as Estado)} className={FIELD_CLASS}>
            {ESTADOS.map((s) => (
              <option key={s} value={s}>{ESTADO_LABELS[s]}</option>
            ))}
          </select>
        </Field>
      )}
      <Field label={task.tipo === 'semanal' ? 'Desde' : 'Fecha límite'}>
        <input type="date" required value={fecha} onChange={(e) => setFecha(e.target.value)} className={FIELD_CLASS} />
      </Field>
      <Field label="Responsable">
        <select
          value={responsable}
          onChange={(e) => {
            const next = e.target.value as Persona
            setResponsable(next)
            if (apoyo === next) setApoyo('')
          }}
          className={FIELD_CLASS}
        >
          {PERSONAS.map((p) => (
            <option key={p} value={p}>{PERSONA_NAMES[p]}</option>
          ))}
        </select>
      </Field>
      <Field label="Apoyo">
        <select value={apoyo} onChange={(e) => setApoyo(e.target.value as Persona | '')} className={FIELD_CLASS}>
          <option value="">Nadie</option>
          {PERSONAS.filter((p) => p !== responsable).map((p) => (
            <option key={p} value={p}>{PERSONA_NAMES[p]}</option>
          ))}
        </select>
      </Field>
      {delPanel && (
        <>
          <Field label="Qué es" className="sm:col-span-2">
            <textarea rows={2} required maxLength={MAX_DESCRIPCION} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} className={FIELD_CLASS} />
          </Field>
          <Field label="Cómo hacerlo" className="sm:col-span-2">
            <textarea rows={4} required maxLength={MAX_INSTRUCCIONES} value={instrucciones} onChange={(e) => setInstrucciones(e.target.value)} className={FIELD_CLASS} />
          </Field>
        </>
      )}
      <Field label="Nota" className="sm:col-span-2">
        <textarea rows={3} maxLength={MAX_NOTA} value={nota} onChange={(e) => setNota(e.target.value)} className={FIELD_CLASS} />
      </Field>
      {!delPanel && <p className="sm:col-span-2 text-[11px] text-white/35">Qué es y cómo hacerlo de las tareas del plan se cambian en el archivo del plan.</p>}
      {error && <p className="sm:col-span-2 text-xs text-red-300">{error}</p>}
      <div className="sm:col-span-2 flex gap-2">
        <button type="submit" disabled={working} className="pn-btn-solid px-4 py-2 text-sm font-semibold disabled:opacity-40">
          {working ? 'Guardando…' : 'Guardar'}
        </button>
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm rounded-lg text-white/60 hover:text-white hover:bg-white/[0.05] transition-colors">
          Cancelar
        </button>
      </div>
    </form>
  )
}
