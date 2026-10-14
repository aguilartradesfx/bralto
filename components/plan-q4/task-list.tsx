'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import type { Persona, PlanTask } from '@/lib/plan-q4/types'
import { NewTaskForm } from '@/components/plan-q4/new-task-form'
import { TaskItem, type TaskHtml } from '@/components/plan-q4/task-item'

export interface TaskListProps {
  tasks: PlanTask[]
  today: string
  week: string
  doneIds: string[] // semanales con check esta semana
  canEdit: boolean
  emptyText?: string
  newTask?: { bloque: string; responsable: Persona }
  areas?: Record<string, string> // bloque → nombre corto del área, para listas que mezclan bloques
  textos?: Record<string, TaskHtml> // id → qué es / cómo hacerlo en HTML
  showPersona?: boolean // listas de todo el equipo
}

export function TaskList({ tasks, today, week, doneIds, canEdit, emptyText, newTask, areas, textos, showPersona }: TaskListProps) {
  const [adding, setAdding] = useState(false)
  const done = new Set(doneIds)
  return (
    <div>
      {tasks.length === 0 && emptyText && <p className="text-sm text-fg/40">{emptyText}</p>}
      {tasks.length > 0 && (
        <ul>
          {tasks.map((t) => (
            <TaskItem
              key={t.id}
              task={t}
              today={today}
              week={week}
              doneThisWeek={done.has(t.id)}
              canEdit={canEdit}
              area={areas?.[t.bloque]}
              html={textos?.[t.id]}
              showPersona={showPersona}
            />
          ))}
        </ul>
      )}
      {newTask && canEdit && (adding ? (
        <NewTaskForm bloque={newTask.bloque} defaultResponsable={newTask.responsable} today={today} onClose={() => setAdding(false)} />
      ) : (
        <button type="button" onClick={() => setAdding(true)} className="mt-2 inline-flex items-center gap-1.5 py-1 text-[13px] text-fg/45 hover:text-fg transition-colors">
          <Plus size={14} aria-hidden />
          Nueva tarea
        </button>
      ))}
    </div>
  )
}
