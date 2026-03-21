'use client'
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'

const steps = [
  {
    number: '1',
    title: 'Análisis',
    description:
      'Entendemos cómo opera tu negocio, dónde están los cuellos de botella y qué procesos automatizar primero.',
  },
  {
    number: '2',
    title: 'Implementación',
    description:
      'Configuramos la plataforma, construimos los agentes de IA y conectamos todos tus canales de comunicación.',
  },
  {
    number: '3',
    title: 'Entrega',
    description:
      'Tu infraestructura lista en menos de 72 horas. Con soporte y ajustes incluidos.',
  },
]

const includes = [
  'Agente IA adaptado a tu negocio y tono de voz',
  'Sistema de seguimiento automático completo',
  'Plataforma configurada a tu medida',
  'Integraciones con WhatsApp, Instagram y más',
  'Capacitación del equipo incluida',
  'Soporte continuo post-implementación',
]

const cases = [
  {
    industry: 'Restaurante',
    title: 'Reservas 24/7',
    description:
      'Sistema de reservas completamente automatizado. El restaurante ahora llena mesas los 7 días sin intervención del equipo.',
  },
  {
    industry: 'Imprenta',
    title: 'Agente con +1,000 Productos',
    description:
      'Un agente de IA que cotiza más de 1,000 productos con especificaciones técnicas sin errores, en segundos.',
  },
  {
    industry: 'Clínica',
    title: 'Citas Automatizadas',
    description:
      'Agenda, confirmación, recordatorio y seguimiento post-consulta. Todo automático, sin secretaria.',
  },
]

export function DoneForYou() {
  return (
    <section id="done-for-you" className="relative py-28 bg-[#080808]">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_40%_30%_at_50%_50%,rgba(249,115,22,0.03),transparent)]" />

      <div className="relative z-10 mx-auto max-w-6xl px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-xs font-semibold uppercase tracking-[0.2em] text-[#F97316] mb-4"
          >
            Done For You
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-4"
          >
            ¿Sin tiempo para configurar todo?
            <br />
            <span className="text-white/40">Nosotros lo hacemos por usted.</span>
          </motion.h2>
        </div>

        {/* 3 steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-16">
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="relative rounded-xl border border-white/[0.07] bg-[#0e0e0e] p-7 hover:border-orange-200 transition-colors duration-300"
            >
              <div
                className="text-5xl font-bold mb-4 leading-none"
                style={{
                  background: 'linear-gradient(135deg, rgba(249,115,22,0.7), rgba(249,115,22,0.2))',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                {step.number}
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{step.title}</h3>
              <p className="text-sm text-white/45 leading-relaxed">{step.description}</p>
              {i < 2 && (
                <div className="hidden md:block absolute -right-2 top-1/2 -translate-y-1/2 text-white/15 text-xl z-10">
                  →
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Two-column: includes + quote */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-16">
          {/* Includes */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="rounded-xl border border-white/[0.07] bg-[#0e0e0e] p-8"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#F97316] mb-5">
              Incluye
            </p>
            <ul className="flex flex-col gap-3.5">
              {includes.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-orange-100">
                    <Check size={11} className="text-[#F97316]" />
                  </div>
                  <span className="text-sm text-white/60">{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Quote + guarantee */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex flex-col gap-4"
          >
            {/* Quote */}
            <div className="rounded-xl border border-[#F97316]/20 bg-orange-50 p-8 flex-1">
              <div className="text-3xl text-[#F97316]/40 font-serif leading-none mb-3">&ldquo;</div>
              <p className="text-lg font-medium text-white/80 leading-relaxed">
                No adaptamos su negocio a nuestra solución — adaptamos nuestra solución a su
                negocio.
              </p>
            </div>

            {/* Guarantee */}
            <div className="rounded-xl border border-white/[0.07] bg-[#0e0e0e] p-6">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 text-xl">🛡</div>
                <div>
                  <p className="text-sm font-semibold text-white mb-1">Garantía de Resultados</p>
                  <p className="text-sm text-white/45 leading-relaxed">
                    Si en el primer mes no hay leads calificados que cubran la mensualidad,
                    seguimos trabajando gratis.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Case studies */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {cases.map((c, i) => (
            <motion.div
              key={c.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="rounded-xl border border-white/[0.06] bg-[#0a0a0a] p-6"
            >
              <div className="inline-block rounded-full bg-orange-100 px-2.5 py-0.5 text-[11px] font-medium text-orange-DEFAULT uppercase tracking-wider mb-3">
                {c.industry}
              </div>
              <h4 className="text-base font-semibold text-white mb-2">{c.title}</h4>
              <p className="text-sm text-white/40 leading-relaxed">{c.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
