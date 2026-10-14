'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Loader2 } from 'lucide-react'
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
  area?: string // nombre corto del área ('Campañas')
  html?: TaskHtml
  showPersona?: boolean // listas de todo el equipo: el nombre va en la línea
}

const label = 'mb-1.5 text-[11px] font-medium uppercase tracking-wide text-white/40'

export function TaskItem({ task, today, week, doneThisWeek, canEdit, area, html, showPersona }: Props) {
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

  // En la línea, corta; adentro, con contexto
  const fechaCorta = semanal ? (notStarted ? `desde ${formatFecha(task.fecha)}` : 'semanal') : formatFecha(task.fecha)
  const fechaLarga = semanal
    ? notStarted ? `Cada semana desde el ${formatFecha(task.fecha)}` : 'Cada semana'
    : overdue ? `Venció el ${formatFecha(task.fecha)}` : thisWeek ? `Para el ${formatFecha(task.fecha)}, esta semana` : `Para el ${formatFecha(task.fecha)}`

  return (
    <li>
      <div className="flex items-start gap-3 rounded-[10px] px-2 -mx-2 transition-colors hover:bg-white/[0.03]">
        <button
          type="button"
          onClick={toggleDone}
          disabled={!canEdit || working || editing || notStarted}
          aria-label={checkLabel}
          aria-pressed={done}
          className="-m-1 mt-[5px] p-1 shrink-0 disabled:cursor-not-allowed"
        >
          <span
            className={`flex h-4 w-4 items-center justify-center rounded-full border transition-colors ${
              done
                ? 'border-white/25 bg-white/15 text-white/80'
                : notStarted
                  ? 'border-dashed border-white/20'
                  : 'border-white/35 hover:border-white/80'
            }`}
          >
            {working ? <Loader2 size={10} className="animate-spin" /> : done ? <Check size={10} strokeWidth={3} /> : null}
          </span>
        </button>

        <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="flex min-w-0 flex-1 items-baseline gap-3 py-2 text-left">
          <span className={`min-w-0 flex-1 text-sm leading-snug ${done ? 'text-white/30 line-through' : 'text-white/85'}`}>{task.titulo}</span>
          <span className={`shrink-0 text-xs tabular-nums ${overdue ? 'text-red-300' : 'text-white/35'}`}>
            {showPersona && `${PERSONA_NAMES[task.responsable]} · `}
            {fechaCorta}
          </span>
        </button>
      </div>

      {error && !open && <p className="mb-2 ml-7 text-xs text-red-300">{error}</p>}

      {open && (
        <div className="mb-4 mt-1 ml-7 space-y-4">
          <p className="text-xs text-white/45">
            {[area, `${PERSONA_NAMES[task.responsable]}${task.apoyo ? ` con ${PERSONA_NAMES[task.apoyo]}` : ''}`, fechaLarga, task.estado === 'en_curso' ? 'En curso' : null]
              .filter(Boolean)
              .join(' · ')}
          </p>
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

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[11px] text-white/30">
              <span className="font-mono">{task.id}</span>
              {task.actualizado_por && task.actualizado_en && ` · ${PERSONA_NAMES[task.actualizado_por]}, ${formatStamp(task.actualizado_en)}`}
            </p>
            {canEdit && !editing && (
              <button type="button" onClick={() => setEditing(true)} className="text-xs text-white/55 underline-offset-4 hover:text-white hover:underline">
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
