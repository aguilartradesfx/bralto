'use client'
import { useRef, useState, useEffect } from 'react'
import { useInView } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useTranslations } from 'next-intl'

interface TestimonialItem {
  quote: string
  name: string
  position: string
  company: string
  industry: string
}

interface TestimonialCardProps extends TestimonialItem {}

function TestimonialCard({ quote, name, position, company, industry }: TestimonialCardProps) {
  return (
    <div className="mb-4 rounded-xl border border-white/[0.07] bg-[#111111] p-6 hover:border-orange-200 transition-colors duration-300">
      <div className="mb-1 inline-block rounded-full bg-orange-100 px-2.5 py-0.5 text-[11px] font-medium text-orange-DEFAULT uppercase tracking-wider">
        {industry}
      </div>
      <p className="mt-3 text-[15px] leading-relaxed text-white/70">&ldquo;{quote}&rdquo;</p>
      <div className="mt-4 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-100 text-xs font-bold text-orange-DEFAULT">
          {name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
        </div>
        <div>
          <p className="text-sm font-semibold text-white">{name}</p>
          <p className="text-xs text-white/40">
            {position} · {company}
          </p>
        </div>
      </div>
    </div>
  )
}

interface ColumnProps {
  items: TestimonialItem[]
  speed?: string
  className?: string
  isPlaying?: boolean
}

function Column({ items, speed = 'animate-scroll-up', className, isPlaying = true }: ColumnProps) {
  return (
    <div className={cn('flex flex-col', className)}>
      <div
        className={cn('flex flex-col', speed)}
        style={{ animationPlayState: isPlaying ? 'running' : 'paused' }}
      >
        {[...items, ...items].map((t, i) => (
          <TestimonialCard key={i} {...t} />
        ))}
      </div>
    </div>
  )
}

export function TestimonialsColumns() {
  const t = useTranslations('TestimonialsData')
  const testimonials = t.raw('items') as TestimonialItem[]

  const col1 = testimonials.slice(0, 3)
  const col2 = testimonials.slice(3, 6)
  const col3 = testimonials.slice(6, 9)

  const containerRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(containerRef, { amount: 0.1 })
  const [isTabHidden, setIsTabHidden] = useState(false)

  useEffect(() => {
    const handler = () => setIsTabHidden(document.hidden)
    document.addEventListener('visibilitychange', handler)
    return () => document.removeEventListener('visibilitychange', handler)
  }, [])

  const isPlaying = isInView && !isTabHidden

  return (
    <div
      ref={containerRef}
      className="relative flex gap-4 overflow-hidden"
      style={{ height: '560px', maskImage: 'linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)' }}
    >
      <div className="flex-1 overflow-hidden">
        <Column items={col1} speed="animate-scroll-up" isPlaying={isPlaying} />
      </div>
      <div className="flex-1 overflow-hidden hidden md:block">
        <Column items={col2} speed="animate-scroll-up-fast" isPlaying={isPlaying} />
      </div>
      <div className="flex-1 overflow-hidden hidden lg:block">
        <Column items={col3} speed="animate-scroll-up-slow" isPlaying={isPlaying} />
      </div>
    </div>
  )
}
