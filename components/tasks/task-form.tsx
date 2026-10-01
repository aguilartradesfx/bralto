'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Plus, Sparkles, X } from 'lucide-react'
import { PRIORITY_LABELS, TASK_PRIORITIES, type TaskPriority } from '@/lib/tasks/rules'
import type { ChecklistItem } from '@/lib/tasks/draft'
import type { TaskRow, TeamMember } from '@/lib/tasks/data'

const INPUT =
  'w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#5bb6ff]/50 transition-colors'
const LABEL = 'block text-xs font-medium text-white/45 mb-1.5'
const CARD = 'p-5 bg-white/[0.03] border border-white/[0.07] rounded-xl'

interface Props {
  mode: 'create' | 'edit'
  team: TeamMember[]
  initial?: TaskRow
}

export function TaskForm({ mode, team, initial }: Props) {
  const router = useRouter()
  const [idea, setIdea] = useState('')
  const [formulating, setFormulating] = useState(false)
  const [title, setTitle] = useState(initial?.title ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [checklist, setChecklist] = useState<ChecklistItem[]>(initial?.checklist ?? [])
  const [priority, setPriority] = useState<TaskPriority>(initial?.priority ?? 'normal')
  const [assigneeId, setAssigneeId] = useState(initial?.assignee_id ?? '')
  const [dueDate, setDueDate] = useState(initial?.due_date ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function formulate() {
    setFormulating(true)
    setError(null)
    const res = await fetch('/api/tasks/formulate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idea }),
    })
    const json = await res.json().catch(() => ({}))
    setFormulating(false)
    if (!res.ok) {
      setError(json.error ?? 'No se pudo formular la tarea')
      return
    }
    setTitle(json.draft.title)
    setDescription(json.draft.description)
    setChecklist(json.draft.checklist.map((text: string) => ({ text, done: false })))
    setPriority(json.draft.priority)
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    const payload = {
      title,
      description,
      checklist: checklist.filter((i) => i.text.trim()),
      priority,
      assignee_id: assigneeId || null,
      due_date: dueDate || null,
    }
    const res = await fetch(mode === 'create' ? '/api/tasks' : `/api/tasks/${initial!.id}`, {
      method: mode === 'create' ? 'POST' : 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) {
      setSaving(false)
      setError(json.error ?? 'No se pudo guardar la tarea')
      return
    }
    router.push(`/tareas/${mode === 'create' ? json.id : initial!.id}`)
    router.refresh()
  }

  function updateItem(index: number, text: string) {
    setChecklist((items) => items.map((item, i) => (i === index ? { ...item, text } : item)))
  }

  return (
    <form onSubmit={save} className="space-y-4">
      {mode === 'create' && (
        <div className={CARD}>
          <label className={LABEL} htmlFor="idea">Idea</label>
          <textarea
            id="idea"
            rows={3}
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            className={INPUT}
            placeholder="Ej.: hacer los posts de octubre para American Outlet, 4 piezas, para el viernes"
          />
          <div className="flex items-center justify-between gap-3 mt-3">
            <p className="text-xs text-white/35">La IA arma el borrador; revisalo antes de guardar.</p>
            <button
              type="button"
              onClick={formulate}
              disabled={formulating || idea.trim().length < 3}
              className="flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg bg-[#5bb6ff]/15 text-[#5bb6ff] hover:bg-[#5bb6ff]/25 disabled:opacity-40 transition-colors shrink-0"
            >
              {formulating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              {formulating ? 'Formulando…' : 'Formular con IA'}
            </button>
          </div>
        </div>
      )}

      <div className={`${CARD} space-y-4`}>
        <div>
          <label className={LABEL} htmlFor="title">Título</label>
          <input id="title" value={title} onChange={(e) => setTitle(e.target.value)} className={INPUT} required maxLength={200} />
        </div>

        <div>
          <label className={LABEL} htmlFor="description">Descripción</label>
          <textarea id="description" rows={6} value={description} onChange={(e) => setDescription(e.target.value)} className={INPUT} />
        </div>

        <div>
          <span className={LABEL}>Terminada cuando…</span>
          <div className="space-y-2">
            {checklist.map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  value={item.text}
                  onChange={(e) => updateItem(i, e.target.value)}
                  className={INPUT}
                  aria-label={`Criterio ${i + 1}`}
                />
                <button
                  type="button"
                  onClick={() => setChecklist((items) => items.filter((_, j) => j !== i))}
                  className="p-2 text-white/30 hover:text-red-300 transition-colors"
                  aria-label="Quitar criterio"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setChecklist((items) => [...items, { text: '', done: false }])}
            className="flex items-center gap-1.5 mt-2 text-xs text-[#5bb6ff] hover:text-[#7cc5ff] transition-colors"
          >
            <Plus size={13} /> Agregar criterio
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className={LABEL} htmlFor="priority">Prioridad</label>
            <select id="priority" value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)} className={INPUT}>
              {TASK_PRIORITIES.map((p) => (
                <option key={p} value={p} className="bg-[#131316]">{PRIORITY_LABELS[p]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={LABEL} htmlFor="assignee">Responsable</label>
            <select id="assignee" value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)} className={INPUT}>
              <option value="" className="bg-[#131316]">Sin asignar</option>
              {team.map((m) => (
                <option key={m.id} value={m.id} className="bg-[#131316]">{m.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={LABEL} htmlFor="due">Fecha límite</label>
            <input id="due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={`${INPUT} [color-scheme:dark]`} />
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-red-300">{error}</p>}

      <div className="flex items-center justify-end gap-3">
        <button type="button" onClick={() => router.back()} className="px-4 py-2 text-sm text-white/50 hover:text-white/80 transition-colors">
          Cancelar
        </button>
        <button
          type="submit"
          disabled={saving || !title.trim()}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-[#5bb6ff] text-black hover:bg-[#7cc5ff] disabled:opacity-40 transition-colors"
        >
          {saving && <Loader2 size={14} className="animate-spin" />}
          {mode === 'create' ? 'Crear tarea' : 'Guardar cambios'}
        </button>
      </div>
    </form>
  )
}
