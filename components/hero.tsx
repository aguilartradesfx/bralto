'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GodRays } from '@paper-design/shaders-react'
import { Typewriter } from '@/components/ui/typewriter'
import { ArrowRight, Zap } from 'lucide-react'
import Link from 'next/link'

const ACTION_WORDS = ['ventas', 'seguimientos', 'reservas', 'respuestas', 'citas', 'procesos']

const SUBTITLE_TEXTS = [
  'para que su negocio nunca pare.',
  'sin perder una sola oportunidad.',
  'mientras usted duerme.',
  'las 24 horas del día.',
  'con cero intervención humana.',
  'sin depender de su equipo.',
]

function Word({
  text,
  delay,
  className = '',
}: {
  text: string
  delay: number
  className?: string
}) {
  return (
    <>
      <span className={`word ${className}`.trim()} data-delay={delay}>
        {text}
      </span>{' '}
    </>
  )
}

// ─── GHL Agency Dashboard — dark style mockup ─────────────────────────────────
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
  { icon: '$', label: 'Total Revenue Last Month', value: '$759' },
  { icon: '↺', label: 'Monthly Recurring Revenue', value: '$653' },
  { icon: '👤+', label: 'New Customers', value: '0' },
  { icon: '👥', label: 'Total Customers', value: '51' },
]

// Growth Rate polyline points — SVG viewBox "0 0 220 80"
// Three lines: Total Revenue (blue-white), MRR (purple), New Customers (dim blue)
const TOTAL_REV_PTS = '0,64 37,80 73,32 110,8 147,18 183,15 220,15'
const MRR_PTS       = '0,16 37,18 73,34 110,11 147,17 183,12 220,12'
const NEW_CUST_PTS  = '0,67 37,80 73,49 110,44 147,67 183,58 220,76'

const X_LABELS = ['Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May']

// Donut — circumference @ r=28: 175.9
const DONUT_C = 175.9
const SAAS_LEN      = DONUT_C * 0.821 // 144.4
const RESELL_LEN    = DONUT_C * 0.158 // 27.8
const REBILL_LEN    = DONUT_C * 0.021 // 3.7
// dashoffset = C/4 to start at 12 o'clock; each next arc starts after previous ends
const SAAS_OFFSET   =  DONUT_C / 4
const RESELL_OFFSET =  DONUT_C / 4 - SAAS_LEN
const REBILL_OFFSET =  DONUT_C / 4 - SAAS_LEN - RESELL_LEN

