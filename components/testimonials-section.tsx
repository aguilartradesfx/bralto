'use client'
import { motion } from 'framer-motion'
import { TestimonialsColumns } from '@/components/ui/testimonials-columns'
import { useTranslations } from 'next-intl'

export function TestimonialsSection() {
  const t = useTranslations('TestimonialsSection')

  return (
    <section className="relative py-28 overflow-hidden">
      <div className="relative z-10 mx-auto max-w-6xl px-6">
        <div className="text-center mb-14">
          <motion.p
            initial={{ opacity: 0, y: 16 }}
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
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-semibold tracking-tight text-white leading-[1.08]"
          >
            {t('headline')}{' '}
            <em style={{ fontFamily: 'var(--font-instrument-serif)', fontStyle: 'italic', fontWeight: 400, color: 'rgba(255,255,255,0.55)' }}>
              {t('headlineItalic')}
            </em>
          </motion.h2>
        </div>

        <TestimonialsColumns />
      </div>
    </section>
  )
}
