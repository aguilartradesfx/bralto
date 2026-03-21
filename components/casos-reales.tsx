'use client'
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import {
  User,
  Globe,
  Calendar,
  Phone,
  CheckCircle2,
  MessageCircle,
  Bot,
  FileText,
  LayoutDashboard,
  Palette,
  Package,
  CreditCard,
  Star,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

// ─── Flow Diagram ──────────────────────────────────────────────────────────────

type FlowNode = { icon: LucideIcon; label: string }

function FlowDiagram({ nodes }: { nodes: FlowNode[] }) {
  return (
    <div className="flex flex-col gap-2 overflow-x-auto pb-1">
      {/* Icons row */}
      <div className="flex items-center justify-start md:justify-center min-w-max md:min-w-0">
        {nodes.map((node, i) => {
          const Icon = node.icon
          return (
            <div key={i} className="flex items-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.75 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.25 }}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#F97316]/20 bg-[#F97316]/5 text-[#F97316] shrink-0"
              >
                <Icon size={16} />
              </motion.div>
              {i < nodes.length - 1 && (
                <motion.div
                  initial={{ opacity: 0, scaleX: 0 }}
                  whileInView={{ opacity: 1, scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 + 0.12, duration: 0.2 }}
                  className="w-7 h-px bg-gradient-to-r from-[#F97316]/30 to-[#F97316]/10 origin-left shrink-0"
                />
              )}
            </div>
          )
        })}
      </div>
      {/* Labels row */}
      <div className="flex items-start justify-start md:justify-center min-w-max md:min-w-0">
        {nodes.map((node, i) => (
          <div key={i} className="flex items-start">
            <div className="w-9 text-center shrink-0">
              <span className="text-[9px] text-white/30 leading-tight block">{node.label}</span>
            </div>
            {i < nodes.length - 1 && <div className="w-7 shrink-0" />}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Case data ─────────────────────────────────────────────────────────────────

const cases = [
  {
    industry: 'Agencia de Viajes',
    problem:
      'Los clientes querían reservar tours pero tenían que llamar, esperar, coordinarse con un agente. Se perdían ventas fuera de horario.',
    built: [
      'Sitio web con motor de reservas en línea',
      'Sistema de agendamiento de llamadas con el equipo de ventas',
      'Plataforma de administración de tours con interfaz propia',
      'Automatización de seguimiento post-reserva',
    ],
    result:
      'Ahora los clientes reservan cuando quieren, el equipo solo se conecta a vender, y toda la operación se gestiona desde un solo lugar.',
    flow: [
      { icon: User, label: 'Cliente' },
      { icon: Globe, label: 'Sitio web' },
      { icon: Calendar, label: 'Reserva' },
      { icon: Phone, label: 'Llamada' },
      { icon: CheckCircle2, label: 'Confirmado' },
    ] as FlowNode[],
  },
  {
    industry: 'Imprenta',
    problem:
      'Más de 1,000 productos, pedidos por WhatsApp que se perdían, cotizaciones manuales que tomaban horas, y diseñadores sin saber qué trabajo seguía.',
    built: [
      'Agente de IA multicanal que atiende clientes, busca productos y crea órdenes desde el chat',
      'Interfaz de gestión de pedidos conectada a la base de datos',
      'Sistema de asignación interna: administradores asignan pedidos a diseñadores',
      'Todo conectado: el agente crea la orden → aparece en la interfaz → el admin la asigna → el diseñador la ejecuta',
    ],
    result:
      'El agente atiende y cotiza en segundos. El equipo solo se enfoca en producir. Cero pedidos perdidos.',
    flow: [
      { icon: MessageCircle, label: 'Cliente' },
      { icon: Bot, label: 'Agente IA' },
      { icon: FileText, label: 'Orden' },
      { icon: LayoutDashboard, label: 'Admin' },
      { icon: Palette, label: 'Diseñador' },
      { icon: Package, label: 'Entrega' },
    ] as FlowNode[],
  },
  {
    industry: 'Restaurante',
    problem:
      'Reservas de mesas por teléfono que nadie contestaba los fines de semana. Cero seguimiento después de la visita. Sin sistema de reseñas.',
    built: [
      'Sitio web completo desde cero',
      'Motor de reservas de mesas conectado a WhatsApp, Instagram y web',
      'Agente de IA que gestiona reservas 24/7',
      'Conexión con el POS para detectar pagos y disparar solicitudes de reseña automáticas',
      'Sistema de seguimiento post-visita',
    ],
    result:
      'El restaurante llena mesas sin que nadie conteste el teléfono. Las reseñas llegan solas. La operación no para.',
    flow: [
      { icon: User, label: 'Cliente' },
      { icon: MessageCircle, label: 'Reserva' },
      { icon: Bot, label: 'Agente IA' },
      { icon: Calendar, label: 'Mesa' },
      { icon: CreditCard, label: 'Pago' },
      { icon: Star, label: 'Reseña' },
    ] as FlowNode[],
  },
]

// ─── Main section ─────────────────────────────────────────────────────────────

export function CasosReales() {
  return (
    <section id="casos-reales" className="relative py-28 bg-[#080808]">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_35%_at_50%_50%,rgba(249,115,22,0.03),transparent)]" />

      <div className="relative z-10 mx-auto max-w-6xl px-6">
        {/* Header */}
        <div className="text-center mb-20">
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-xs font-semibold uppercase tracking-[0.2em] text-[#F97316] mb-4"
          >
            Así Lo Hemos Hecho
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold tracking-tight text-white leading-tight mb-4"
          >
            Cada negocio es diferente.
            <br />
            <span className="text-white/40">Cada solución también.</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.18 }}
            className="text-base text-white/35 max-w-sm mx-auto"
          >
            Estos son ejemplos reales de lo que hemos construido.
          </motion.p>
        </div>

        {/* Cases */}
        <div className="flex flex-col gap-6">
          {cases.map((c, i) => (
            <motion.div
              key={c.industry}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="rounded-2xl border border-white/[0.07] bg-[#0e0e0e] overflow-hidden"
            >
              {/* Card top: industry badge + problem */}
              <div className="px-8 pt-8 pb-0">
                <div className="flex items-center gap-3 mb-5">
                  <span className="inline-flex items-center rounded-full border border-[#F97316]/30 bg-[#F97316]/8 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.15em] text-[#F97316]">
                    {c.industry}
                  </span>
                </div>
                <p className="text-sm text-white/40 leading-relaxed mb-6 max-w-2xl">
                  <span className="text-white/60 font-medium">El problema: </span>
                  {c.problem}
                </p>
              </div>

              {/* Card middle: two columns */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 border-t border-white/[0.05]">
                {/* Built list */}
                <div className="px-8 py-6 border-b lg:border-b-0 lg:border-r border-white/[0.05]">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-white/30 mb-4">
                    Lo que construimos
                  </p>
                  <ul className="flex flex-col gap-3">
                    {c.built.map((item) => (
                      <li key={item} className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#F97316]/10">
                          <Check size={10} className="text-[#F97316]" />
                        </div>
                        <span className="text-sm text-white/55 leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Result */}
                <div className="px-8 py-6 flex flex-col justify-center">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-white/30 mb-4">
                    El resultado
                  </p>
                  <div className="rounded-xl border border-[#F97316]/15 bg-[#F97316]/5 p-5">
                    <div className="text-2xl text-[#F97316]/30 font-serif leading-none mb-2">&ldquo;</div>
                    <p className="text-base font-medium text-white/80 leading-relaxed">
                      {c.result}
                    </p>
                  </div>
                </div>
              </div>

              {/* Card bottom: flow diagram */}
              <div className="px-8 py-5 border-t border-white/[0.05] bg-[#0a0a0a]">
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-white/20 mb-4">
                  Cómo funciona el sistema
                </p>
                <FlowDiagram nodes={c.flow} />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <p className="text-white/40 text-sm max-w-xl mx-auto mb-6 leading-relaxed">
            ¿Su negocio enfrenta un reto similar? No importa la industria — si hay un proceso que
            depende de personas, probablemente lo podemos automatizar.
          </p>
          <a
            href="#contacto"
            className="inline-flex items-center rounded-lg bg-[#F97316] px-6 py-3 text-sm font-semibold text-white transition-all duration-200 hover:bg-[#ea6c0c] hover:shadow-[0_0_24px_rgba(249,115,22,0.35)]"
          >
            Agendar Llamada Estratégica
          </a>
        </motion.div>
      </div>
    </section>
  )
}
