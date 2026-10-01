import { PRIORITY_LABELS, STATUS_LABELS, type TaskPriority, type TaskStatus } from '@/lib/tasks/rules'

const STATUS_STYLES: Record<TaskStatus, string> = {
  pendiente: 'bg-white/[0.06] text-white/60 border-white/10',
  en_progreso: 'bg-[#5bb6ff]/10 text-[#5bb6ff] border-[#5bb6ff]/20',
  bloqueada: 'bg-red-500/10 text-red-300 border-red-500/20',
  en_revision: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
  hecha: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
}

const PRIORITY_STYLES: Record<TaskPriority, string> = {
  baja: 'text-white/35',
  normal: 'text-white/55',
  alta: 'text-amber-300',
  urgente: 'text-red-300',
}

export function StatusBadge({ status }: { status: TaskStatus }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded-full border ${STATUS_STYLES[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  )
}

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  return (
    <span className={`text-[11px] font-medium uppercase tracking-wide ${PRIORITY_STYLES[priority]}`}>
      {PRIORITY_LABELS[priority]}
    </span>
  )
}