function AgencyMock() {
  return (
    <div
      className="w-full rounded-2xl border border-white/[0.08] bg-[#0a0a0a] overflow-hidden"
      style={{
        boxShadow:
          '0 0 40px rgba(255,255,255,0.04), 0 0 80px rgba(255,255,255,0.02), 0 40px 120px -20px rgba(0,0,0,0.95)',
      }}
    >
      {/* Browser bar */}
      <div className="h-9 bg-[#0d0d0d] border-b border-[#1a1a1a] flex items-center px-4 gap-3">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#222]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#222]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#222]" />
        </div>
        <div className="flex-1 max-w-xs mx-auto">
          <div className="bg-[#111] border border-[#1e1e1e] rounded-md h-5 flex items-center justify-center px-3">
            <span className="text-[9px] text-[#333]">app.bralto.io/agency-dashboard</span>
          </div>
        </div>
      </div>

      {/* App toolbar */}
      <div className="h-11 bg-[#0d0d0d] border-b border-[#1a1a1a] flex items-center px-4 gap-3">
        <span className="text-white/70 text-xs font-bold tracking-tight">bralto</span>
        <div className="w-px h-5 bg-[#1e1e1e]" />
        <span className="text-[11px] font-semibold text-white/80">Agency Dashboard</span>
        <div className="flex items-center gap-0">
          {['Summary', 'SaaS', 'Reselling'].map((tab, i) => (
            <div
              key={tab}
              className={`px-3 py-1 text-[10px] font-medium border-b-2 ${
                i === 0
                  ? 'text-white border-[#F97316]'
                  : 'text-[#444] border-transparent'
              }`}
            >
              {tab}
            </div>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.05] border border-white/[0.08]">
            <span className="text-[9px] text-white/50 font-medium">✦ Ask AI</span>
          </div>
          <div className="w-6 h-6 rounded-full bg-[#2a2a2a] border border-[#333] flex items-center justify-center">
            <span className="text-[8px] text-white/50">AJ</span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex" style={{ height: 360 }}>

        {/* Sidebar */}
        <div className="w-36 flex-shrink-0 border-r border-[#1a1a1a] bg-[#0d0d0d] flex flex-col overflow-hidden">
          {/* Switch pill */}
          <div className="mx-2 mt-2 mb-2 px-2 py-1.5 rounded-lg border border-[#1e1e1e] bg-[#111] flex items-center justify-between">
            <span className="text-[8px] text-[#444] truncate">Click here to switch</span>
            <span className="text-[8px] text-[#333] ml-1">▾</span>
          </div>
          {/* Nav items */}
          <div className="flex flex-col gap-0.5 px-1.5">
            {NAV_ITEMS.map(({ label, active }) => (
              <div
                key={label}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-md ${
                  active ? 'bg-white/[0.04]' : ''
                }`}
              >
                {active && (
                  <div className="w-1 h-1 rounded-full bg-[#F97316] flex-shrink-0" />
                )}
                <span
                  className={`text-[9px] truncate ${
                    active ? 'text-white/70 font-medium' : 'text-[#3a3a3a]'
                  } ${!active ? 'ml-3' : ''}`}
                >
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-hidden flex flex-col p-4 bg-[#080808]">

          {/* Section header */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-semibold text-white/40 tracking-wide">
              Revenue &amp; Customers Overview
            </span>
            <span className="text-[11px] text-[#333]">↻</span>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
            {STAT_CARDS.map(({ label, value }) => (
              <div
                key={label}
                className="rounded-xl border border-white/[0.06] bg-[#0d0d0d] px-3 py-2.5"
              >
                <p className="text-[8px] text-[#444] mb-1.5 leading-snug">{label}</p>
                <p className="text-[15px] font-bold text-white leading-none">{value}</p>
              </div>
            ))}
          </div>

          {/* Charts row */}
          <div className="flex gap-3 flex-1 overflow-hidden min-h-0">

            {/* Growth Rate chart */}
            <div className="flex-1 rounded-xl border border-white/[0.06] bg-[#0d0d0d] p-3 flex flex-col overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[9px] font-semibold text-white/40">Growth Rate</p>
                <div className="flex items-center gap-2.5">
                  {[
                    { color: '#a78bfa', label: 'New Customers' },
                    { color: '#60a5fa', label: 'MRR' },
                    { color: '#e2e8f0', label: 'Total Revenue' },
                  ].map(({ color, label }) => (
                    <div key={label} className="flex items-center gap-1">
                      <div className="w-2 h-px" style={{ background: color }} />
                      <span className="text-[7px] text-[#444]">{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* SVG chart */}
              <div className="flex-1 relative min-h-0">
                <svg
                  viewBox="0 0 220 80"
                  preserveAspectRatio="none"
                  className="w-full h-full"
                >
                  {/* Grid lines */}
                  {[0, 27, 53, 80].map((y) => (
                    <line
                      key={y}
                      x1="0" y1={y} x2="220" y2={y}
                      stroke="rgba(255,255,255,0.04)"
                      strokeWidth="0.5"
                    />
                  ))}

                  {/* New Customers line */}
                  <polyline
                    points={NEW_CUST_PTS}
                    fill="none"
                    stroke="rgba(167,139,250,0.5)"
                    strokeWidth="1"
                    strokeLinejoin="round"
                  />
                  {/* MRR line */}
                  <polyline
                    points={MRR_PTS}
                    fill="none"
                    stroke="rgba(96,165,250,0.7)"
                    strokeWidth="1.2"
                    strokeLinejoin="round"
                  />
                  {/* Total Revenue line */}
                  <polyline
                    points={TOTAL_REV_PTS}
                    fill="none"
                    stroke="rgba(226,232,240,0.8)"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                  />

                  {/* Dot on Total Revenue peak */}
                  <circle cx="110" cy="8" r="2" fill="rgba(226,232,240,0.9)" />
                </svg>
              </div>

              {/* X-axis labels */}
              <div className="flex justify-between mt-1 px-0">
                {X_LABELS.map((l) => (
                  <span key={l} className="text-[7px] text-[#333]">{l}</span>
                ))}
              </div>
            </div>

            {/* Revenue Distribution donut */}
            <div className="w-44 flex-shrink-0 rounded-xl border border-white/[0.06] bg-[#0d0d0d] p-3 flex flex-col hidden lg:flex">
              <p className="text-[9px] font-semibold text-white/40 mb-2">
                Revenue Distribution Last Month
              </p>
              <div className="flex items-center justify-center flex-1 gap-3">
                {/* Donut SVG */}
                <div className="flex-shrink-0">
                  <svg viewBox="0 0 80 80" width="80" height="80">
                    {/* Track */}
                    <circle
                      cx="40" cy="40" r="28"
                      fill="none"
                      stroke="rgba(255,255,255,0.04)"
                      strokeWidth="10"
                    />
                    {/* SaaS 82.1% */}
                    <circle
                      cx="40" cy="40" r="28"
                      fill="none"
                      stroke="rgba(139,92,246,0.85)"
                      strokeWidth="10"
                      strokeDasharray={`${SAAS_LEN} ${DONUT_C}`}
                      strokeDashoffset={SAAS_OFFSET}
                      strokeLinecap="round"
                    />
                    {/* Reselling 15.8% */}
                    <circle
                      cx="40" cy="40" r="28"
                      fill="none"
                      stroke="rgba(59,130,246,0.75)"
                      strokeWidth="10"
                      strokeDasharray={`${RESELL_LEN} ${DONUT_C}`}
                      strokeDashoffset={RESELL_OFFSET}
                      strokeLinecap="round"
                    />
                    {/* Rebilling 2.1% */}
                    <circle
                      cx="40" cy="40" r="28"
                      fill="none"
                      stroke="rgba(147,197,253,0.6)"
                      strokeWidth="10"
                      strokeDasharray={`${REBILL_LEN} ${DONUT_C}`}
                      strokeDashoffset={REBILL_OFFSET}
                      strokeLinecap="round"
                    />
                    {/* Center label */}
                    <text
                      x="40" y="37"
                      textAnchor="middle"
                      fontSize="8"
                      fontWeight="700"
                      fill="rgba(255,255,255,0.8)"
                    >
                      $759
                    </text>
                  </svg>
                </div>
                {/* Legend */}
                <div className="flex flex-col gap-1.5">
                  {[
                    { color: 'rgba(139,92,246,0.85)', label: 'SaaS', pct: '82.1%' },
                    { color: 'rgba(59,130,246,0.75)',  label: 'Reselling', pct: '15.8%' },
                    { color: 'rgba(147,197,253,0.6)',  label: 'Rebilling', pct: '2.1%' },
                  ].map(({ color, label, pct }) => (
                    <div key={label} className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                      <span className="text-[8px] text-[#555]">{label}</span>
                      <span className="text-[8px] text-[#444] ml-auto">{pct}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Status bar */}
      <div className="h-7 bg-[#0d0d0d] border-t border-[#1a1a1a] flex items-center px-4 gap-3">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
          <span className="text-[9px] text-[#444]">Sistema activo</span>
        </div>
        <span className="text-[9px] text-[#2a2a2a]">·</span>
        <span className="text-[9px] text-[#444]">51 clientes</span>
        <span className="text-[9px] text-[#2a2a2a]">·</span>
        <span className="text-[9px] text-[#444]">MRR $653</span>
      </div>
    </div>
  )
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
export function Hero() {
  const sectionRef = useRef<HTMLElement>(null)
  const [actionIndex, setActionIndex] = useState(0)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    setIsMobile(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  useEffect(() => {
    const words = sectionRef.current?.querySelectorAll<HTMLElement>('.word')
    words?.forEach((word) => {
      const delay = parseInt(word.getAttribute('data-delay') || '0', 10)
      setTimeout(() => {
        word.style.animation = 'word-appear 0.8s ease-out forwards'
      }, delay)
    })
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      const interval = setInterval(() => {
        setActionIndex((prev) => (prev + 1) % ACTION_WORDS.length)
      }, 3000)
      return () => clearInterval(interval)
    }, 1100)
    return () => clearTimeout(timer)
  }, [])

  return (
    <section
      ref={sectionRef}
      id="inicio"
      className="relative overflow-hidden bg-[#080808]"
      style={{ paddingTop: 112, paddingBottom: 0 }}
    >
      {/* GodRays background */}
      <GodRays
        colorBack="#00000000"
        colors={['#a1a1aa40', '#e4e4e740', '#71717a40', '#52525b40']}
        colorBloom="#a1a1aa"
        offsetX={0.85}
        offsetY={-1}
        intensity={0.45}
        spotty={0.45}
        midSize={10}
        midIntensity={0}
        density={0.28}
        bloom={0.3}
        speed={isMobile ? 0 : 0.25}
        scale={1.6}
        minPixelRatio={1}
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
      />

      {/* Ambient glows — matching reference HTML */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 80% 55% at 50% -10%, rgba(255,255,255,0.09) 0%, rgba(255,255,255,0.03) 40%, transparent 70%)',
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 50% 40% at 30% 50%, rgba(255,255,255,0.03) 0%, transparent 60%)',
        }}
      />

      {/* ── Text block — max-w-5xl left-aligned, matching reference HTML ── */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 mb-16">

        {/* Badge — orange tint, Zap icon, word-appear animation */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#F97316]/30 bg-[#F97316]/[0.08] text-[12px] font-medium text-[#fb923c] mb-7">
          <Zap className="w-3 h-3 flex-shrink-0" />
          <Word text="Infraestructura" delay={0} />
          <Word text="de" delay={150} />
          <Word text="Operaciones" delay={300} />
          <Word text="Digitales" delay={450} />
        </div>

        {/* Headline — font-size matches reference HTML clamp(36px,6vw,60px) via .hero-headline */}
        <h1
          className="font-bold leading-none tracking-[-0.025em] mb-6"
          style={{
            fontFamily:
              "'Hubot Sans', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
            lineHeight: 1.08,
          }}
        >
          {/* Line 1 — static */}
          <div className="hero-headline text-white">
            <Word text="Automatizamos" delay={800} />
            <Word text="sus" delay={950} />
          </div>

          {/* Line 2 — animated action word */}
          <div
            className="hero-headline relative overflow-hidden text-[#F97316] mb-3"
            style={{ height: '1.3em' }}
          >
            <AnimatePresence mode="wait">
              <motion.span
                key={actionIndex}
                initial={{ opacity: 0, y: '100%' }}
                animate={{ opacity: 1, y: '0%' }}
                exit={{ opacity: 0, y: '-100%' }}
                transition={{ type: 'spring', stiffness: 50, damping: 15 }}
                style={{ display: 'block' }}
              >
                {ACTION_WORDS[actionIndex]}
              </motion.span>
            </AnimatePresence>
          </div>

          {/* Line 3 — Typewriter benefit clause, full-width so text never wraps mid-phrase */}
          <div
            className="text-white/40 font-normal w-full"
            style={{ fontSize: 'clamp(1.0625rem, 2vw, 1.25rem)', lineHeight: 1.625 }}
          >
            <Typewriter
              text={SUBTITLE_TEXTS}
              speed={45}
              deleteSpeed={22}
              waitTime={4000}
              initialDelay={1500}
              cursorChar="_"
              cursorClassName="ml-0.5 text-[#F97316]"
            />
          </div>
        </h1>

        {/* CTAs */}
        <div className="flex flex-wrap gap-3 mt-10">
          <Link
            href="/agendar"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-white text-black text-base font-semibold transition-colors duration-200 hover:bg-white/90"
          >
            Agendar una llamada
            <ArrowRight size={16} />
          </Link>
          <Link
            href="#como-funciona"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl border border-white/[0.10] text-white/50 text-base font-semibold transition-all duration-200 hover:border-white/25 hover:text-white"
          >
            Ver cómo funciona
          </Link>
        </div>
      </div>

      {/* ── Agency Dashboard mockup — gradient fade at bottom ── */}
      <div
        className="relative max-w-5xl mx-auto px-6"
        style={{
          WebkitMaskImage: 'linear-gradient(to bottom, black 45%, transparent 100%)',
          maskImage: 'linear-gradient(to bottom, black 45%, transparent 100%)',
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 70% 50% at 50% 30%, rgba(255,255,255,0.05) 0%, transparent 70%)',
          }}
        />
        <AgencyMock />
      </div>
    </section>
  )
}
