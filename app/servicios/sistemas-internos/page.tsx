'use client'
import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, ChevronDown } from 'lucide-react'
import { ServiciosRelacionados } from '@/components/servicios-relacionados'

const AGENDAR = '/agendar'

const SIDEBAR_ITEMS = ['📊 Dashboard', '👥 Clientes', '📦 Pedidos', '💬 Mensajes', '📈 Reportes', '⚙️ Config']
const STATS = [['127', 'Clientes activos', '#5bb6ff'], ['43', 'Pedidos hoy', '#82c8ff'], ['$42,800', 'MRR', '#ffa845'], ['94%', 'Satisfacción', '#22c55e']] as const
const ROWS = [
  ['Ana García',       'Activo',      '$1,200', 'May 8', '#22c55e'],
  ['Luis Torres',      'En proceso',  '$850',   'May 7', '#fbbf24'],
  ['Café Moderno',     'Nuevo lead',  '$2,400', 'May 7', '#5bb6ff'],
  ['Restaurante Sur',  'Activo',      '$980',   'May 6', '#22c55e'],
  ['Clínica Norte',    'Propuesta',   '$3,200', 'May 5', '#ffa845'],
] as const

const STACK = [
  { name: 'Next.js',    bg: 'rgba(255,255,255,0.04)', desc: 'Frontend & API' },
  { name: 'Supabase',   bg: 'rgba(62,207,142,0.06)',  desc: 'Base de datos' },
  { name: 'PostgreSQL', bg: 'rgba(51,103,145,0.08)',  desc: 'SQL & queries' },
  { name: 'Node.js',    bg: 'rgba(104,160,99,0.06)',  desc: 'Backend logic' },
]

const features = [
  { n: '01', t: 'Interfaz diseñada a tu flujo', d: 'Dashboards, gestores de pedidos, portales de clientes o cualquier herramienta interna — construida exactamente para cómo opera tu equipo.' },
  { n: '02', t: 'Multi-usuario y permisos', d: 'Roles diferenciados por área, accesos controlados y login propio. Cada usuario ve y puede hacer solo lo que le corresponde.' },
  { n: '03', t: 'Base de datos a medida', d: 'Modelamos la estructura de datos de tu operación usando Supabase y PostgreSQL. Tu información, organizada y disponible en tiempo real.' },
  { n: '04', t: 'Integraciones con sistemas existentes', d: 'Conectamos con CRM, WhatsApp, Google Sheets, plataformas de facturación, ERP y cualquier sistema que ya uses en el día a día.' },
  { n: '05', t: 'Documentación técnica incluida', d: 'Entregamos manual de uso para tu equipo y documentación técnica para que el sistema pueda ser mantenido o ampliado en el futuro.' },
  { n: '06', t: 'Soporte post-entrega 30 días', d: 'Un mes de soporte incluido para ajustes, dudas y asegurarnos de que el sistema opera bien en producción con datos reales.' },
]

const steps = [
  { n: '01', t: 'Análisis de requerimientos', d: 'Sesiones de levantamiento donde mapeamos tus flujos actuales, los puntos de dolor y lo que necesita el sistema para reemplazarlos. Salimos con un brief técnico claro.' },
  { n: '02', t: 'Diseño y desarrollo', d: 'Construimos en iteraciones cortas con demos parciales para que podás ver el avance y ajustar antes de que esté terminado. Stack: Next.js, Supabase, Node.' },
  { n: '03', t: 'Entrega y capacitación', d: 'Entregamos el sistema funcionando, hacemos una sesión de capacitación con tu equipo y dejamos toda la documentación lista para operar desde el primer día.' },
]

const faqs = [
  { q: '¿Qué tipo de sistemas construyen?', a: 'Gestores de pedidos, CRM propio, paneles de inventario, portales de clientes, sistemas de reservas internas, dashboards de operaciones, herramientas de seguimiento y cualquier sistema que hoy estés haciendo a mano o en hojas de cálculo.' },
  { q: '¿El código es mío después de la entrega?', a: 'Sí. El código fuente es propiedad del cliente desde el primer día. Lo entregamos completo, documentado y sin restricciones.' },
  { q: '¿Cuánto tiempo toma construir un sistema?', a: 'Entre 4 y 12 semanas según la complejidad. Un sistema básico (1-2 módulos, sin integraciones complejas) puede estar listo en un mes. Uno más complejo con múltiples módulos e integraciones puede tomar 2-3 meses.' },
  { q: '¿Por qué el precio es "desde $1,997"?', a: 'El precio varía según el número de módulos, integraciones requeridas y la complejidad funcional. Lo definimos con precisión después de la llamada de diagnóstico donde entendemos el alcance real.' },
]

