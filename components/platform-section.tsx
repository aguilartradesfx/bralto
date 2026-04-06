'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, X } from 'lucide-react'
import { LiquidMetalButton } from '@/components/ui/liquid-metal-button'

const tabs = [
  {
    id: 'organizacion',
    label: 'Organización',
    icon: '◈',
    features: [
      'Pipeline visual de ventas',
      'Pagos integrados',
      'Reportes en tiempo real',
      'Gestión de contactos y CRM',
      'Automatizaciones de flujo',
      'Tareas y seguimientos del equipo',
    ],
  },
  {
    id: 'sitios',
    label: 'Sitios Web',
    icon: '◉',
    features: [
      'Constructor de páginas sin código',
      'Formularios inteligentes',
      'Agenda integrada',
      'Funnels de venta',
      'Membresías y cursos',
      'Dominio personalizado',
    ],
  },
  {
    id: 'multicanal',
    label: 'Multicanal',
    icon: '◎',
    features: [
      'Campañas automatizadas',
      'WhatsApp Business',
      'Email marketing',
      'SMS masivos',
      'Messenger e Instagram',
      'App móvil incluida',
    ],
  },
]

const replaced = [
  { tool: 'HubSpot', price: '$800+/mes' },
  { tool: 'ClickFunnels', price: '$297/mes' },
  { tool: 'Wix', price: '$39/mes' },
  { tool: 'Typeform', price: '$59/mes' },
  { tool: 'Mailchimp', price: '$350/mes' },
  { tool: 'Calendly', price: '$16/mes' },
  { tool: 'Twilio / SMS', price: '$200+/mes' },
  { tool: 'ManyChat', price: '$145/mes' },
  { tool: 'Kajabi', price: '$149/mes' },
  { tool: 'Stripe + integrations', price: '$120+/mes' },
]

export function PlatformSection() {
  const [activeTab, setActiveTab] = useState('organizacion')
  const active = tabs.find((t) => t.id === activeTab)!

  return (
    <section id="plataforma" className="relative py-28 bg-[#080808]">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_50%_100%,rgba(249,115,22,0.04),transparent)]" />

      <div className="relative z-10 mx-auto max-w-6xl px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-xs font-semibold uppercase tracking-[0.2em] text-[#F97316] mb-4"
          >
            Su Centro de Operaciones
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-4"
          >
            Todo lo que construimos
            <br />
            <span className="text-white/40">corre sobre su propia plataforma.</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.18 }}
            className="text-base text-white/45 max-w-xl mx-auto"
          >
            Cuando le entregamos su sistema automatizado, también le entregamos el control total.
            Desde un solo lugar usted gestiona todo.
          </motion.p>
        </div>

        {/* Tabs + features */}
        <div className="rounded-2xl border border-white/[0.07] bg-[#0e0e0e] overflow-hidden mb-16">
          {/* Tab nav */}
          <div className="flex border-b border-white/[0.07]">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'text-white border-b-2 border-[#F97316] bg-white/[0.02]'
                    : 'text-white/40 hover:text-white/70'
                }`}
              >
                <span className="text-[#F97316] opacity-70">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Feature list */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-0"
            >
              {active.features.map((feature, i) => (
                <div
                  key={feature}
                  className="flex items-center gap-3 px-6 py-4 border-b border-r border-white/[0.05] last:border-r-0"
                >
                  <Check size={15} className="text-[#F97316] shrink-0" />
                  <span className="text-sm text-white/65">{feature}</span>
                </div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Comparison */}
        <div className="rounded-2xl border border-white/[0.07] bg-[#0e0e0e] overflow-hidden">
          <div className="px-8 py-6 border-b border-white/[0.07]">
            <h3 className="text-lg font-semibold text-white">Lo que Bralto reemplaza</h3>
            <p className="text-sm text-white/40 mt-1">
              Todo lo que pagas por separado, en una sola plataforma.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2">
            {/* Tools list */}
            <div className="border-r border-white/[0.07]">
              <div className="px-6 py-4 border-b border-white/[0.05] flex items-center justify-between">
                <span className="text-xs uppercase tracking-widest text-white/30 font-medium">
                  Herramienta
                </span>
                <span className="text-xs uppercase tracking-widest text-white/30 font-medium">
                  Costo mensual
                </span>
              </div>
              {replaced.map((item) => (
                <div
                  key={item.tool}
                  className="px-6 py-3.5 border-b border-white/[0.04] flex items-center justify-between hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <X size={13} className="text-red-400/60" />
                    <span className="text-sm text-white/55">{item.tool}</span>
                  </div>
                  <span className="text-sm font-mono text-white/35">{item.price}</span>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="flex flex-col justify-center items-center p-10 text-center">
              <p className="text-sm text-white/35 uppercase tracking-widest mb-6">
                Sin Bralto pagarías
              </p>
              <div className="mb-2">
                <span
                  className="text-5xl font-bold text-white/20 line-through"
                  style={{ textDecorationColor: 'rgba(239,68,68,0.4)' }}
                >
                  $6,000+
                </span>
                <span className="text-xl text-white/30 ml-1">/mes</span>
              </div>
              <div className="my-8 h-px w-16 bg-[#F97316]/30" />
              <p className="text-sm text-white/35 uppercase tracking-widest mb-3">Con Bralto</p>
              <div className="mb-2">
                <span className="text-6xl font-bold text-[#F97316]">$87</span>
                <span className="text-xl text-white/50 ml-1">/mes</span>
              </div>
              <p className="text-xs text-white/30 mt-4 max-w-xs">
                Todas las herramientas. Un solo precio. Sin sorpresas.
              </p>

              <div className="mt-8 w-full">
                <p className="text-xs text-white/50 mb-4 leading-relaxed max-w-xs mx-auto">
                  La plataforma viene <span className="text-white/70 font-medium">incluida con cada implementación</span>. También está disponible de forma independiente.
                </p>
                <LiquidMetalButton href="https://buy.stripe.com/7sY7sK4ZBcuE61487P5EY0t" size="md">
                  Iniciar Prueba Gratuita
                </LiquidMetalButton>
                <p className="text-xs text-white/30 mt-3">
                  Hoy paga $0 — Pruebe el sistema antes de pagarlo
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
