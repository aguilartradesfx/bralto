'use client'

import { motion, AnimatePresence } from 'framer-motion'
import {
  Plane, Printer, UtensilsCrossed, Stethoscope, PawPrint, Car,
  ArrowRight, ChevronLeft, ChevronRight, Check,
} from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'

interface CaseData {
  industry: string
  label: string
  problem: string
  deliverables: string[]
  result: string
  automation: string[]
  stats: { value: string; label: string }[]
}

const CASE_ICONS = [Plane, Printer, UtensilsCrossed, Stethoscope, PawPrint, Car]

const CASE_STYLES = [
  { accentColor: 'rgba(91,182,255,1)',   accentDim: 'rgba(91,182,255,0.07)',   accentBorder: 'rgba(91,182,255,0.18)',   accentText: '#5bb6ff' },
  { accentColor: 'rgba(99,179,237,1)',   accentDim: 'rgba(99,179,237,0.07)',   accentBorder: 'rgba(99,179,237,0.18)',   accentText: '#63b3ed' },
  { accentColor: 'rgba(52,211,153,1)',   accentDim: 'rgba(52,211,153,0.07)',   accentBorder: 'rgba(52,211,153,0.18)',   accentText: '#34d399' },
  { accentColor: 'rgba(167,139,250,1)',  accentDim: 'rgba(167,139,250,0.07)',  accentBorder: 'rgba(167,139,250,0.18)',  accentText: '#a78bfa' },
  { accentColor: 'rgba(244,114,182,1)',  accentDim: 'rgba(244,114,182,0.07)',  accentBorder: 'rgba(244,114,182,0.18)',  accentText: '#f472b6' },
  { accentColor: 'rgba(255,168,69,1)',   accentDim: 'rgba(255,168,69,0.07)',   accentBorder: 'rgba(255,168,69,0.18)',   accentText: '#ffa845' },
]

const variants = {
  enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 40 : -40 }),
  center: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: dir > 0 ? -40 : 40 }),
}

