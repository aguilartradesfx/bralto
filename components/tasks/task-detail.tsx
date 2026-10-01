'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, Ban, CalendarDays, Loader2, MessageSquare, Pencil, Trash2, Undo2, User } from 'lucide-react'
import { PriorityBadge, StatusBadge } from '@/components/tasks/badges'
import { formatDueDate } from '@/components/tasks/task-card'
import { STATUS_LABELS, transitionKind, type TaskStatus, type UpdateKind } from '@/lib/tasks/rules'
import type { TaskRow, TaskUpdateRow } from '@/lib/tasks/data'

const CARD = 'p-5 bg-white/[0.03] border border-white/[0.07] rounded-xl'
const INPUT =
  'w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#5bb6ff]/50 transition-colors'

export type TaskUpdateView = TaskUpdateRow & { authorName: string }

interface Props {
  task: TaskRow
  updates: TaskUpdateView[]
  isAdmin: boolean
  canEditChecklist: boolean
  allowed: TaskStatus[]
  assigneeName: string | null
  creatorName: string | null
  today: string
}

function actionLabel(from: TaskStatus, to: TaskStatus): string {
  if (to === 'en_progreso') {
    if (from === 'pendiente') return 'Empezar'
    if (from === 'bloqueada') return 'Retomar'
    if (from === 'en_revision') return 'Devolver'
    if (from === 'hecha') return 'Reabrir'
  }
  if (to === 'en_revision') return 'Enviar a revisión'
  if (to === 'bloqueada') return 'Marcar bloqueada'
  if (to === 'hecha') return from === 'en_revision' ? 'Aprobar' : 'Marcar hecha'
  return `Pasar a ${STATUS_LABELS[to]}`
}

// La acción que sigue en el flujo normal va resaltada
const PRIMARY: Partial<Record<TaskStatus, TaskStatus>> = {
  pendiente: 'en_progreso',
  en_progreso: 'en_revision',
  bloqueada: 'en_progreso',
  en_revision: 'hecha',
}

