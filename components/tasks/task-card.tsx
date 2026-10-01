import Link from 'next/link'
import { CalendarDays, CheckSquare, User } from 'lucide-react'
import { PriorityBadge } from '@/components/tasks/badges'
import type { TaskRow } from '@/lib/tasks/data'

export function formatDueDate(dueDate: string): string {
  return new Date(`${dueDate}T12:00:00Z`).toLocaleDateString('es-CR', { day: 'numeric', month: 'short', timeZone: 'UTC' })
}

export function TaskCard({ task, assigneeName, today }: { task: TaskRow; assigneeName?: string | null; today: string }) {
  const done = task.checklist.filter((i) => i.done).length
  const overdue = !!task.due_date && task.due_date < today && task.status !== 'hecha'

  return (
    <Link
      href={`/tareas/${task.id}`}
      className="block p-3.5 bg-white/[0.03] border border-white/[0.07] rounded-xl hover:border-[#5bb6ff]/30 hover:bg-white/[0.05] transition-all"
    >
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <PriorityBadge priority={task.priority} />
        {task.due_date && (
          <span className={`flex items-center gap-1 text-[11px] ${overdue ? 'text-red-300' : 'text-white/40'}`}>
            <CalendarDays size={11} />
            {formatDueDate(task.due_date)}
          </span>
        )}
      </div>
      <p className="text-sm text-white leading-snug line-clamp-2">{task.title}</p>
      <div className="flex items-center justify-between gap-2 mt-2.5 text-[11px] text-white/40">
        {assigneeName !== undefined ? (
          <span className="flex items-center gap-1 truncate">
            <User size={11} />
            {assigneeName ?? 'Sin asignar'}
          </span>
        ) : (
          <span />
        )}
        {task.checklist.length > 0 && (
          <span className={`flex items-center gap-1 shrink-0 ${done === task.checklist.length ? 'text-emerald-300' : ''}`}>
            <CheckSquare size={11} />
            {done}/{task.checklist.length}
          </span>
        )}
      </div>
    </Link>
  )
}
