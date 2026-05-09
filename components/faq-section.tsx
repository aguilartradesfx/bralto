'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Minus } from 'lucide-react'
import { useTranslations } from 'next-intl'

export function FaqSection() {
  const t = useTranslations('FaqSection')
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const faqs = t.raw('faqs') as { q: string; a: string }[]

  return (
    <section className="relative py-28">
      <div className="relative z-10 mx-auto max-w-3xl px-6">
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
            <em style={{ fontFamily: 'var(--font-instrument-serif)', fontStyle: 'italic', fontWeight: 400, color: 'rgba(255,255,255,0.45)' }}>
              {t('headlineItalic')}
            </em>
          </motion.h2>
        </div>

        <div className="flex flex-col divide-y divide-white/[0.05]">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
            >
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex items-start justify-between gap-4 py-6 text-left group"
              >
                <span className={`text-base font-medium leading-snug transition-colors duration-200 ${
                  openIndex === i ? 'text-white' : 'text-white/55 group-hover:text-white/80'
                }`}>
                  {faq.q}
                </span>
                <div className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-all duration-200 ${
                  openIndex === i
                    ? 'border-[#5bb6ff]/50 bg-[#5bb6ff]/10 text-[#5bb6ff]'
                    : 'border-white/12 text-white/35'
                }`}>
                  {openIndex === i ? <Minus size={12} /> : <Plus size={12} />}
                </div>
              </button>

              <AnimatePresence>
                {openIndex === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <p className="pb-6 text-sm text-white/42 leading-relaxed">{faq.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
