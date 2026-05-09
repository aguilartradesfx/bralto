'use client'
import { motion } from 'framer-motion'
import { LiquidMetalButton } from '@/components/ui/liquid-metal-button'
import { Typewriter } from '@/components/ui/typewriter'
import { useTranslations, useLocale } from 'next-intl'

export function FinalCta() {
  const t = useTranslations('FinalCta')
  const locale = useLocale()
  const phrases = t.raw('phrases') as string[]
  const stats = t.raw('stats') as { value: string; label: string }[]
  const statColors = ['#5bb6ff', '#5bb6ff', '#ffa845']

  return (
    <section id="contacto" className="relative py-32 overflow-hidden">
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)' }}
      />

      <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/28 mb-6"
        >
          {t('label')}
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-white leading-[1.1] mb-8"
        >
          <Typewriter
            text={phrases}
            speed={38}
            deleteSpeed={18}
            waitTime={3800}
            cursorChar="_"
            cursorClassName="ml-1 text-[#5bb6ff]"
            stableSize
          />
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="text-lg text-white/35 max-w-lg mx-auto mb-12"
        >
          {t('desc')}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.28 }}
          className="flex flex-col items-center gap-4"
        >
          <LiquidMetalButton href={`/${locale}/agendar`} size="lg">
            {t('cta')}
          </LiquidMetalButton>
          <p className="text-sm text-white/25">{t('ctaNote')}</p>
        </motion.div>

        {/* Social proof */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-16 flex flex-wrap items-center justify-center gap-8"
        >
          {stats.map(({ value, label }, i) => (
            <div key={value} className="text-center">
              <p className="text-2xl font-bold text-white" style={{ textShadow: `0 0 20px ${statColors[i]}50` }}>{value}</p>
              <p className="text-xs text-white/25 mt-0.5">{label}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
