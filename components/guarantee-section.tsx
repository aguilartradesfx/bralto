'use client'
import { motion } from 'framer-motion'
import { Shield, Clock } from 'lucide-react'
import { useTranslations } from 'next-intl'

const ICONS = [Shield, Clock]

export function GuaranteeSection() {
  const t = useTranslations('GuaranteeSection')
  const guarantees = t.raw('guarantees') as { title: string; body: string }[]

  return (
    <section className="relative py-20">
      <div className="relative z-10 mx-auto max-w-4xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-white">
            {t('headline')}{' '}
            <em style={{ fontFamily: 'var(--font-instrument-serif)', fontStyle: 'italic', fontWeight: 400, color: 'rgba(255,255,255,0.35)' }}>
              {t('headlineItalic')}
            </em>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {guarantees.map((g, i) => {
            const Icon = ICONS[i]
            return (
              <motion.div
                key={g.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative rounded-card border border-white/[0.06] bg-[#131316] p-7 flex gap-4 overflow-hidden"
              >
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#5bb6ff]/20 to-transparent" />
                <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_80%_60%_at_0%_0%,rgba(91,182,255,0.04),transparent)]" />

                <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#5bb6ff]/20 bg-[#5bb6ff]/08 text-[#5bb6ff]">
                  <Icon size={18} />
                </div>
                <div className="relative z-10">
                  <h3 className="text-base font-semibold text-white mb-2">{g.title}</h3>
                  <p className="text-sm text-white/42 leading-relaxed">{g.body}</p>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
