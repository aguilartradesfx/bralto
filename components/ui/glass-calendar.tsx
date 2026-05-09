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
import { es } from 'date-fns/locale'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

// Monday-first weekday headers (Latin America convention)
const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

// Sunday=0 → index 6, Monday=1 → index 0, …
function mondayFirstIndex(date: Date): number {
  const dow = getDay(date)
  return dow === 0 ? 6 : dow - 1
}

interface GlassCalendarProps extends React.HTMLAttributes<HTMLDivElement> {
  selectedDate?: Date | null
  onDateSelect?: (date: Date) => void
  /** Only these dates can be clicked; all others are visually disabled */
  selectableDates: Date[]
  className?: string
}

export const GlassCalendar = React.forwardRef<HTMLDivElement, GlassCalendarProps>(
  ({ className, selectedDate, onDateSelect, selectableDates, ...props }, ref) => {
    // Start on the month that contains the first selectable date (or today)
    const [currentMonth, setCurrentMonth] = React.useState(
      () => selectableDates[0] ?? new Date(),
    )

    // Recompute grid whenever month changes
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

    function isSelectable(date: Date) {
      return selectableDates.some((d) => isSameDay(d, date))
    }

    function handleClick(date: Date) {
      if (!isSelectable(date)) return
      onDateSelect?.(date)
    }

    return (
      <div
        ref={ref}
        className={cn(
          'w-full rounded-2xl p-6 overflow-hidden',
          'bg-black/25 backdrop-blur-xl border border-white/[0.08]',
          'text-white',
          className,
        )}
        {...props}
      >
        {/* Month navigation */}
        <div className="flex items-center justify-between mb-5">
          <AnimatePresence mode="wait">
            <motion.p
              key={format(currentMonth, 'yyyy-MM')}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ duration: 0.18 }}
              className="text-base font-semibold capitalize text-white"
            >
              {format(currentMonth, 'MMMM yyyy', { locale: es })}
            </motion.p>
          </AnimatePresence>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="p-1.5 rounded-full text-white/50 hover:text-white hover:bg-white/[0.07] transition-colors"
            >
              <ChevronLeft size={15} />
            </button>
            <button
              type="button"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="p-1.5 rounded-full text-white/50 hover:text-white hover:bg-white/[0.07] transition-colors"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 mb-1">
          {WEEKDAYS.map((wd) => (
            <div key={wd} className="text-center text-xs font-semibold text-white/30 py-2">
              {wd}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-y-1">
          {/* Leading blanks */}
          {Array.from({ length: blanks }).map((_, i) => (
            <div key={`blank-${i}`} />
          ))}

          {days.map((date) => {
            const selectable = isSelectable(date)
            const selected = selectedDate ? isSameDay(date, selectedDate) : false
            const today = isToday(date)

            return (
              <button
                key={date.toISOString()}
                type="button"
                disabled={!selectable}
                onClick={() => handleClick(date)}
                className={cn(
                  'relative mx-auto flex h-11 w-11 items-center justify-center rounded-full text-base font-semibold transition-all duration-150',
                  selected
                    ? 'bg-[#5bb6ff] text-white shadow-[0_0_14px_rgba(91,182,255,0.12)]'
                    : selectable
                    ? 'text-white hover:bg-[#5bb6ff]/20 hover:text-[#5bb6ff] cursor-pointer'
                    : 'text-white/15 cursor-default',
                )}
              >
                {today && !selected && (
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-[#5bb6ff]" />
                )}
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
