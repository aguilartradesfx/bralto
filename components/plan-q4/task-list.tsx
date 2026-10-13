'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import type { Persona, PlanTask } from '@/lib/plan-q4/types'
import { NewTaskForm } from '@/components/plan-q4/new-task-form'
import { TaskItem } from '@/components/plan-q4/task-item'

export interface TaskListProps {
  tasks: PlanTask[]
  today: string
  week: string
  doneIds: string[] // semanales con check esta semana
  canEdit: boolean
  emptyText?: string
  newTask?: { bloque: string; responsable: Persona }
}

export function TaskList({ tasks, today, week, doneIds, canEdit, emptyText, newTask }: TaskListProps) {
  const [adding, setAdding] = useState(false)
  const done = new Set(doneIds)
  return (
    <div>
      {tasks.length === 0 && emptyText && <p className="text-sm text-white/40">{emptyText}</p>}
      {tasks.length > 0 && (
        <ul className="divide-y divide-white/[0.05] border border-white/[0.07] rounded-xl bg-white/[0.02]">
          {tasks.map((t) => (
            <TaskItem key={t.id} task={t} today={today} week={week} doneThisWeek={done.has(t.id)} canEdit={canEdit} />
          ))}
        </ul>
      )}
      {newTask && canEdit && (adding ? (
        <NewTaskForm bloque={newTask.bloque} defaultResponsable={newTask.responsable} today={today} onClose={() => setAdding(false)} />
      ) : (
        <button type="button" onClick={() => setAdding(true)} className="mt-3 inline-flex items-center gap-1.5 py-1 text-sm text-white hover:text-white/70 transition-colors">
          <Plus size={15} aria-hidden />
          Nueva tarea
        </button>
      ))}
    </div>
  )
}
