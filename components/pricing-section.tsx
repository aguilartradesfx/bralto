'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check } from 'lucide-react'

const plans = {
  plataforma: {
    badge: 'Autogestión',
    badgeStyle: 'border border-white/[0.1] text-white/40',
    name: 'Plataforma Bralto',
    nameColor: 'text-white/30',
    price: '$87',
    priceSuffix: '/mes',
    priceNote: 'Hoy paga $0 — Pruebe antes de pagar.',
    description:
      'Para quienes quieren centralizar su operación por su cuenta. Una sola plataforma que reemplaza más de 10 herramientas.',
    features: [
      'CRM y embudos de venta',
      'Sitio web y landing pages',
      'Calendario y agendamiento',
      'Email y SMS marketing',
      'Automatizaciones de flujo',
      'Gestión multicanal (WhatsApp, IG, Email)',
      'App móvil incluida',
      'Reportes en tiempo real',
    ],
    checkBg: 'bg-white/[0.05] border-white/[0.1]',
    checkColor: 'text-white/40',
    featureColor: 'text-white/55',
    dividerColor: 'via-white/[0.07]',
    cardBorder: 'border-white/[0.08]',
    cardBg: 'bg-[#0e0e0e]',
    topEdge: 'via-white/[0.09]',
    cta: {
      label: 'Iniciar Prueba Gratuita',
      href: 'https://buy.stripe.com/7sY7sK4ZBcuE61487P5EY0t',
      external: true,
      style:
        'border border-white/[0.14] text-white/70 hover:border-white/30 hover:text-white',
    },
  },
  integral: {
    badge: 'Recomendado',
    badgeStyle: 'bg-[#F97316] text-white',
    name: 'Servicio Integral',
    nameColor: 'text-[#F97316]/70',
    price: 'Desde $849',
    priceSuffix: '',
    priceNote: 'El precio final depende del alcance de su proyecto.',
    description:
      'Analizamos su negocio, diseñamos la solución, y le entregamos todo funcionando. La plataforma Bralto viene incluida.',
    features: [
      'Todo lo de la Plataforma Bralto',
      'Diagnóstico completo de su operación',
      'Diseño de solución a la medida',
      'Desarrollo de sitio web',
      'Agentes de IA configurados',
      'Integraciones con sus herramientas',
      'Interfaces de gestión internas',
      'Entrega en menos de 72 horas',
      'Soporte post-implementación',
    ],
    checkBg: 'bg-[#F97316]/15 border-[#F97316]/25',
    checkColor: 'text-[#F97316]',
    featureColor: 'text-white/65',
    dividerColor: 'via-[#F97316]/15',
    cardBorder: 'border-[#F97316]/25',
    cardBg: 'bg-[#0f0a06]',
    topEdge: 'via-[#F97316]/45',
    cta: {
      label: 'Agendar Llamada Estratégica',
      href: '/agendar',
      external: false,
      style: 'bg-[#F97316] text-white hover:bg-[#ea6c0c]',
    },
  },
} as const

type PlanKey = keyof typeof plans

export function PricingSection() {
  const [selected, setSelected] = useState<PlanKey>('integral')
  const plan = plans[selected]

  return (
    <section id="inversion" className="relative overflow-hidden bg-[#080808] py-28">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_30%_at_50%_0%,rgba(249,115,22,0.04),transparent)]" />

      <div className="relative z-10 mx-auto max-w-2xl px-6">

        {/* Header */}
        <div className="mb-12 text-center">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-5 text-xs font-semibold uppercase tracking-[0.2em] text-[#F97316]"
          >
            Inversión
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.08 }}
            className="text-4xl font-bold tracking-tight text-white md:text-5xl leading-[1.08]"
          >
            Dos caminos.{' '}
            <span className="text-[#F97316]">Un mismo objetivo.</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.14 }}
            className="mt-4 text-base text-white/40"
          >
            Que su negocio opere mejor, sin depender de más personas.
          </motion.p>
        </div>

        {/* Toggle selector */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="mb-8 flex rounded-xl border border-white/[0.07] bg-white/[0.03] p-1"
        >
          {(['integral', 'plataforma'] as PlanKey[]).map((key) => (
            <button
              key={key}
              onClick={() => setSelected(key)}
              className={`relative flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
                selected === key
                  ? 'text-white'
                  : 'text-white/35 hover:text-white/60'
              }`}
            >
              {selected === key && (
                <motion.span
                  layoutId="tab-bg"
                  className="absolute inset-0 rounded-lg bg-white/[0.07] border border-white/[0.1]"
                  transition={{ type: 'spring', stiffness: 380, damping: 35 }}
                />
              )}
              <span className="relative z-10">
                {key === 'integral' ? 'Servicio Integral' : 'Plataforma Bralto'}
              </span>
              {key === 'integral' && (
                <span className="relative z-10 ml-2 rounded-full bg-[#F97316] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
                  Recomendado
                </span>
              )}
            </button>
          ))}
        </motion.div>

        {/* Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={selected}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className={`relative flex flex-col rounded-2xl border ${plan.cardBorder} ${plan.cardBg} p-8 overflow-hidden`}
          >
            {/* Top edge highlight */}
            <div className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent ${plan.topEdge} to-transparent`} />

            {/* Badge + plan name row */}
            <div className="mb-6 flex items-center gap-3">
              <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${plan.badgeStyle}`}>
                {plan.badge}
              </span>
            </div>
            <p className={`mb-1 text-xs font-semibold uppercase tracking-[0.18em] ${plan.nameColor}`}>
              {plan.name}
            </p>

            {/* Price */}
            <div className="mb-1 flex items-baseline gap-1">
              <span className="text-5xl font-black tracking-tight text-white">
                {plan.price}
              </span>
              {plan.priceSuffix && (
                <span className="text-lg text-white/35">{plan.priceSuffix}</span>
              )}
            </div>
            <p className="mb-6 text-sm text-white/30">{plan.priceNote}</p>

            {/* Divider */}
            <div className={`mb-6 h-px w-full bg-gradient-to-r from-transparent ${plan.dividerColor} to-transparent`} />

            {/* Description */}
            <p className="mb-8 text-sm leading-relaxed text-white/45">
              {plan.description}
            </p>

            {/* Features — two columns on wider screens */}
            <ul className="mb-8 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
              {plan.features.map((feat) => (
                <li key={feat} className={`flex items-start gap-3 text-sm ${plan.featureColor}`}>
                  <span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${plan.checkBg}`}>
                    <Check size={10} className={plan.checkColor} strokeWidth={3} />
                  </span>
                  {feat}
                </li>
              ))}
            </ul>

            {/* CTA */}
            {plan.cta.external ? (
              <a
                href={plan.cta.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex w-full items-center justify-center rounded-xl px-6 py-4 text-sm font-semibold transition-all duration-200 ${plan.cta.style}`}
              >
                {plan.cta.label}
              </a>
            ) : (
              <a
                href={plan.cta.href}
                className={`inline-flex w-full items-center justify-center rounded-xl px-6 py-4 text-sm font-semibold transition-all duration-200 ${plan.cta.style}`}
              >
                {plan.cta.label}
              </a>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Bottom note */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="mt-8 text-center text-sm text-white/30"
        >
          ¿No está seguro cuál es la mejor opción?{' '}
          <a
            href="#contacto"
            className="text-white/50 underline underline-offset-4 hover:text-white/70 transition-colors duration-200"
          >
            Agendemos una llamada
          </a>{' '}
          y le ayudamos a decidir — sin compromiso.
        </motion.p>

      </div>
    </section>
  )
}
