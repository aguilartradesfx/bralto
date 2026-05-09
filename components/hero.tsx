'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Typewriter } from '@/components/ui/typewriter'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { useTranslations, useLocale } from 'next-intl'

// ─── Agency Dashboard nav & data ─────────────────────────────────────────────
const NAV_ITEMS = [
  { label: 'Agency Dashboard', active: true },
  { label: 'SaaS Configurator', active: false },
  { label: 'AI Usage', active: false },
  { label: 'Prospecting', active: false },
  { label: 'Sub-Accounts', active: false },
  { label: 'Account Snapshots', active: false },
  { label: 'Reselling', active: false },
  { label: 'Add-Ons', active: false },
]

const STAT_CARDS = [
  { label: 'Total Revenue Last Month', value: '$759' },
  { label: 'Monthly Recurring Revenue', value: '$653' },
  { label: 'New Customers', value: '0' },
  { label: 'Total Customers', value: '51' },
]

const TOTAL_REV_PTS = '0,64 37,80 73,32 110,8 147,18 183,15 220,15'
const MRR_PTS       = '0,16 37,18 73,34 110,11 147,17 183,12 220,12'
const NEW_CUST_PTS  = '0,67 37,80 73,49 110,44 147,67 183,58 220,76'
const X_LABELS      = ['Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May']

const DONUT_C       = 175.9
const SAAS_LEN      = DONUT_C * 0.821
const RESELL_LEN    = DONUT_C * 0.158
const REBILL_LEN    = DONUT_C * 0.021
const SAAS_OFFSET   = DONUT_C / 4
const RESELL_OFFSET = DONUT_C / 4 - SAAS_LEN
const REBILL_OFFSET = DONUT_C / 4 - SAAS_LEN - RESELL_LEN