export function RobotSection() {
  const t      = useTranslations('RobotSection')
  const locale = useLocale()
  const cases  = t.raw('cases') as CaseData[]

  const [activeIdx, setActiveIdx] = useState(0)
  const [direction, setDirection] = useState(1)

  function go(idx: number) {
    setDirection(idx >= activeIdx ? 1 : -1)
    setActiveIdx(idx)
  }
  function prev() { go(activeIdx === 0 ? cases.length - 1 : activeIdx - 1) }
  function next() { go(activeIdx === cases.length - 1 ? 0 : activeIdx + 1) }

  const c      = cases[activeIdx]
  const Icon   = CASE_ICONS[activeIdx]
  const style  = CASE_STYLES[activeIdx]

  return (
    <section id="casos-reales" className="relative py-28">
      <div className="relative z-10 mx-auto max-w-7xl px-6">

        {/* Header */}
        <div className="mb-16 text-center">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/28 mb-4"
          >
            {t('label')}
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.08 }}
            className="text-4xl md:text-5xl font-semibold tracking-tight text-white leading-[1.08]"
          >
            {t('headline')}{' '}
            <em style={{ fontFamily: 'var(--font-instrument-serif)', fontStyle: 'italic', fontWeight: 400, color: 'rgba(91,182,255,0.6)' }}>
              {t('headlineItalic')}
            </em>
          </motion.h2>
        </div>

        {/* Carousel */}
        <div className="relative flex items-center gap-4">
          {/* Prev arrow */}
          <button
            onClick={prev}
            className="shrink-0 flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.04] text-white/40 hover:text-white hover:border-white/20 hover:bg-white/[0.07] transition-all"
          >
            <ChevronLeft size={18} />
          </button>

          {/* Card */}
          <div
            className="relative flex-1 rounded-card overflow-hidden"
            style={{ border: `1px solid ${style.accentBorder}`, background: '#0e0e12' }}
          >
            {/* Top glow edge */}
            <div
              className="absolute inset-x-0 top-0 h-px"
              style={{ background: `linear-gradient(90deg, transparent, ${style.accentColor}, transparent)` }}
            />
            {/* Ambient glow */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: `radial-gradient(ellipse 60% 40% at 50% 0%, ${style.accentDim}, transparent)` }}
            />

            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={c.industry}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                className="relative z-10 grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-0"
              >
                {/* Left column */}
                <div className="p-8 md:p-12 flex flex-col gap-8">
                  {/* Number + label */}
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-white/20 tracking-widest">
                      {String(activeIdx + 1).padStart(2, '0')} / {String(cases.length).padStart(2, '0')}
                    </span>
                    <span
                      className="text-[9px] font-bold uppercase tracking-[0.18em] px-2.5 py-1 rounded-full"
                      style={{ color: style.accentText, background: style.accentDim, border: `1px solid ${style.accentBorder}` }}
                    >
                      {c.label}
                    </span>
                  </div>

                  {/* Industry name */}
                  <h3 className="text-3xl md:text-4xl font-bold text-white leading-tight">
                    {c.industry}
                  </h3>

                  {/* Problem */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-4 h-px" style={{ background: style.accentText }} />
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: style.accentText }}>
                        {t('problemLabel')}
                      </p>
                    </div>
                    <p className="text-sm text-white/50 leading-relaxed">{c.problem}</p>
                  </div>

                  {/* Deliverables */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-4 h-px" style={{ background: style.accentText }} />
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: style.accentText }}>
                        {t('builtLabel')}
                      </p>
                    </div>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {c.deliverables.map((d) => (
                        <li key={d} className="flex items-start gap-2.5 text-sm text-white/55">
                          <span
                            className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full"
                            style={{ background: style.accentDim, border: `1px solid ${style.accentBorder}` }}
                          >
                            <Check size={9} style={{ color: style.accentColor }} strokeWidth={3} />
                          </span>
                          {d}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Result */}
                  <div
                    className="rounded-xl px-5 py-4 flex items-start gap-3"
                    style={{ background: style.accentDim, border: `1px solid ${style.accentBorder}` }}
                  >
                    <Check size={14} className="shrink-0 mt-0.5" style={{ color: style.accentText }} strokeWidth={2.5} />
                    <p className="text-sm font-medium text-white/80">{c.result}</p>
                  </div>
                </div>

                {/* Right column */}
                <div
                  className="flex flex-col gap-8 p-8 md:p-10 lg:border-l"
                  style={{ borderColor: style.accentBorder }}
                >
                  {/* Icon */}
                  <div
                    className="flex h-20 w-20 items-center justify-center rounded-2xl self-end"
                    style={{ background: style.accentDim, border: `1px solid ${style.accentBorder}` }}
                  >
                    <Icon size={32} style={{ color: style.accentColor }} />
                  </div>

                  {/* Stats */}
                  <div className="flex flex-col gap-4">
                    {c.stats.map((s) => (
                      <div key={s.label}>
                        <p
                          className="text-4xl font-black text-white leading-none mb-1"
                          style={{ textShadow: `0 0 30px ${style.accentColor}50` }}
                        >
                          {s.value}
                        </p>
                        <p className="text-xs text-white/30 uppercase tracking-wider">{s.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Automation features */}
                  <div
                    className="mt-auto flex flex-col gap-2.5 pt-6"
                    style={{ borderTop: `1px solid ${style.accentBorder}` }}
                  >
                    {c.automation.map((a) => (
                      <div key={a} className="flex items-center gap-2.5 text-xs text-white/45">
                        <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: style.accentText }} />
                        {a}
                      </div>
                    ))}
                  </div>

                  {/* CTA */}
                  <Link
                    href={`/${locale}/agendar`}
                    className="mt-auto inline-flex items-center gap-2 self-start rounded-full px-5 py-2.5 text-xs font-semibold uppercase tracking-wide text-black bg-[#ffa845] hover:bg-[#f59e0b] transition-colors"
                  >
                    {t('bookCall')}
                    <ArrowRight size={12} />
                  </Link>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Next arrow */}
          <button
            onClick={next}
            className="shrink-0 flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.04] text-white/40 hover:text-white hover:border-white/20 hover:bg-white/[0.07] transition-all"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Bottom tab navigation */}
        <div className="mt-6 flex items-center justify-center gap-1 flex-wrap px-14">
          {cases.map((item, i) => {
            const s = CASE_STYLES[i]
            return (
              <button
                key={item.industry}
                onClick={() => go(i)}
                className="relative px-3 py-2 text-xs font-medium transition-colors rounded-md"
                style={{ color: i === activeIdx ? s.accentText : 'rgba(255,255,255,0.3)' }}
              >
                {i === activeIdx && (
                  <motion.div
                    layoutId="tab-indicator"
                    className="absolute inset-0 rounded-md"
                    style={{ background: s.accentDim, border: `1px solid ${s.accentBorder}` }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{item.industry}</span>
              </button>
            )
          })}
        </div>

      </div>
    </section>
  )
}
