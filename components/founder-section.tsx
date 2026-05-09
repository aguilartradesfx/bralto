'use client'
import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'

export function FounderSection() {
  const t = useTranslations('FounderSection')

  return (
    <section className="relative py-28">
      <div className="relative z-10 mx-auto max-w-5xl px-6">
        <div className="rounded-card border border-white/[0.06] bg-[#131316] overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />

          <div className="flex flex-col lg:flex-row">
            {/* Avatar panel */}
            <div className="lg:w-72 shrink-0 flex items-center justify-center p-12 border-b lg:border-b-0 lg:border-r border-white/[0.05]"
              style={{ background: 'linear-gradient(135deg, #1a1a1e, #131316)' }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="flex flex-col items-center gap-4"
              >
                <div
                  className="h-28 w-28 rounded-full flex items-center justify-center text-3xl font-bold text-white/70 border border-white/[0.08]"
                  style={{
                    background: 'radial-gradient(circle at 35% 35%, rgba(91,182,255,0.12), rgba(91,182,255,0.03))',
                  }}
                >
                  AA
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-white">Alejandro Aguilar</p>
                  <p className="text-xs text-white/30 mt-0.5">{t('role')}</p>
                </div>
              </motion.div>
            </div>

            {/* Content */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.15 }}
              className="flex-1 p-10 lg:p-12"
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/28 mb-4">
                {t('label')}
              </p>
              <h2 className="text-3xl font-semibold text-white mb-6 leading-snug">
                {t('headline')}{' '}
                <em style={{ fontFamily: 'var(--font-instrument-serif)', fontStyle: 'italic', fontWeight: 400 }}>
                  {t('headlineItalic')}
                </em>
              </h2>
              <p className="text-base text-white/48 leading-relaxed mb-5">
                {t('body1')}
              </p>
              <p className="text-base text-white/48 leading-relaxed mb-8">
                {t('body2')}
              </p>

              <div className="flex items-center gap-3 pt-6 border-t border-white/[0.05]">
                <div
                  className="h-8 w-8 rounded-full flex items-center justify-center text-[#5bb6ff] text-xs font-bold border border-[#5bb6ff]/20"
                  style={{ background: 'rgba(91,182,255,0.08)' }}
                >
                  {t('yearsValue')}
                </div>
                <p className="text-sm text-white/38">{t('yearsDesc')}</p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}