export default function SistemasInternosPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [activeNav, setActiveNav] = useState(0)

  return (
    <div className="min-h-screen bg-[#060607] text-white antialiased">

      {/* HERO */}
      <section className="grid-bg relative min-h-screen flex flex-col items-center justify-center overflow-hidden text-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_40%,rgba(255,168,69,0.04),transparent)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#060607]" />

        <motion.div
          initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}
          className="relative z-10 max-w-4xl mx-auto px-6 md:px-12 py-32 flex flex-col items-center"
        >
          <div className="inline-flex items-center gap-2 mb-8 px-4 py-2 rounded-full"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/35">Servicio</span>
            <span className="text-white/20 mx-0.5">·</span>
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/55">Sistemas internos</span>
          </div>
          <h1 className="font-bold tracking-tight leading-[0.92] text-white mb-7" style={{ fontSize: 'clamp(2.4rem, 5vw, 4.2rem)' }}>
            Tu operación,<br />
            <em style={{ fontFamily: 'var(--font-instrument-serif)', fontStyle: 'italic', fontWeight: 400, color: 'rgba(255,255,255,0.28)' }}>hecha sistema.</em>
          </h1>
          <p className="text-lg text-white/50 leading-relaxed max-w-xl mb-12">
            Herramientas internas construidas exactamente para tu flujo de trabajo —
            no soluciones genéricas que obligan a tu equipo a adaptarse.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 mb-20">
            <Link href={AGENDAR} className="inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-full bg-[#ffa845] hover:bg-[#f59e0b] text-black font-semibold text-sm transition-all hover:shadow-[0_0_40px_rgba(255,168,69,0.25)] active:scale-[0.98]">
              Agendar llamada gratis <ArrowRight size={15} />
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-8 pb-12 w-full" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            {[['4–12 sem.', 'Tiempo de entrega'], ['100%', 'Código tuyo'], ['30 días', 'Soporte incluido']].map(([v, l]) => (
              <div key={l} className="text-center">
                <p className="text-2xl md:text-3xl font-bold text-white">{v}</p>
                <p className="text-xs text-white/30 mt-1 uppercase tracking-[0.14em]">{l}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* DASHBOARD MOCKUP */}
      <section className="py-28" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="max-w-6xl mx-auto px-6 md:px-12">
          <div className="mb-12">
            <motion.p initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/28 mb-4">
              Lo que construimos
            </motion.p>
            <motion.h2 initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.08 }}
              className="font-bold tracking-tight leading-[0.92] max-w-xl" style={{ fontSize: 'clamp(2rem, 4vw, 3.2rem)' }}>
              Tu sistema, construido<br />
              <em style={{ fontFamily: 'var(--font-instrument-serif)', fontStyle: 'italic', fontWeight: 400, color: 'rgba(255,255,255,0.28)' }}>para vos.</em>
            </motion.h2>
          </div>

          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
            {/* Browser frame */}
            <div className="rounded-[18px] overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 40px 80px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.03)' }}>
              {/* Chrome bar */}
              <div className="flex items-center gap-3 px-4 py-3 bg-[#131316]" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400/50" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400/50" />
                  <div className="w-3 h-3 rounded-full bg-green-400/50" />
                </div>
                <div className="flex-1 mx-2 bg-white/[0.04] rounded-md px-3 py-1.5 text-xs font-mono text-white/22">
                  crm.tuempresa.io/dashboard
                </div>
              </div>

              {/* Dashboard layout */}
              <div className="flex bg-[#0c0c0e]" style={{ minHeight: '380px' }}>
                {/* Sidebar */}
                <div className="w-[190px] shrink-0 bg-[#09090b] flex flex-col p-3 gap-0.5" style={{ borderRight: '1px solid rgba(255,255,255,0.05)' }}>
                  <div className="px-3 py-2 mb-2">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/20">Mi empresa</p>
                  </div>
                  {SIDEBAR_ITEMS.map((item, i) => (
                    <button key={i} onClick={() => setActiveNav(i)}
                      className="px-3 py-2 rounded-lg text-xs font-medium text-left transition-colors cursor-default"
                      style={{
                        background: activeNav === i ? 'rgba(255,168,69,0.1)' : 'transparent',
                        color: activeNav === i ? '#ffa845' : 'rgba(255,255,255,0.3)',
                        border: activeNav === i ? '1px solid rgba(255,168,69,0.18)' : '1px solid transparent',
                      }}>
                      {item}
                    </button>
                  ))}
                </div>

                {/* Main content */}
                <div className="flex-1 p-5 overflow-hidden">
                  {/* Stats */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
                    {STATS.map(([val, label, color]) => (
                      <div key={label} className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <p className="text-lg font-bold leading-none" style={{ color }}>{val}</p>
                        <p className="text-[10px] text-white/25 mt-1.5 leading-tight">{label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Table */}
                  <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div className="flex items-center px-4 py-2.5 gap-3" style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <p className="text-[10px] uppercase tracking-[0.16em] text-white/20 flex-1">Cliente</p>
                      <p className="text-[10px] uppercase tracking-[0.16em] text-white/20 w-24 hidden sm:block">Estado</p>
                      <p className="text-[10px] uppercase tracking-[0.16em] text-white/20 w-16 text-right">Valor</p>
                      <p className="text-[10px] uppercase tracking-[0.16em] text-white/20 w-14 text-right hidden lg:block">Fecha</p>
                    </div>
                    {ROWS.map(([name, status, val, date, dot], ri) => (
                      <div key={ri} className="flex items-center px-4 py-2.5 gap-3 hover:bg-white/[0.02] transition-colors"
                        style={{ borderBottom: ri < ROWS.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none' }}>
                        <p className="flex-1 text-xs text-white/60 font-medium truncate">{name}</p>
                        <div className="hidden sm:flex items-center gap-1.5 w-24">
                          <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: dot }} />
                          <p className="text-xs text-white/30 truncate">{status}</p>
                        </div>
                        <p className="text-xs font-mono text-white/55 w-16 text-right">{val}</p>
                        <p className="text-xs text-white/22 w-14 text-right hidden lg:block">{date}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Tech stack */}
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.15 }}
            className="flex flex-wrap gap-3 mt-6 justify-center">
            <p className="w-full text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-white/20 mb-2">Stack tecnológico</p>
            {STACK.map(s => (
              <div key={s.name} className="px-4 py-2.5 rounded-xl flex items-center gap-2"
                style={{ background: s.bg, border: '1px solid rgba(255,255,255,0.07)' }}>
                <p className="text-sm font-semibold text-white/65">{s.name}</p>
                <p className="text-xs text-white/28">{s.desc}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-28 bg-[#060607]" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="max-w-6xl mx-auto px-6 md:px-12">
          <div className="mb-16">
            <motion.p initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/28 mb-4">Lo que obtenés</motion.p>
            <motion.h2 initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.08 }}
              className="font-bold tracking-tight leading-[0.92]" style={{ fontSize: 'clamp(2rem, 4vw, 3.2rem)' }}>
              Todo incluido.<br />
              <em style={{ fontFamily: 'var(--font-instrument-serif)', fontStyle: 'italic', fontWeight: 400, color: 'rgba(255,255,255,0.28)' }}>Sin sorpresas.</em>
            </motion.h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f, i) => (
              <motion.div key={f.n} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}
                className="relative rounded-card bg-[#131316] border border-white/[0.06] p-8 group hover:border-white/[0.1] transition-all cursor-default overflow-hidden">
                <p className="text-[11px] font-mono text-white/18 mb-7 tracking-[0.16em]">{f.n}</p>
                <h3 className="text-xl font-bold text-white mb-3">{f.t}</h3>
                <p className="text-sm text-white/40 leading-relaxed">{f.d}</p>
                <div className="absolute bottom-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: 'linear-gradient(to right, transparent, rgba(255,168,69,0.2), transparent)' }} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* PROCESS */}
      <section className="py-28" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="max-w-6xl mx-auto px-6 md:px-12">
          <div className="mb-16">
            <motion.p initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/28 mb-4">El proceso</motion.p>
            <motion.h2 initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.08 }}
              className="font-bold tracking-tight leading-[0.92]" style={{ fontSize: 'clamp(2rem, 4vw, 3.2rem)' }}>
              Simple y<br />
              <em style={{ fontFamily: 'var(--font-instrument-serif)', fontStyle: 'italic', fontWeight: 400, color: 'rgba(255,255,255,0.28)' }}>sin vueltas.</em>
            </motion.h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {steps.map((s, i) => (
              <motion.div key={s.n} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="relative rounded-card bg-[#131316] border border-white/[0.06] p-8 overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-[2px]"
                  style={{ background: 'linear-gradient(to right, transparent, rgba(255,168,69,0.22), transparent)' }} />
                <p className="text-6xl font-black text-white/[0.06] mb-6 select-none leading-none">{s.n}</p>
                <h3 className="text-xl font-bold text-white mb-3">{s.t}</h3>
                <p className="text-sm text-white/40 leading-relaxed">{s.d}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-28" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="max-w-3xl mx-auto px-6 md:px-12">
          <motion.p initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/28 mb-4">Preguntas frecuentes</motion.p>
          <motion.h2 initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.08 }}
            className="font-bold tracking-tight leading-[0.92] mb-14" style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)' }}>
            Todo lo que<br />
            <em style={{ fontFamily: 'var(--font-instrument-serif)', fontStyle: 'italic', fontWeight: 400, color: 'rgba(255,255,255,0.28)' }}>querías saber.</em>
          </motion.h2>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
            {faqs.map((faq, i) => (
              <div key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex items-center justify-between gap-6 py-6 w-full text-left">
                  <span className={`text-base font-semibold transition-colors duration-200 ${openFaq === i ? 'text-white' : 'text-white/60 hover:text-white'}`}>{faq.q}</span>
                  <ChevronDown size={16} className={`shrink-0 transition-all duration-300 ${openFaq === i ? 'rotate-180' : ''}`}
                    style={{ color: openFaq === i ? '#ffa845' : 'rgba(255,255,255,0.2)' }} />
                </button>
                <AnimatePresence initial={false}>
                  {openFaq === i && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25, ease: 'easeOut' }} className="overflow-hidden">
                      <p className="pb-6 text-sm text-white/40 leading-relaxed max-w-xl">{faq.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-36 overflow-hidden" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_70%_at_50%_50%,rgba(255,168,69,0.06),transparent)] pointer-events-none" />
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="relative z-10 max-w-3xl mx-auto px-6 md:px-12 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/28 mb-6">¿Listo para empezar?</p>
          <h2 className="font-bold tracking-tight leading-[0.92] text-white mb-8" style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)' }}>
            Contanos<br />
            <em style={{ fontFamily: 'var(--font-instrument-serif)', fontStyle: 'italic', fontWeight: 400, color: 'rgba(255,255,255,0.28)' }}>qué necesitás.</em>
          </h2>
          <p className="text-base text-white/40 leading-relaxed mb-14 max-w-md mx-auto">
            30 minutos para entender tu operación y diseñar la solución correcta. Sin compromiso.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href={AGENDAR} className="inline-flex items-center justify-center gap-2.5 px-10 py-4 rounded-full bg-[#ffa845] hover:bg-[#f59e0b] text-black font-semibold transition-all hover:shadow-[0_0_48px_rgba(255,168,69,0.25)]">
              Agendar llamada gratis <ArrowRight size={16} />
            </Link>
            <Link href="/precios" className="inline-flex items-center justify-center gap-2.5 px-10 py-4 rounded-full font-semibold text-white/45 hover:text-white transition-all"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)' }}>
              Ver todos los servicios
            </Link>
          </div>
        </motion.div>
      </section>

      <ServiciosRelacionados exclude="sistemas-internos" />
    </div>
  )
}