const UPDATE_ICONS: Record<UpdateKind, typeof MessageSquare> = {
  avance: MessageSquare,
  estado: ArrowRight,
  devolucion: Undo2,
  bloqueo: Ban,
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('es-CR', {
    timeZone: 'America/Costa_Rica',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function TaskDetail({ task, updates, isAdmin, canEditChecklist, allowed, assigneeName, creatorName, today }: Props) {
  const router = useRouter()
  const [checklist, setChecklist] = useState(task.checklist)
  const [pendingTo, setPendingTo] = useState<TaskStatus | null>(null)
  const [note, setNote] = useState('')
  const [progress, setProgress] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function call(key: string, url: string, method: string, body?: unknown): Promise<boolean> {
    setBusy(key)
    setError(null)
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
    const json = await res.json().catch(() => ({}))
    setBusy(null)
    if (!res.ok) {
      setError(json.error ?? 'Algo salió mal. Probá de nuevo.')
      return false
    }
    return true
  }

  async function toggleItem(index: number, done: boolean) {
    const previous = checklist
    setChecklist((items) => items.map((item, i) => (i === index ? { ...item, done } : item)))
    const ok = await call(`item-${index}`, `/api/tasks/${task.id}/checklist`, 'PATCH', { index, done })
    if (!ok) setChecklist(previous)
  }

  async function move(to: TaskStatus) {
    if (transitionKind(task.status, to).noteRequired && !note.trim()) {
      setPendingTo(to)
      return
    }
    const ok = await call(`status-${to}`, `/api/tasks/${task.id}/status`, 'POST', { to, note })
    if (ok) {
      setPendingTo(null)
      setNote('')
      router.refresh()
    }
  }

  async function addProgress(e: React.FormEvent) {
    e.preventDefault()
    const ok = await call('progress', `/api/tasks/${task.id}/updates`, 'POST', { body: progress })
    if (ok) {
      setProgress('')
      router.refresh()
    }
  }

  async function remove() {
    if (!confirm('¿Borrar esta tarea y todo su historial? No se puede deshacer.')) return
    if (await call('delete', `/api/tasks/${task.id}`, 'DELETE')) {
      router.push('/tareas')
      router.refresh()
    }
  }

  const overdue = !!task.due_date && task.due_date < today && task.status !== 'hecha'
  const noteLabel = pendingTo === 'bloqueada' ? 'Motivo del bloqueo' : 'Qué hay que corregir'
  const ordered = [...allowed].sort((a, b) => Number(b === PRIMARY[task.status]) - Number(a === PRIMARY[task.status]))

  return (
    <div className="space-y-4">
      <div className={CARD}>
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <StatusBadge status={task.status} />
          <PriorityBadge priority={task.priority} />
          {task.due_date && (
            <span className={`flex items-center gap-1 text-xs ${overdue ? 'text-red-300' : 'text-white/45'}`}>
              <CalendarDays size={12} /> {overdue ? 'Venció el' : 'Para el'} {formatDueDate(task.due_date)}
            </span>
          )}
          {isAdmin && (
            <div className="flex items-center gap-1 ml-auto">
              <Link href={`/tareas/${task.id}/editar`} className="p-2 text-white/35 hover:text-white/80 transition-colors" title="Editar">
                <Pencil size={14} />
              </Link>
              <button onClick={remove} disabled={busy === 'delete'} className="p-2 text-white/35 hover:text-red-300 transition-colors" title="Borrar">
                <Trash2 size={14} />
              </button>
            </div>
          )}
        </div>
        <h1 className="text-lg font-semibold text-white leading-snug">{task.title}</h1>
        <p className="flex items-center gap-1.5 text-xs text-white/40 mt-1.5">
          <User size={12} /> {assigneeName ?? 'Sin asignar'}
          {creatorName && <span className="text-white/25">· creada por {creatorName}</span>}
        </p>
        {task.description && <p className="text-sm text-white/70 leading-relaxed whitespace-pre-wrap mt-4">{task.description}</p>}

        {checklist.length > 0 && (
          <div className="mt-5">
            <p className="text-xs font-medium text-white/45 mb-2">Terminada cuando…</p>
            <ul className="space-y-1.5">
              {checklist.map((item, i) => (
                <li key={i}>
                  <label className={`flex items-start gap-2.5 text-sm ${canEditChecklist ? 'cursor-pointer' : ''}`}>
                    <input
                      type="checkbox"
                      checked={item.done}
                      disabled={!canEditChecklist || busy === `item-${i}`}
                      onChange={(e) => toggleItem(i, e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded border-white/20 bg-white/5 accent-[#5bb6ff]"
                    />
                    <span className={item.done ? 'text-white/35 line-through' : 'text-white/80'}>{item.text}</span>
                  </label>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {ordered.length > 0 && (
        <div className={CARD}>
          <div className="flex flex-wrap gap-2">
            {ordered.map((to) => (
              <button
                key={to}
                onClick={() => move(to)}
                disabled={busy !== null}
                className={`flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-40 ${
                  to === PRIMARY[task.status]
                    ? 'bg-[#5bb6ff] text-black hover:bg-[#7cc5ff]'
                    : 'bg-white/[0.05] text-white/70 hover:bg-white/[0.09]'
                }`}
              >
                {busy === `status-${to}` && <Loader2 size={14} className="animate-spin" />}
                {actionLabel(task.status, to)}
              </button>
            ))}
          </div>
          {pendingTo && (
            <div className="mt-4">
              <label className="block text-xs font-medium text-white/45 mb-1.5" htmlFor="note">{noteLabel}</label>
              <textarea id="note" rows={3} value={note} onChange={(e) => setNote(e.target.value)} className={INPUT} autoFocus />
              <div className="flex justify-end gap-2 mt-2">
                <button onClick={() => { setPendingTo(null); setNote('') }} className="px-3 py-1.5 text-sm text-white/50 hover:text-white/80">
                  Cancelar
                </button>
                <button
                  onClick={() => move(pendingTo)}
                  disabled={!note.trim() || busy !== null}
                  className="px-3.5 py-1.5 text-sm font-medium rounded-lg bg-[#5bb6ff] text-black hover:bg-[#7cc5ff] disabled:opacity-40"
                >
                  {actionLabel(task.status, pendingTo)}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {error && <p className="text-sm text-red-300">{error}</p>}

      <div className={CARD}>
        <form onSubmit={addProgress}>
          <label className="block text-xs font-medium text-white/45 mb-1.5" htmlFor="progress">Agregar avance</label>
          <textarea
            id="progress"
            rows={3}
            value={progress}
            onChange={(e) => setProgress(e.target.value)}
            className={INPUT}
            placeholder="Qué hiciste hoy en esta tarea"
          />
          <div className="flex justify-end mt-2">
            <button
              type="submit"
              disabled={!progress.trim() || busy !== null}
              className="flex items-center gap-2 px-3.5 py-1.5 text-sm font-medium rounded-lg bg-white/[0.06] text-white/80 hover:bg-white/[0.1] disabled:opacity-40 transition-colors"
            >
              {busy === 'progress' && <Loader2 size={14} className="animate-spin" />}
              Guardar avance
            </button>
          </div>
        </form>

        <div className="mt-5 space-y-4">
          {updates.length === 0 && <p className="text-sm text-white/30">Todavía no hay avances.</p>}
          {updates.map((u) => {
            const Icon = UPDATE_ICONS[u.kind]
            return (
              <div key={u.id} className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-white/[0.05] flex items-center justify-center shrink-0">
                  <Icon size={13} className={u.kind === 'bloqueo' ? 'text-red-300' : u.kind === 'devolucion' ? 'text-amber-300' : 'text-white/50'} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-white/40">
                    <span className="text-white/70 font-medium">{u.authorName}</span> · {formatDateTime(u.created_at)}
                    {u.kind !== 'avance' && u.from_status && u.to_status && (
                      <span> · {STATUS_LABELS[u.from_status]} → {STATUS_LABELS[u.to_status]}</span>
                    )}
                  </p>
                  {u.body && <p className="text-sm text-white/75 whitespace-pre-wrap mt-0.5">{u.body}</p>}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
