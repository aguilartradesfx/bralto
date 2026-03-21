'use client'
import { motion } from 'framer-motion'
import { TestimonialsColumns } from '@/components/ui/testimonials-columns'

export function TestimonialsSection() {
  return (
    <section className="relative py-28 bg-[#080808]">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_30%_at_50%_50%,rgba(249,115,22,0.03),transparent)]" />

      <div className="relative z-10 mx-auto max-w-6xl px-6">
        <div className="text-center mb-14">
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-xs font-semibold uppercase tracking-[0.2em] text-[#F97316] mb-4"
          >
            Testimonios
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold tracking-tight text-white"
          >
            Lo que dicen nuestros clientes
          </motion.h2>
        </div>

        <TestimonialsColumns />
      </div>
    </section>
  )
}
