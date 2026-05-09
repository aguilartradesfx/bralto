'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { useTranslations, useLocale } from 'next-intl'

const CPM = 22, CTR = 0.022, VISIT_RATE = 0.7, LEAD_RATE = 0.08, CLOSE_RATE = 0.33
const BUDGETS = [500, 1000, 2000, 5000]
const TICKETS = [200, 500, 1500, 3000]

function fmt(n: number) {
  if (n >= 10000) return Math.round(n / 1000) + 'k'
  if (n >= 1000)  return n.toLocaleString('en-US')
  return Math.round(n).toString()
}
function money(n: number) { return '$' + Math.round(n).toLocaleString('en-US') }

// SVG geometry — viewBox "0 0 400 430"
const SEGS = [
  { y0: 10,  y1: 155, lx0: 0,   rx0: 400, lx1: 52,  rx1: 348, fill: 'rgba(91,182,255,0.18)',  accent: '#5bb6ff' },
  { y0: 155, y1: 265, lx0: 52,  rx0: 348, lx1: 102, rx1: 298, fill: 'rgba(130,200,255,0.13)', accent: '#82c8ff' },
  { y0: 265, y1: 350, lx0: 102, rx0: 298, lx1: 140, rx1: 260, fill: 'rgba(251,191,36,0.14)',  accent: '#fbbf24' },
  { y0: 350, y1: 415, lx0: 140, rx0: 260, lx1: 165, rx1: 235, fill: 'rgba(255,168,69,0.22)',  accent: '#ffa845' },
]
const SVG_H = 430

const STAGE_STYLES = [
  { accent: '#5bb6ff', dim: 'rgba(91,182,255,0.08)',  border: 'rgba(91,182,255,0.18)'  },
  { accent: '#82c8ff', dim: 'rgba(130,200,255,0.07)', border: 'rgba(130,200,255,0.16)' },
  { accent: '#fbbf24', dim: 'rgba(251,191,36,0.08)',  border: 'rgba(251,191,36,0.18)'  },
  { accent: '#ffa845', dim: 'rgba(255,168,69,0.10)',  border: 'rgba(255,168,69,0.22)'  },
]

