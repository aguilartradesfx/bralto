'use client'
import { motion } from 'framer-motion'

const statements = [
  'Si el vendedor se enferma, las ventas paran.',
  'Si el equipo no da seguimiento a tiempo, el lead se enfría.',
  'Si nadie contesta WhatsApp un domingo, la oportunidad se pierde.',
  'Invierte en publicidad pero no tiene infraestructura para convertir lo que llega.',
]

export function ProblemSection() {
  return (
    <section className="relative py-28 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#080808] via-[#0a0808] to-[#080808]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_50%_50%,rgba(249,115,22,0.04),transparent)]" />

      <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-xs font-semibold uppercase tracking-[0.2em] text-[#F97316] mb-5"
        >
          El Problema
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-4xl md:text-5xl lg:text-[3.2rem] font-bold tracking-tight text-white leading-[1.08] mb-16"
        >
          Sus ventas dependen de personas.{' '}
          <span className="text-white/35">Y las personas fallan.</span>
        </motion.h2>

        <div className="flex flex-col gap-5 mb-16">
          {statements.map((statement, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12, duration: 0.5 }}
              className="group flex items-start gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] px-6 py-5 text-left hover:border-orange-200 hover:bg-white/[0.035] transition-all duration-300"
            >
              <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-red-500/30 bg-red-500/10">
                <span className="text-xs text-red-400">✕</span>
              </div>
              <p className="text-base md:text-lg text-white/65 leading-snug group-hover:text-white/80 transition-colors duration-200">
                {statement}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Closing statement */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="relative"
        >
          <div className="section-divider mb-8" />
          <p className="text-xl md:text-2xl font-semibold text-white">
            Bralto existe para que esto{' '}
            <span className="text-[#F97316]">deje de pasar.</span>
          </p>
        </motion.div>
      </div>
    </section>
  )
}
