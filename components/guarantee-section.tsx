'use client'
import { motion } from 'framer-motion'
import { Shield, Clock } from 'lucide-react'

const guarantees = [
  {
    icon: Shield,
    title: 'Garantía de resultados',
    body: 'Si en el primer mes después de la activación no hay leads calificados que cubran el costo de la mensualidad, seguimos trabajando gratis hasta lograrlo.',
  },
  {
    icon: Clock,
    title: 'Entrega garantizada',
    body: 'Cada implementación se entrega funcionando en menos de 72 horas. Si no cumplimos, no paga.',
  },
]

export function GuaranteeSection() {
  return (
    <section className="relative py-20 bg-[#080808]">
      <div className="relative z-10 mx-auto max-w-4xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
            Sin riesgo.{' '}
            <span className="text-white/40">Sin letra pequeña.</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {guarantees.map((g, i) => {
            const Icon = g.icon
            return (
              <motion.div
                key={g.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="rounded-xl border border-[#F97316]/15 bg-[#F97316]/5 p-7 flex gap-4"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#F97316]/25 bg-[#F97316]/10 text-[#F97316]">
                  <Icon size={18} />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white mb-2">{g.title}</h3>
                  <p className="text-sm text-white/50 leading-relaxed">{g.body}</p>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
