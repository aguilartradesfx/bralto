'use client'
import { motion } from 'framer-motion'
import { LiquidMetalButton } from '@/components/ui/liquid-metal-button'
import { Typewriter } from '@/components/ui/typewriter'

const CTA_PHRASES = [
  'Tu competencia posiblemente está considerando algo como esto.',
  'En este juego, gana el que se mueve primero.',
  'Mientras lees esto, alguien más ya está automatizando.',
  'El que automatiza primero, captura el mercado.',
  'Cada día sin automatizar es una ventaja que le regalas a tu competencia.',
]

export function FinalCta() {
  return (
    <section id="contacto" className="relative py-32 overflow-hidden bg-[#080808]">
      {/* Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_50%,rgba(249,115,22,0.06),transparent)]" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-orange-200 to-transparent" />

      <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-xs font-semibold uppercase tracking-[0.2em] text-[#F97316] mb-6"
        >
          ¿Listo para automatizar?
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.1] mb-8 min-h-[3em]"
        >
          <Typewriter
            text={CTA_PHRASES}
            speed={38}
            deleteSpeed={18}
            waitTime={3800}
            cursorChar="_"
            cursorClassName="ml-1 text-[#F97316]"
          />
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="text-lg text-white/40 max-w-lg mx-auto mb-12"
        >
          Una conversación de 30 minutos puede cambiar cómo opera tu negocio para siempre.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.28 }}
          className="flex flex-col items-center gap-4"
        >
          <LiquidMetalButton href="/agendar" size="lg">
            Agendar Llamada Estratégica
          </LiquidMetalButton>
          <p className="text-sm text-white/30">30 minutos. Sin compromiso. Sin costo.</p>
        </motion.div>

        {/* Social proof strip */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-16 flex flex-wrap items-center justify-center gap-8"
        >
          {[
            ['9+', 'Industrias atendidas'],
            ['72h', 'Tiempo de implementación'],
            ['24/7', 'Operación sin parar'],
          ].map(([stat, label]) => (
            <div key={stat} className="text-center">
              <p className="text-2xl font-bold text-white">{stat}</p>
              <p className="text-xs text-white/30 mt-0.5">{label}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