export function FunnelVizSection() {
  const t      = useTranslations('FunnelVizSection')
  const locale = useLocale()

  const stageLabels   = t.raw('stages')   as string[]
  const stageDetails  = t.raw('stageDetails') as string[]

  const [budget, setBudget] = useState(1000)
  const [ticket, setTicket] = useState(500)

  const reach    = Math.round((budget / CPM) * 1000)
  const visits   = Math.round(reach    * CTR * VISIT_RATE)
  const contacts = Math.round(visits   * LEAD_RATE)
  const clients  = Math.max(1, Math.round(contacts * CLOSE_RATE))
  const revenue  = clients * ticket
  const roi      = revenue / budget
  const net      = revenue - budget

  const values = [reach, visits, contacts, clients]

  return (
    <section id="embudo" className="relative py-28">

      <div className="relative z-10 mx-auto max-w-5xl px-6">

        {/* Header */}
        <div className="text-center mb-14">
          <motion.p
            initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/28 mb-4"
          >
            {t('label')}
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ delay: 0.08 }}
            className="text-4xl md:text-5xl font-semibold tracking-tight text-white leading-[1.1]"
          >
            {t('headline')}{' '}
            <em style={{ fontFamily: 'var(--font-instrument-serif)', fontStyle: 'italic', fontWeight: 400, color: 'rgba(255,168,69,0.7)' }}>
              {t('headlineItalic')}
            </em>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ delay: 0.16 }}
            className="mt-4 text-sm text-white/35 max-w-md mx-auto leading-relaxed"
          >
            {t('desc')}
          </motion.p>
        </div>

        {/* Controls */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="rounded-card border border-white/[0.06] bg-[#131316] p-5 mb-14"
        >
          <div className="flex flex-col sm:flex-row gap-6">
            <div className="flex-1">
              <p className="text-xs font-semibold text-white/45 mb-3">{t('budgetLabel')}</p>
              <div className="flex gap-2 flex-wrap">
                {BUDGETS.map(b => (
                  <button key={b} onClick={() => setBudget(b)}
                    className="px-3.5 py-1.5 rounded-lg text-sm font-bold transition-all duration-200"
                    style={b === budget
                      ? { background: 'rgba(91,182,255,0.1)', border: '1px solid rgba(91,182,255,0.28)', color: '#5bb6ff' }
                      : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.35)' }}
                  >{money(b)}</button>
                ))}
              </div>
            </div>
            <div className="hidden sm:block w-px bg-white/[0.06]" />
            <div className="sm:hidden h-px bg-white/[0.06]" />
            <div className="flex-1">
              <p className="text-xs font-semibold text-white/45 mb-3">{t('ticketLabel')}</p>
              <div className="flex gap-2 flex-wrap">
                {TICKETS.map(tk => (
                  <button key={tk} onClick={() => setTicket(tk)}
                    className="px-3.5 py-1.5 rounded-lg text-sm font-bold transition-all duration-200"
                    style={tk === ticket
                      ? { background: 'rgba(255,168,69,0.1)', border: '1px solid rgba(255,168,69,0.28)', color: '#ffa845' }
                      : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.35)' }}
                  >{money(tk)}</button>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── FUNNEL + STEPS ─────────────────────────────── */}
        <div className="flex flex-col lg:flex-row items-center lg:items-start gap-10 mb-12">

          {/* SVG funnel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="shrink-0 w-[200px] sm:w-[240px] lg:w-[220px]"
          >
            <svg viewBox={`0 0 400 ${SVG_H}`} className="w-full" style={{ overflow: 'visible' }}>
              <defs>
                <linearGradient id="topGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#5bb6ff" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="#5bb6ff" stopOpacity="0" />
                </linearGradient>
              </defs>
              <ellipse cx="200" cy="6" rx="200" ry="13"
                fill="rgba(91,182,255,0.1)" stroke="rgba(91,182,255,0.22)" strokeWidth="1.5" />
              {SEGS.map((s, i) => (
                <polygon key={i}
                  points={`${s.lx0},${s.y0} ${s.rx0},${s.y0} ${s.rx1},${s.y1} ${s.lx1},${s.y1}`}
                  fill={s.fill}
                />
              ))}
              <polygon
                points="0,10 400,10 52,155 0,155"
                fill="url(#topGlow)" opacity="0.4"
              />
              {SEGS.slice(0, -1).map((s, i) => (
                <line key={i}
                  x1={s.lx1} y1={s.y1} x2={s.rx1} y2={s.y1}
                  stroke="rgba(255,255,255,0.07)" strokeWidth="1" strokeDasharray="5,4"
                />
              ))}
              <line x1="0" y1="10" x2="165" y2="415" stroke="rgba(91,182,255,0.1)" strokeWidth="1" />
              <line x1="400" y1="10" x2="235" y2="415" stroke="rgba(255,168,69,0.1)" strokeWidth="1" />
              <ellipse cx="200" cy="415" rx="35" ry="9"
                fill="rgba(255,168,69,0.2)" stroke="rgba(255,168,69,0.28)" strokeWidth="1" />
            </svg>
          </motion.div>

          {/* Stage cards stacked — aligned to funnel bands */}
          <div className="flex-1 w-full flex flex-col" style={{ gap: 0 }}>
            {stageLabels.map((label, i) => {
              const stage = STAGE_STYLES[i]
              const bandH = SEGS[i].y1 - SEGS[i].y0
              const isLast = i === stageLabels.length - 1

              return (
                <div
                  key={label}
                  className="flex flex-col justify-center"
                  style={{ flex: bandH }}
                >
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08, duration: 0.4 }}
                    className="relative rounded-[14px] overflow-hidden flex items-center gap-5 px-5 py-4 mx-0"
                    style={{ background: stage.dim, border: `1px solid ${stage.border}` }}
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-full"
                      style={{ background: stage.accent }} />

                    <div className="shrink-0 flex flex-col items-center">
                      <span
                        className="text-[9px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-full"
                        style={{ color: stage.accent, background: stage.dim, border: `1px solid ${stage.border}` }}
                      >
                        {String(i + 1).padStart(2, '0')}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-white leading-tight" style={{ fontSize: 'clamp(0.85rem, 2vw, 1rem)' }}>
                        {label}
                      </p>
                      <p className="text-xs text-white/35 mt-0.5 leading-snug line-clamp-1">
                        {stageDetails[i]}
                      </p>
                    </div>

                    <AnimatePresence mode="wait">
                      <motion.div
                        key={`${i}-${values[i]}`}
                        initial={{ opacity: 0, scale: 0.82 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.18 }}
                        className="shrink-0 text-right"
                      >
                        <p
                          className="font-black tabular-nums leading-none"
                          style={{
                            color: stage.accent,
                            textShadow: `0 0 20px ${stage.accent}55`,
                            fontSize: 'clamp(1.6rem, 4vw, 2.2rem)',
                          }}
                        >
                          {fmt(values[i])}
                        </p>
                        <p className="text-[10px] text-white/25 mt-0.5 font-medium">{t('unitLabel')}</p>
                      </motion.div>
                    </AnimatePresence>
                  </motion.div>

                  {!isLast && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.08 + 0.12 }}
                      className="flex items-center gap-2 pl-[52px] py-1.5"
                    >
                      <div className="w-px h-full self-stretch min-h-[10px]"
                        style={{ background: `linear-gradient(to bottom, ${stage.accent}30, ${STAGE_STYLES[i+1].accent}30)` }} />
                      <AnimatePresence mode="wait">
                        <motion.span
                          key={`drop-${i}-${values[i]}`}
                          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                          className="text-[11px] font-semibold"
                          style={{ color: 'rgba(255,255,255,0.28)' }}
                        >
                          {t('dropText', { ratio: Math.round(values[i] / Math.max(values[i + 1], 1)) })}
                        </motion.span>
                      </AnimatePresence>
                    </motion.div>
                  )}
                </div>
              )
            })}

            <div style={{ flex: SVG_H - SEGS[SEGS.length - 1].y1 }} />
          </div>
        </div>

        {/* Results */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6"
        >
          <div className="rounded-card bg-[#131316] border border-white/[0.06] p-5 text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/28 mb-2.5">{t('revenueLabel')}</p>
            <AnimatePresence mode="wait">
              <motion.p key={`rev-${revenue}`} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="text-3xl font-black text-white">{money(revenue)}</motion.p>
            </AnimatePresence>
            <p className="text-xs text-white/28 mt-1.5">
              {clients} {clients === 1 ? t('clientSingular') : t('clientPlural')} × {money(ticket)}
            </p>
          </div>

          <div className="rounded-card relative overflow-hidden p-5 text-center"
            style={{ background: 'rgba(255,168,69,0.07)', border: '1px solid rgba(255,168,69,0.2)' }}>
            <div className="absolute inset-x-0 top-0 h-px"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(255,168,69,0.55), transparent)' }} />
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] mb-2.5" style={{ color: 'rgba(255,168,69,0.5)' }}>
              {t('roiLabel')}
            </p>
            <AnimatePresence mode="wait">
              <motion.p key={`roi-${roi}`} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="text-5xl font-black"
                style={{ color: '#ffa845', textShadow: '0 0 28px rgba(255,168,69,0.4)' }}>
                {money(Math.round(roi))}
              </motion.p>
            </AnimatePresence>
            <p className="text-xs mt-1.5" style={{ color: 'rgba(255,168,69,0.4)' }}>ROI {roi.toFixed(1)}×</p>
          </div>

          <div className="rounded-card bg-[#131316] border border-white/[0.06] p-5 text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/28 mb-2.5">{t('netLabel')}</p>
            <AnimatePresence mode="wait">
              <motion.p key={`net-${net}`} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="text-3xl font-black text-white">
                {net >= 0 ? '+' : ''}{money(net)}
              </motion.p>
            </AnimatePresence>
            <p className="text-xs text-white/28 mt-1.5">{t('afterAds')}</p>
          </div>
        </motion.div>

        {/* Disclaimer + CTA */}
        <div className="rounded-card border border-white/[0.06] bg-[#131316] p-6 flex flex-col sm:flex-row items-center gap-5">
          <div className="flex-1 text-center sm:text-left">
            <p className="text-sm font-semibold text-white mb-1">
              {t('disclaimer')}{' '}
              <span className="text-white/40 font-normal">{t('disclaimerNote')}</span>
            </p>
            <p className="text-xs text-white/35 leading-relaxed">
              {t('disclaimerBody')}
            </p>
          </div>
          <Link
            href={`/${locale}/agendar`}
            className="shrink-0 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-black bg-[#ffa845] hover:bg-[#f59e0b] transition-colors whitespace-nowrap"
          >
            {t('cta')}
            <ArrowRight size={13} />
          </Link>
        </div>

      </div>
    </section>
  )
}
