'use client'

import { motion } from 'framer-motion'
import { Search, Pencil, Hammer, Rocket } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const steps: {
  number: string
  icon: LucideIcon
  title: string
  body: string
  highlight: boolean
}[] = [
  {
    number: '01',
    icon: Search,
    title: 'Diagnóstico',
    body: 'Analizamos su negocio: cómo llegan los clientes, quién los atiende, dónde se pierden oportunidades y qué procesos dependen de personas.',
    highlight: false,
  },
  {
    number: '02',
    icon: Pencil,
    title: 'Diseño',
    body: 'Diseñamos el sistema a la medida: canales a conectar, cómo opera el agente de IA y cómo gestiona su equipo el día a día.',
    highlight: false,
  },
  {
    number: '03',
    icon: Hammer,
    title: 'Construcción',
    body: 'Desarrollamos todo: sitio web, agente de IA, integraciones y flujos. Un solo sistema conectado y funcionando.',
    highlight: false,
  },
  {
    number: '04',
    icon: Rocket,
    title: 'Entrega + Plataforma',
    body: 'Entregamos todo funcionando en menos de 72 horas sobre su propia plataforma. Control total desde un solo lugar.',
    highlight: true,
  },
]

export function HowItWorks() {
  return (
    <section id="como-funciona" className="relative py-28 bg-[#080808] overflow-hidden">

      {/* Subtle top glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_35%_at_50%_0%,rgba(249,115,22,0.05),transparent)]" />

      <div className="relative z-10 mx-auto max-w-6xl px-6">

        {/* ── Header: problem → solution frame ─────────────────── */}
        <div className="text-center mb-20">

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-xs font-semibold uppercase tracking-[0.2em] text-[#F97316] mb-5"
          >
            Cómo Funciona
          </motion.p>

          {/* Problem hook */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.06 }}
            className="text-sm text-white/35 mb-4 tracking-wide"
          >
            Hoy, cada proceso que depende de una persona es un riesgo.
          </motion.p>

          {/* Main headline */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl lg:text-[3.5rem] font-bold tracking-tight leading-[1.08] text-white mb-5"
          >
            Así es como
            <span className="text-[#F97316]"> lo cambiamos.</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.16 }}
            className="text-base text-white/40 max-w-sm mx-auto leading-relaxed"
          >
            Cuatro pasos. De la primera llamada a su sistema funcionando solo.
          </motion.p>
        </div>

        {/* ── Steps: timeline grid ──────────────────────────────── */}
        <div className="relative">

          {/* Horizontal connecting line — desktop only */}
          <div className="hidden lg:block absolute top-[2.875rem] left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {steps.map((step, i) => {
              const Icon = step.icon
              return (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, y: 28 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.5, ease: 'easeOut' }}
                  className="relative"
                >
                  {/* Timeline dot — desktop */}
                  <div
                    className={`hidden lg:flex absolute top-[2.25rem] left-1/2 -translate-x-1/2 w-[1.25rem] h-[1.25rem] rounded-full items-center justify-center z-10
                    ring-[5px] ${
                      step.highlight
                        ? 'bg-[#F97316] ring-[#F97316]/20'
                        : 'bg-[#181818] ring-[#080808] border border-white/[0.1]'
                    }`}
                  >
                    {step.highlight && (
                      <div className="w-[0.4rem] h-[0.4rem] rounded-full bg-white/90" />
                    )}
                  </div>

                  {/* Card */}
                  <div
                    className={`relative h-full lg:mt-11 p-6 rounded-2xl border overflow-hidden transition-all duration-300 group ${
                      step.highlight
                        ? 'bg-[#0f0a06] border-[#F97316]/20'
                        : 'bg-[#0e0e0e] border-white/[0.07] hover:border-white/[0.14] hover:bg-[#111]'
                    }`}
                  >
                    {/* Ghost number — decorative */}
                    <span
                      className="absolute -top-3 -right-1 text-[5.5rem] font-black leading-none select-none pointer-events-none"
                      style={{
                        color: step.highlight
                          ? 'rgba(249,115,22,0.07)'
                          : 'rgba(255,255,255,0.032)',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {step.number}
                    </span>

                    {/* Icon */}
                    <div
                      className={`mb-5 flex h-9 w-9 items-center justify-center rounded-xl border transition-all duration-300 ${
                        step.highlight
                          ? 'bg-[#F97316]/10 border-[#F97316]/25 text-[#F97316]'
                          : 'bg-white/[0.04] border-white/[0.08] text-white/40 group-hover:text-[#F97316]/65 group-hover:border-[#F97316]/15'
                      }`}
                    >
                      <Icon size={16} />
                    </div>

                    {/* Step label */}
                    <p
                      className={`text-[10px] font-mono font-semibold uppercase tracking-[0.18em] mb-2 ${
                        step.highlight ? 'text-[#F97316]/60' : 'text-white/18'
                      }`}
                    >
                      Paso {step.number}
                    </p>

                    {/* Title */}
                    <h3 className="text-[1rem] font-semibold text-white mb-2.5 leading-snug">
                      {step.title}
                    </h3>

                    {/* Body */}
                    <p className="text-sm text-white/42 leading-relaxed">
                      {step.body}
                    </p>

                    {/* Step 4 footer */}
                    {step.highlight && (
                      <div className="mt-5 pt-4 border-t border-[#F97316]/10">
                        <span className="text-[10px] text-[#F97316]/55 font-semibold uppercase tracking-[0.14em]">
                          Incluye Plataforma Bralto
                        </span>
                      </div>
                    )}

                    {/* Top edge highlight */}
                    <div
                      className={`absolute inset-x-0 top-0 h-px ${
                        step.highlight
                          ? 'bg-gradient-to-r from-transparent via-[#F97316]/45 to-transparent'
                          : 'bg-gradient-to-r from-transparent via-white/[0.09] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300'
                      }`}
                    />
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* ── Outcome strip ─────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.42 }}
          className="mt-20 rounded-2xl border border-white/[0.06] bg-white/[0.015] grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-white/[0.05] overflow-hidden"
        >
          {[
            { stat: '< 72 hrs', label: 'De diagnóstico a sistema funcionando' },
            { stat: '100%', label: 'Personalizado a su operación' },
            { stat: '24/7', label: 'Su sistema nunca para' },
          ].map(({ stat, label }) => (
            <div
              key={stat}
              className="flex flex-col items-center justify-center py-7 px-6 text-center"
            >
              <span className="text-2xl font-bold text-[#F97316] mb-1.5">{stat}</span>
              <span className="text-xs text-white/35 leading-snug">{label}</span>
            </div>
          ))}
        </motion.div>

      </div>
    </section>
  )
}