// ─── Agency Dashboard Mockup — Dark Bento style ───────────────────────────────
function AgencyMock() {
  return (
    <div
      className="w-full rounded-[20px] border border-white/[0.07] overflow-hidden"
      style={{
        background: '#0c0c10',
        boxShadow:
          '0 0 0 1px rgba(91,182,255,0.04), 0 0 60px rgba(91,182,255,0.05), 0 40px 120px -20px rgba(0,0,0,0.9)',
      }}
    >
      {/* Browser chrome */}
      <div className="h-9 bg-[#0e0e12] border-b border-white/[0.05] flex items-center px-4 gap-3">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#1e1e22]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#1e1e22]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#1e1e22]" />
        </div>
        <div className="flex-1 max-w-xs mx-auto">
          <div className="bg-[#131316] border border-white/[0.05] rounded-md h-5 flex items-center justify-center px-3">
            <span className="text-[9px] text-white/20">app.bralto.io/agency-dashboard</span>
          </div>
        </div>
      </div>

      {/* App toolbar */}
      <div className="h-11 bg-[#0e0e12] border-b border-white/[0.05] flex items-center px-4 gap-3">
        <span className="text-white/60 text-xs font-semibold tracking-tight">bralto</span>
        <div className="w-px h-5 bg-white/[0.06]" />
        <span className="text-[11px] font-medium text-white/70">Agency Dashboard</span>
        <div className="flex items-center">
          {['Summary', 'SaaS', 'Reselling'].map((tab, i) => (
            <div
              key={tab}
              className={`px-3 py-1 text-[10px] font-medium border-b-2 ${
                i === 0 ? 'text-white border-[#5bb6ff]' : 'text-white/25 border-transparent'
              }`}
            >
              {tab}
            </div>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.06]">
            <span className="text-[9px] text-white/40 font-medium">✦ Ask AI</span>
          </div>
          <div className="w-6 h-6 rounded-full bg-[#1d1d22] border border-white/[0.08] flex items-center justify-center">
            <span className="text-[8px] text-white/40">AJ</span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex" style={{ height: 360 }}>

        {/* Sidebar */}
        <div className="w-36 flex-shrink-0 border-r border-white/[0.05] bg-[#0e0e12] flex flex-col overflow-hidden">
          <div className="mx-2 mt-2 mb-2 px-2 py-1.5 rounded-lg border border-white/[0.05] bg-[#131316] flex items-center justify-between">
            <span className="text-[8px] text-white/25 truncate">Click here to switch</span>
            <span className="text-[8px] text-white/20 ml-1">▾</span>
          </div>
          <div className="flex flex-col gap-0.5 px-1.5">
            {NAV_ITEMS.map(({ label, active }) => (
              <div
                key={label}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-md ${active ? 'bg-white/[0.04]' : ''}`}
              >
                {active && (
                  <div className="w-1 h-1 rounded-full bg-[#5bb6ff] flex-shrink-0" style={{ boxShadow: '0 0 4px #5bb6ff' }} />
                )}
                <span className={`text-[9px] truncate ${active ? 'text-white/60 font-medium' : 'text-white/18'} ${!active ? 'ml-3' : ''}`}>
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-hidden flex flex-col p-4 bg-[#0a0a0e]">

          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-medium text-white/30 tracking-wide">Revenue &amp; Customers Overview</span>
            <span className="text-[11px] text-white/20">↻</span>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
            {STAT_CARDS.map(({ label, value }) => (
              <div key={label} className="rounded-xl border border-white/[0.05] bg-[#0e0e12] px-3 py-2.5">
                <p className="text-[8px] text-white/25 mb-1.5 leading-snug">{label}</p>
                <p className="text-[15px] font-bold text-white leading-none">{value}</p>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div className="flex gap-3 flex-1 overflow-hidden min-h-0">

            {/* Growth rate */}
            <div className="flex-1 rounded-xl border border-white/[0.05] bg-[#0e0e12] p-3 flex flex-col overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[9px] font-medium text-white/30">Growth Rate</p>
                <div className="flex items-center gap-2.5">
                  {[
                    { color: '#a78bfa', label: 'New Customers' },
                    { color: '#5bb6ff', label: 'MRR' },
                    { color: 'rgba(255,255,255,0.6)', label: 'Total Revenue' },
                  ].map(({ color, label }) => (
                    <div key={label} className="flex items-center gap-1">
                      <div className="w-2 h-px" style={{ background: color }} />
                      <span className="text-[7px] text-white/25">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex-1 relative min-h-0">
                <svg viewBox="0 0 220 80" preserveAspectRatio="none" className="w-full h-full">
                  {[0, 27, 53, 80].map((y) => (
                    <line key={y} x1="0" y1={y} x2="220" y2={y} stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
                  ))}
                  <polyline points={NEW_CUST_PTS} fill="none" stroke="rgba(167,139,250,0.45)" strokeWidth="1" strokeLinejoin="round" />
                  <polyline points={MRR_PTS}       fill="none" stroke="rgba(91,182,255,0.65)"  strokeWidth="1.2" strokeLinejoin="round" />
                  <polyline points={TOTAL_REV_PTS} fill="none" stroke="rgba(255,255,255,0.6)"  strokeWidth="1.5" strokeLinejoin="round" />
                  <circle cx="110" cy="8" r="2" fill="rgba(255,255,255,0.7)" />
                </svg>
              </div>
              <div className="flex justify-between mt-1">
                {X_LABELS.map((l) => (
                  <span key={l} className="text-[7px] text-white/20">{l}</span>
                ))}
              </div>
            </div>

            {/* Revenue distribution donut */}
            <div className="w-44 flex-shrink-0 rounded-xl border border-white/[0.05] bg-[#0e0e12] p-3 flex flex-col hidden lg:flex">
              <p className="text-[9px] font-medium text-white/30 mb-2">Revenue Distribution Last Month</p>
              <div className="flex items-center justify-center flex-1 gap-3">
                <div className="flex-shrink-0">
                  <svg viewBox="0 0 80 80" width="80" height="80">
                    <circle cx="40" cy="40" r="28" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="10" />
                    <circle cx="40" cy="40" r="28" fill="none" stroke="rgba(91,182,255,0.7)"   strokeWidth="10" strokeDasharray={`${SAAS_LEN} ${DONUT_C}`}   strokeDashoffset={SAAS_OFFSET}   strokeLinecap="round" />
                    <circle cx="40" cy="40" r="28" fill="none" stroke="rgba(255,168,69,0.65)"  strokeWidth="10" strokeDasharray={`${RESELL_LEN} ${DONUT_C}`}  strokeDashoffset={RESELL_OFFSET} strokeLinecap="round" />
                    <circle cx="40" cy="40" r="28" fill="none" stroke="rgba(52,211,153,0.55)"  strokeWidth="10" strokeDasharray={`${REBILL_LEN} ${DONUT_C}`}  strokeDashoffset={REBILL_OFFSET} strokeLinecap="round" />
                    <text x="40" y="37" textAnchor="middle" fontSize="8" fontWeight="700" fill="rgba(255,255,255,0.7)">$759</text>
                  </svg>
                </div>
                <div className="flex flex-col gap-1.5">
                  {[
                    { color: 'rgba(91,182,255,0.7)',  label: 'SaaS',      pct: '82.1%' },
                    { color: 'rgba(255,168,69,0.65)', label: 'Reselling', pct: '15.8%' },
                    { color: 'rgba(52,211,153,0.55)', label: 'Rebilling', pct: '2.1%' },
                  ].map(({ color, label, pct }) => (
                    <div key={label} className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                      <span className="text-[8px] text-white/35">{label}</span>
                      <span className="text-[8px] text-white/25 ml-auto">{pct}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Status bar */}
      <div className="h-7 bg-[#0e0e12] border-t border-white/[0.05] flex items-center px-4 gap-3">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" style={{ boxShadow: '0 0 4px rgba(52,211,153,0.8)' }} />
          <span className="text-[9px] text-white/30">Sistema activo</span>
        </div>
        <span className="text-[9px] text-white/15">·</span>
        <span className="text-[9px] text-white/30">51 clientes</span>
        <span className="text-[9px] text-white/15">·</span>
        <span className="text-[9px] text-white/30">MRR $653</span>
      </div>
    </div>
  )
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
export function Hero() {
  const t = useTranslations('Hero')
  const locale = useLocale()
  const sectionRef  = useRef<HTMLElement>(null)
  const [actionIndex, setActionIndex] = useState(0)
  const [isMobile, setIsMobile]       = useState(false)

  const actionWords = t.raw('actionWords') as string[]
  const subtitles   = t.raw('subtitles') as string[]

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    setIsMobile(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      const interval = setInterval(() => {
        setActionIndex((prev) => (prev + 1) % actionWords.length)
      }, 3000)
      return () => clearInterval(interval)
    }, 1100)
    return () => clearTimeout(timer)
  }, [actionWords.length])

  const agendarHref = `/${locale}/agendar`
  const comoFuncionaHref = '#como-funciona'

  return (
    <section
      ref={sectionRef}
      id="inicio"
      className="relative overflow-hidden bg-[#060607]"
      style={{ paddingTop: 96, paddingBottom: 0 }}
    >
      {/* Grid background */}
      <div className="grid-bg absolute inset-0" aria-hidden="true" />

      {/* Ambient glow — cyan top-left */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '-20%', left: '-10%',
          width: '55vw', height: '55vh',
          background: 'radial-gradient(ellipse, rgba(91,182,255,0.055) 0%, transparent 65%)',
        }}
        aria-hidden="true"
      />
      {/* Ambient glow — amber bottom-right */}
      <div
        className="absolute pointer-events-none"
        style={{
          bottom: '5%', right: '-5%',
          width: '40vw', height: '45vh',
          background: 'radial-gradient(ellipse, rgba(255,168,69,0.04) 0%, transparent 65%)',
        }}
        aria-hidden="true"
      />

      {/* ── Text block ── */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 mb-14">

        {/* Eyebrow pill */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/[0.07] bg-white/[0.03] text-[11px] font-medium text-white/45 uppercase tracking-[0.16em] mb-7"
        >
          <span
            className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0"
            style={{ animation: 'pulse-dot 2s ease-in-out infinite' }}
          />
          {t('eyebrow')}
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          className="font-sans font-semibold leading-none tracking-[-0.03em] mb-5"
          style={{ fontSize: 'clamp(48px, 6vw, 76px)', lineHeight: 1.04 }}
        >
          <span className="text-white">{t('headline')}</span>
          <br />
          {/* Animated word — Instrument Serif italic */}
          <span
            className="relative overflow-hidden inline-block"
            style={{ height: '1.08em', verticalAlign: 'bottom' }}
          >
            <AnimatePresence mode="wait">
              <motion.em
                key={actionIndex}
                initial={{ opacity: 0, y: '100%' }}
                animate={{ opacity: 1, y: '0%' }}
                exit={{ opacity: 0, y: '-100%' }}
                transition={{ type: 'spring', stiffness: 55, damping: 16 }}
                style={{
                  display: 'block',
                  fontFamily: 'var(--font-instrument-serif)',
                  fontStyle: 'italic',
                  fontWeight: 400,
                  color: 'rgba(255,255,255,0.72)',
                  lineHeight: 1.04,
                }}
              >
                {actionWords[actionIndex]}
              </motion.em>
            </AnimatePresence>
          </span>
        </motion.h1>

        {/* Typewriter subtitle */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-white/38 mb-9"
          style={{ fontSize: 'clamp(1.0625rem, 2vw, 1.25rem)', lineHeight: 1.625 }}
        >
          <Typewriter
            text={subtitles}
            speed={45}
            deleteSpeed={22}
            waitTime={4000}
            initialDelay={1500}
            cursorChar="_"
            cursorClassName="ml-0.5 text-[#5bb6ff]"
          />
        </motion.div>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.42 }}
          className="flex flex-wrap gap-3"
        >
          <Link
            href={agendarHref}
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-white text-black text-sm font-semibold uppercase tracking-wide transition-all duration-200 hover:bg-white/90"
          >
            {t('cta1')}
            <ArrowRight size={14} />
          </Link>
          <Link
            href={comoFuncionaHref}
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full border border-white/[0.09] text-white/45 text-sm font-semibold uppercase tracking-wide transition-all duration-200 hover:border-white/20 hover:text-white/80"
          >
            {t('cta2')}
          </Link>
        </motion.div>
      </div>

      {/* ── Agency Dashboard mockup — fades out at bottom ── */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="relative max-w-5xl mx-auto px-6"
        style={{
          WebkitMaskImage: 'linear-gradient(to bottom, black 45%, transparent 100%)',
          maskImage: 'linear-gradient(to bottom, black 45%, transparent 100%)',
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 70% 50% at 50% 30%, rgba(91,182,255,0.04) 0%, transparent 70%)',
          }}
        />
        <AgencyMock />
      </motion.div>
    </section>
  )
}
