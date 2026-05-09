'use client'

import { motion } from 'framer-motion'
import { Search, Pencil, Hammer, Rocket } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'

const STEP_ICONS: LucideIcon[] = [Search, Pencil, Hammer, Rocket]
const STEP_HIGHLIGHT = [false, false, false, true]

export function HowItWorks() {
  const t = useTranslations('HowItWorks')

  const steps = (t.raw('steps') as { title: string; body: string }[]).map(
    (s, i) => ({
      ...s,
      number: String(i + 1).padStart(2, '0'),
      icon: STEP_ICONS[i],
      highlight: STEP_HIGHLIGHT[i],
    })
  )

  const stats = t.raw('stats') as { value: string; label: string }[]
  const statColors = ['#5bb6ff', '#5bb6ff', '#ffa845']

  return (
    <section id="como-funciona" className="relative py-28 overflow-hidden">

      <div className="relative z-10 mx-auto max-w-6xl px-6">

        {/* Header */}
        <div className="text-center mb-20">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/28 mb-5"
          >
            {t('label')}
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.06 }}
            className="text-sm text-white/30 mb-4 tracking-wide"
          >
            {t('problem')}
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-semibold tracking-tight leading-[1.08] text-white mb-5"
          >
            {t('headline')}{' '}
            <em style={{ fontFamily: 'var(--font-instrument-serif)', fontStyle: 'italic', fontWeight: 400, color: 'rgba(255,168,69,0.8)' }}>
              {t('headlineItalic')}
            </em>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.16 }}
            className="text-base text-white/35 max-w-sm mx-auto leading-relaxed"
          >
            {t('sub')}
          </motion.p>
        </div>

        {/* Steps grid */}
        <div className="relative">
          {/* Connecting line — desktop */}
          <div className="hidden lg:block absolute top-[2.875rem] left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-transparent via-white/[0.07] to-transparent" />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {steps.map((step, i) => {
              const Icon = step.icon
              return (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, y: 28 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.5, ease: 'easeOut' }}
                  className="relative"
                >
                  {/* Timeline dot — desktop */}
                  <div
                    className={`hidden lg:flex absolute top-[2.25rem] left-1/2 -translate-x-1/2 w-5 h-5 rounded-full items-center justify-center z-10 ring-[5px] ${
                      step.highlight
                        ? 'bg-[#ffa845] ring-[#ffa845]/15'
                        : 'bg-[#1d1d22] ring-[#060607] border border-white/[0.08]'
                    }`}
                  >
                    {step.highlight && <div className="w-1.5 h-1.5 rounded-full bg-white/90" />}
                  </div>

                  {/* Card */}
                  <div
                    className={`relative h-full lg:mt-11 p-6 rounded-card border overflow-hidden transition-all duration-300 group ${
                      step.highlight
                        ? 'bg-[#1a140a] border-[#ffa845]/20'
                        : 'bg-[#131316] border-white/[0.06] hover:border-white/[0.12]'
                    }`}
                  >
                    {/* Top edge highlight */}
                    <div className={`absolute inset-x-0 top-0 h-px ${
                      step.highlight
                        ? 'bg-gradient-to-r from-transparent via-[#ffa845]/45 to-transparent'
                        : 'bg-gradient-to-r from-transparent via-white/[0.08] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300'
                    }`} />

                    {/* Ghost number */}
                    <span
                      className="absolute -top-3 -right-1 text-[5.5rem] font-black leading-none select-none pointer-events-none"
                      style={{
                        color: step.highlight ? 'rgba(255,168,69,0.07)' : 'rgba(255,255,255,0.025)',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {step.number}
                    </span>

                    {/* Icon */}
                    <div className={`mb-5 flex h-9 w-9 items-center justify-center rounded-xl border transition-all duration-300 ${
                      step.highlight
                        ? 'bg-[#ffa845]/10 border-[#ffa845]/25 text-[#ffa845]'
                        : 'bg-white/[0.04] border-white/[0.07] text-white/35 group-hover:text-[#5bb6ff]/70 group-hover:border-[#5bb6ff]/15'
                    }`}>
                      <Icon size={16} />
                    </div>

                    <p className={`text-[10px] font-mono font-semibold uppercase tracking-[0.18em] mb-2 ${
                      step.highlight ? 'text-[#ffa845]/55' : 'text-white/18'
                    }`}>
                      {t('stepLabel')} {step.number}
                    </p>

                    <h3 className="text-base font-semibold text-white mb-2.5 leading-snug">{step.title}</h3>
                    <p className="text-sm text-white/40 leading-relaxed">{step.body}</p>

                    {step.highlight && (
                      <div className="mt-5 pt-4 border-t border-[#ffa845]/10">
                        <span className="text-[10px] text-[#ffa845]/55 font-semibold uppercase tracking-[0.14em]">
                          {t('includesPlatform')}
                        </span>
                      </div>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* Outcome strip */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.42 }}
          className="mt-16 rounded-card border border-white/[0.06] bg-[#131316] grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-white/[0.05] overflow-hidden"
        >
          {stats.map(({ value, label }, i) => (
            <div key={value} className="flex flex-col items-center justify-center py-7 px-6 text-center">
              <span
                className="text-2xl font-bold mb-1.5"
                style={{ color: statColors[i], textShadow: `0 0 20px ${statColors[i]}40` }}
              >
                {value}
              </span>
              <span className="text-xs text-white/30 leading-snug">{label}</span>
            </div>
          ))}
        </motion.div>

      </div>
    </section>
  )
}
