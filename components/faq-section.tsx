'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Minus } from 'lucide-react'

const faqs = [
  {
    q: '¿Qué tipo de negocios atienden?',
    a: 'Cualquier negocio que tenga procesos que dependan de personas: restaurantes, clínicas, imprentas, hoteles, inmobiliarias, agencias de viaje, asesores financieros, y más. Si hay un proceso manual, probablemente lo podemos automatizar.',
  },
  {
    q: '¿Qué incluye el servicio integral?',
    a: 'Todo lo que su negocio necesite: sitio web, agentes de IA, automatizaciones, integraciones con sus herramientas actuales, interfaces de gestión interna, y la plataforma Bralto para que controle todo desde un solo lugar.',
  },
  {
    q: '¿Cuánto cuesta?',
    a: 'Depende del alcance. Puede ir desde $800 por una implementación simple hasta proyectos más complejos. Agendá una llamada y le damos un presupuesto exacto después de entender su operación.',
  },
  {
    q: '¿Cuánto tiempo toma la implementación?',
    a: 'Implementaciones simples se entregan en menos de 72 horas. Proyectos más complejos pueden tomar 1-2 semanas. Siempre le damos un timeline claro antes de empezar.',
  },
  {
    q: '¿Qué es la plataforma Bralto?',
    a: 'Es el centro de operaciones donde corre todo lo que construimos. Desde ahí usted gestiona conversaciones, contactos, calendario, pagos, correos, y más. Viene incluida con cada implementación, o puede contratarla de forma independiente por $87/mes.',
  },
  {
    q: '¿Qué pasa si no funciona?',
    a: 'Si en el primer mes no hay resultados que cubran su inversión, seguimos trabajando gratis hasta lograrlo. Sin riesgo.',
  },
]

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section className="relative py-28 bg-[#080808]">
      <div className="relative z-10 mx-auto max-w-3xl px-6">
        <div className="text-center mb-14">
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-xs font-semibold uppercase tracking-[0.2em] text-[#F97316] mb-4"
          >
            Preguntas Frecuentes
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold tracking-tight text-white"
          >
            Todo lo que necesita saber
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
                className="w-full flex items-start justify-between gap-4 py-6 text-left hover:text-white transition-colors duration-200 group"
              >
                <span
                  className={`text-base font-medium leading-snug transition-colors duration-200 ${
                    openIndex === i ? 'text-white' : 'text-white/60 group-hover:text-white/80'
                  }`}
                >
                  {faq.q}
                </span>
                <div
                  className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-all duration-200 ${
                    openIndex === i
                      ? 'border-[#F97316] bg-orange-100 text-[#F97316]'
                      : 'border-white/15 text-white/40'
                  }`}
                >
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
                    <p className="pb-6 text-sm text-white/45 leading-relaxed">{faq.a}</p>
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
