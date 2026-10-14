'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check, ChevronDown, Loader2, Repeat, StickyNote } from 'lucide-react'
import { formatFecha, formatStamp } from '@/lib/plan-q4/fechas'
import { diffTask, isActiveWeekly, isDueThisWeek, isOverdue } from '@/lib/plan-q4/rules'
import { ESTADOS, ESTADO_LABELS, PERSONAS, PERSONA_NAMES, type Estado, type Persona, type PlanTask } from '@/lib/plan-q4/types'
import { MAX_NOTA } from '@/lib/plan-q4/validate'
import { Field, FIELD_CLASS } from '@/components/plan-q4/field'
import { sendJson } from '@/components/plan-q4/send-json'

interface Props {
  task: PlanTask
  today: string
  week: string
  doneThisWeek: boolean
  canEdit: boolean
  area?: string // nombre corto del área ('Campañas') en listas que mezclan bloques
}

export function TaskItem({ task, today, week, doneThisWeek, canEdit, area }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
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

  return (
    <li className="px-3 py-3 sm:px-4">
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={toggleDone}
          disabled={!canEdit || working || open || notStarted}
          aria-label={checkLabel}
          aria-pressed={done}
          className="-m-1.5 p-1.5 shrink-0 disabled:cursor-not-allowed"
        >
          <span
            className={`flex h-5 w-5 items-center justify-center rounded-md border transition-colors ${
              done
                ? 'border-emerald-400/60 bg-emerald-500/20 text-emerald-300'
                : notStarted
                  ? 'border-dashed border-white/15'
                  : 'border-white/25 hover:border-white/20'
            }`}
          >
            {working ? <Loader2 size={12} className="animate-spin" /> : done ? <Check size={13} strokeWidth={2.5} /> : null}
          </span>
        </button>

        <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="min-w-0 flex-1 text-left">
          <span className={`block text-sm leading-snug ${done ? 'text-white/40 line-through' : 'text-white'}`}>{task.titulo}</span>
          <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-white/40">
            {area && <span className="text-white/60">{area}</span>}
            <span className="font-mono">{task.id}</span>
            <span>
              {PERSONA_NAMES[task.responsable]}
              {task.apoyo && ` con ${PERSONA_NAMES[task.apoyo]}`}
            </span>
            {semanal ? (
              <span className="inline-flex items-center gap-1">
                <Repeat size={11} aria-hidden />
                {notStarted ? `Semanal, empieza el ${formatFecha(task.fecha)}` : `Semanal desde ${formatFecha(task.fecha)}`}
              </span>
            ) : (
              <span className={overdue ? 'text-red-300' : thisWeek ? 'text-amber-300' : ''}>
                {overdue ? 'Vencida · ' : thisWeek ? 'Esta semana · ' : ''}
                {formatFecha(task.fecha)}
              </span>
            )}
            {task.estado === 'en_curso' && <span className="text-white">En curso</span>}
            {task.actualizado_por && task.actualizado_en && (
              <span>
                {PERSONA_NAMES[task.actualizado_por]} · {formatStamp(task.actualizado_en)}
              </span>
            )}
          </span>
          {task.nota && (
            <span className="mt-1.5 flex gap-1.5 text-xs text-white/55">
              <StickyNote size={12} className="mt-0.5 shrink-0" aria-hidden />
              <span className="line-clamp-2 whitespace-pre-line">{task.nota}</span>
            </span>
          )}
        </button>

        <ChevronDown size={15} aria-hidden className={`mt-1 shrink-0 text-white/30 transition-transform ${open ? 'rotate-180' : ''}`} />
      </div>

      {error && !open && <p className="mt-2 sm:ml-8 text-xs text-red-300">{error}</p>}
      {open && (
        <TaskEditor
          task={task}
          canEdit={canEdit}
          working={working}
          error={error}
          onCancel={() => {
            setOpen(false)
            setError(null)
          }}
          onSave={async (patch) => {
            if (await save(() => sendJson(url, 'PATCH', patch))) setOpen(false)
          }}
        />
      )}
    </li>
  )
}

interface EditorProps {
  task: PlanTask
  canEdit: boolean
  working: boolean
  error: string | null
  onCancel: () => void
  onSave: (patch: object) => void
}

function TaskEditor({ task, canEdit, working, error, onCancel, onSave }: EditorProps) {
  // La tarea como estaba al abrir: se guarda solo lo que se tocó acá, sin pisar lo que otro cambió mientras tanto
  const [base] = useState(task)
  const [estado, setEstado] = useState<Estado>(task.estado ?? 'pendiente')
  const [responsable, setResponsable] = useState<Persona>(task.responsable)
  const [apoyo, setApoyo] = useState<Persona | ''>(task.apoyo ?? '')
  const [fecha, setFecha] = useState(task.fecha)
  const [nota, setNota] = useState(task.nota ?? '')

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const patch = diffTask(base, { estado, responsable, apoyo: apoyo || null, fecha, nota })
    if (Object.keys(patch).length === 0) onCancel()
    else onSave(patch)
  }

  return (
    <form onSubmit={submit} className="mt-3 sm:ml-8 grid gap-3 sm:grid-cols-2">
      {task.tipo === 'unica' && (
        <Field label="Estado">
          <select value={estado} onChange={(e) => setEstado(e.target.value as Estado)} disabled={!canEdit} className={FIELD_CLASS}>
            {ESTADOS.map((s) => (
              <option key={s} value={s}>{ESTADO_LABELS[s]}</option>
            ))}
          </select>
        </Field>
      )}
      <Field label={task.tipo === 'semanal' ? 'Desde' : 'Fecha límite'}>
        <input type="date" required value={fecha} onChange={(e) => setFecha(e.target.value)} disabled={!canEdit} className={FIELD_CLASS} />
      </Field>
      <Field label="Responsable">
        <select
          value={responsable}
          onChange={(e) => {
            const next = e.target.value as Persona
            setResponsable(next)
            if (apoyo === next) setApoyo('')
          }}
          disabled={!canEdit}
          className={FIELD_CLASS}
        >
          {PERSONAS.map((p) => (
            <option key={p} value={p}>{PERSONA_NAMES[p]}</option>
          ))}
        </select>
      </Field>
      <Field label="Apoyo">
        <select value={apoyo} onChange={(e) => setApoyo(e.target.value as Persona | '')} disabled={!canEdit} className={FIELD_CLASS}>
          <option value="">Nadie</option>
          {PERSONAS.filter((p) => p !== responsable).map((p) => (
            <option key={p} value={p}>{PERSONA_NAMES[p]}</option>
          ))}
        </select>
      </Field>
      <Field label="Nota" className="sm:col-span-2">
        <textarea rows={3} maxLength={MAX_NOTA} value={nota} onChange={(e) => setNota(e.target.value)} disabled={!canEdit} className={FIELD_CLASS} />
      </Field>
      {error && <p className="sm:col-span-2 text-xs text-red-300">{error}</p>}
      <div className="sm:col-span-2 flex gap-2">
        <button
          type="submit"
          disabled={!canEdit || working}
          className="pn-btn-solid px-4 py-2 text-sm font-semibold disabled:opacity-40"
        >
          {working ? 'Guardando…' : 'Guardar'}
        </button>
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm rounded-lg text-white/60 hover:text-white hover:bg-white/[0.05] transition-colors">
          Cancelar
        </button>
      </div>
    </form>
  )
}
