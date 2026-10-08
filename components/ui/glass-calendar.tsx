'use client'

import * as React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  format,
  addMonths,
  subMonths,
  isSameDay,
  isToday,
  startOfMonth,
  getDaysInMonth,
  getDay,
} from 'date-fns'
import { enUS, es } from 'date-fns/locale'
import { cn } from '@/lib/utils'

// Calendario de /agendar con el sistema del home (estilos en app/[locale]/agendar/agendar.css)

// Lunes primero (convención latinoamericana)
const WEEKDAYS = {
  es: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
  en: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
}

const LABELS = {
  es: { prev: 'Mes anterior', next: 'Mes siguiente' },
  en: { prev: 'Previous month', next: 'Next month' },
}

// Domingo=0 → 6, lunes=1 → 0, …
function mondayFirstIndex(date: Date): number {
  const dow = getDay(date)
  return dow === 0 ? 6 : dow - 1
}

interface GlassCalendarProps extends React.HTMLAttributes<HTMLDivElement> {
  selectedDate?: Date | null
  onDateSelect?: (date: Date) => void
  /** Solo estas fechas se pueden elegir; las demás se ven deshabilitadas */
  selectableDates: Date[]
  /** Día que se marca como hoy. Sin él se usa el reloj local, que en el servidor (UTC) puede ser otro día */
  today?: Date
  locale?: 'es' | 'en'
  className?: string
}

export const GlassCalendar = React.forwardRef<HTMLDivElement, GlassCalendarProps>(
  ({ className, selectedDate, onDateSelect, selectableDates, today, locale = 'es', ...props }, ref) => {
    const dfLocale = locale === 'en' ? enUS : es
    // Empieza en el mes de la primera fecha elegible (o el actual)
    const [currentMonth, setCurrentMonth] = React.useState(() => selectableDates[0] ?? new Date())

    const { blanks, days } = React.useMemo(() => {
      const first = startOfMonth(currentMonth)
      const total = getDaysInMonth(currentMonth)
      const blanks = mondayFirstIndex(first)
      const days: Date[] = Array.from(
        { length: total },
        (_, i) => new Date(first.getFullYear(), first.getMonth(), i + 1),
      )
      return { blanks, days }
    }, [currentMonth])

    const isSelectable = (date: Date) => selectableDates.some((d) => isSameDay(d, date))

    return (
      <div ref={ref} className={cn('bk-cal', className)} {...props}>
        <div className="bk-cal__head">
          <p className="bk-cal__month" aria-live="polite">
            {format(currentMonth, 'MMMM yyyy', { locale: dfLocale })}
          </p>
          <div className="bk-cal__nav">
            <button type="button" aria-label={LABELS[locale].prev} onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
              <ChevronLeft size={16} />
            </button>
            <button type="button" aria-label={LABELS[locale].next} onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        <div className="bk-cal__grid" aria-hidden="true">
          {WEEKDAYS[locale].map((wd) => (
            <div key={wd} className="bk-cal__weekday">
              {wd}
            </div>
          ))}
        </div>

        <div className="bk-cal__grid">
          {Array.from({ length: blanks }).map((_, i) => (
            <div key={`blank-${i}`} />
          ))}
          {days.map((date) => {
            const selectable = isSelectable(date)
            const selected = selectedDate ? isSameDay(date, selectedDate) : false
            return (
              <button
                key={date.toISOString()}
                type="button"
                disabled={!selectable}
                aria-pressed={selected}
                aria-label={format(date, 'PPPP', { locale: dfLocale })}
                onClick={() => selectable && onDateSelect?.(date)}
                className={cn(
                  'bk-day',
                  selectable && 'is-available',
                  selected && 'is-selected',
                  (today ? isSameDay(date, today) : isToday(date)) && !selected && 'is-today',
                )}
              >
                {date.getDate()}
              </button>
            )
          })}
        </div>
      </div>
    )
  },
)

GlassCalendar.displayName = 'GlassCalendar'
