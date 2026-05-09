'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence, useInView } from 'framer-motion'
import { ArrowRight, ChevronDown } from 'lucide-react'
import { ServiciosRelacionados } from '@/components/servicios-relacionados'

const AGENDAR = '/agendar'

const FLOW = [
  { n: '01', tag: 'TRIGGER',   label: 'Lead nuevo detectado',   sub: 'Formulario · WhatsApp · Email',   icon: '⚡', color: '#5bb6ff', dim: 'rgba(91,182,255,0.09)',  border: 'rgba(91,182,255,0.28)' },
  { n: '02', tag: 'PROCESA',   label: 'IA evalúa y responde',   sub: 'Mensaje personalizado al instante', icon: '🤖', color: '#82c8ff', dim: 'rgba(130,200,255,0.07)', border: 'rgba(130,200,255,0.22)' },
  { n: '03', tag: 'EJECUTA',   label: 'Cita agendada',          sub: 'Sync automático con Calendar',     icon: '📅', color: '#fbbf24', dim: 'rgba(251,191,36,0.08)',  border: 'rgba(251,191,36,0.25)' },
  { n: '04', tag: 'RESULTADO', label: 'CRM actualizado',        sub: 'Equipo notificado · Todo listo',   icon: '✓',  color: '#ffa845', dim: 'rgba(255,168,69,0.10)',  border: 'rgba(255,168,69,0.30)' },
]

const BEFORE_AFTER = [
  { side: 'Sin automatizar', items: ['Responder cada lead manualmente', 'Copiar datos entre herramientas', 'Olvidar dar seguimiento', 'Equipo frustrado con tareas repetitivas'], good: false },
  { side: 'Con Bralto',      items: ['Lead responde solo en segundos', 'Datos fluyen entre sistemas solos', 'Seguimientos automáticos en el momento justo', 'Equipo enfocado en lo que importa'], good: true },
]

const features = [
  { n: '01', t: 'Workflow end-to-end', d: 'Mapeamos y automatizamos el proceso completo — desde el trigger hasta el resultado final, sin pasos manuales.' },
  { n: '02', t: 'Agente de IA a medida', d: 'Configuramos un agente que atiende por WhatsApp, email o internamente según la necesidad del negocio.' },
  { n: '03', t: 'Integraciones con tus herramientas', d: 'Conectamos con CRM, WhatsApp, email, Google Workspace, calendarios, ERP y cualquier API con la que ya trabajés.' },
  { n: '04', t: 'Pruebas y validación', d: 'Antes de entregar, corremos el flujo con casos reales para asegurarnos de que funciona exactamente como diseñamos.' },
  { n: '05', t: 'Documentación y handoff', d: 'Entregamos documentación clara para que tu equipo entienda y pueda mantener lo que construimos sin depender de nosotros.' },
  { n: '06', t: 'Soporte post-entrega 30 días', d: 'Un mes de soporte incluido para resolver dudas, ajustes menores y garantizar que todo opere en producción.' },
]

const steps = [
  { n: '01', t: 'Diagnóstico del proceso', d: 'Entrevistamos a tu equipo, mapeamos el flujo actual y detectamos los cuellos de botella. Definimos el trigger, la lógica y el resultado esperado.' },
  { n: '02', t: 'Construcción e integración', d: 'Desarrollamos el flujo en Make, n8n o código propio según el caso. Integramos con tus herramientas existentes y configuramos los agentes de IA.' },
  { n: '03', t: 'Pruebas, entrega y documentación', d: 'Validamos con datos reales, ajustamos hasta que todo funcione, y entregamos con documentación completa y sesión de capacitación.' },
]

const faqs = [
  { q: '¿Qué procesos se pueden automatizar?', a: 'Seguimiento de leads, onboarding de clientes, notificaciones internas, recordatorios automáticos, reportes, respuestas a consultas frecuentes, reservas y agendamientos, entre muchos otros.' },
  { q: '¿Qué herramientas usan para automatizar?', a: 'Trabajamos con Make (ex-Integromat), n8n y código propio según la complejidad del caso. También usamos las APIs de OpenAI, WhatsApp Business y las herramientas específicas de cada cliente.' },
  { q: '¿Necesito conocimiento técnico para operar la automatización después?', a: 'No. El objetivo es que funcione sola. El soporte de 30 días incluido está para resolver cualquier duda y asegurarnos de que tu equipo se sienta cómodo con lo que construimos.' },
  { q: '¿Las licencias de plataformas como Make están incluidas?', a: 'No. Las licencias de terceros (Make, n8n cloud, APIs de IA) son un costo aparte que el cliente gestiona directamente. Te asesoramos para elegir el plan más eficiente según el volumen de tu operación.' },
]

function WorkflowViz() {
  const [active, setActive] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true })

  useEffect(() => {
    if (!inView) return
    const t = setInterval(() => setActive(p => (p + 1) % FLOW.length), 1400)
    return () => clearInterval(t)
  }, [inView])

  return (
    <div ref={ref} className="relative">
      {/* Steps row */}
      <div className="flex flex-col md:flex-row items-stretch gap-0 md:gap-0">
        {FLOW.map((step, i) => (
          <div key={i} className="flex flex-col md:flex-row items-stretch flex-1 min-w-0">
            {/* Card */}
            <motion.div
              animate={{
                borderColor: active === i ? step.border : 'rgba(255,255,255,0.06)',
                background: active === i ? step.dim : 'rgba(19,19,22,0.6)',
                boxShadow: active === i ? `0 0 30px ${step.color}18` : 'none',
              }}
              transition={{ duration: 0.35 }}
              className="flex-1 rounded-[14px] border p-5 flex flex-col gap-3 mx-1 my-1"
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-black uppercase tracking-[0.22em]"
                  style={{ color: active === i ? step.color : 'rgba(255,255,255,0.2)' }}>
                  {step.tag}
                </span>
                <motion.span
                  animate={{
                    color: active === i ? step.color : 'rgba(255,255,255,0.15)',
                    textShadow: active === i ? `0 0 16px ${step.color}` : 'none',
                  }}
                  className="text-[9px] font-mono font-bold tracking-wider">
                  {step.n}
                </motion.span>
              </div>
              {/* Icon */}
              <motion.div
                animate={{ scale: active === i ? 1.1 : 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="text-2xl select-none"
              >
                {step.icon}
              </motion.div>
              {/* Text */}
              <div>
                <p className="text-sm font-bold text-white leading-snug">{step.label}</p>
                <p className="text-[11px] text-white/35 mt-1 leading-snug">{step.sub}</p>
              </div>
              {/* Active indicator dot */}
              <motion.div
                animate={{ opacity: active === i ? 1 : 0, scale: active === i ? 1 : 0.5 }}
                className="w-1.5 h-1.5 rounded-full mt-auto"
                style={{ background: step.color }}
              />
            </motion.div>

            {/* Connector arrow (desktop) */}
            {i < FLOW.length - 1 && (
              <div className="hidden md:flex items-center justify-center w-6 shrink-0">
                <motion.div
                  animate={{ opacity: active === i ? 1 : 0.18, color: active === i ? FLOW[i + 1].color : 'rgba(255,255,255,0.2)' }}
                  className="text-sm font-bold"
                >→</motion.div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Bottom label */}
      <div className="mt-5 flex items-center justify-center gap-2">
        {FLOW.map((_, i) => (
          <motion.div key={i}
            animate={{ width: active === i ? 20 : 6, opacity: active === i ? 1 : 0.25 }}
            className="h-1 rounded-full bg-white transition-all"
          />
        ))}
      </div>
    </div>
  )
}

export default function AutomatizacionPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

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
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/55">Automatización e IA</span>
          </div>

          <h1 className="font-bold tracking-tight leading-[0.92] text-white mb-7" style={{ fontSize: 'clamp(2.4rem, 5vw, 4.2rem)' }}>
            Tu operación,
            <br />
            <em style={{ fontFamily: 'var(--font-instrument-serif)', fontStyle: 'italic', fontWeight: 400, color: 'rgba(255,255,255,0.28)' }}>sin intervención.</em>
          </h1>
          <p className="text-lg text-white/50 leading-relaxed max-w-xl mb-12">
            Automatizamos los procesos repetitivos de tu negocio para que tu equipo
            se enfoque en lo que realmente importa — y el trabajo siga fluyendo solo.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 mb-20">
            <Link href={AGENDAR} className="inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-full bg-[#ffa845] hover:bg-[#f59e0b] text-black font-semibold text-sm transition-all hover:shadow-[0_0_40px_rgba(255,168,69,0.25)] active:scale-[0.98]">
              Agendar llamada gratis <ArrowRight size={15} />
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-8 pb-12 w-full" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            {[['Make / n8n', 'Plataformas'], ['2–3 sem.', 'Tiempo de entrega'], ['30 días', 'Soporte incluido']].map(([v, l]) => (
              <div key={l} className="text-center">
                <p className="text-2xl md:text-3xl font-bold text-white">{v}</p>
                <p className="text-xs text-white/30 mt-1 uppercase tracking-[0.14em]">{l}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* WORKFLOW VISUALIZATION */}
      <section className="py-28" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="max-w-6xl mx-auto px-6 md:px-12">
          <div className="mb-12">
            <motion.p initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/28 mb-4">
              En acción
            </motion.p>
            <motion.h2 initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.08 }}
              className="font-bold tracking-tight leading-[0.92] max-w-xl" style={{ fontSize: 'clamp(2rem, 4vw, 3.2rem)' }}>
              De un lead a una venta,<br />
              <em style={{ fontFamily: 'var(--font-instrument-serif)', fontStyle: 'italic', fontWeight: 400, color: 'rgba(255,255,255,0.28)' }}>sin tocar nada.</em>
            </motion.h2>
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
            <WorkflowViz />
          </motion.div>

          {/* Before / After */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
            {BEFORE_AFTER.map((col) => (
              <motion.div key={col.side}
                initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                className="rounded-card p-6"
                style={{
                  background: col.good ? 'rgba(255,168,69,0.05)' : 'rgba(255,255,255,0.02)',
                  border: col.good ? '1px solid rgba(255,168,69,0.15)' : '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] mb-4"
                  style={{ color: col.good ? 'rgba(255,168,69,0.6)' : 'rgba(255,255,255,0.25)' }}>
                  {col.side}
                </p>
                <ul className="space-y-2.5">
                  {col.items.map(item => (
                    <li key={item} className="flex items-start gap-2.5 text-sm"
                      style={{ color: col.good ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.35)' }}>
                      <span className="mt-0.5 shrink-0 text-base leading-none">
                        {col.good ? '✓' : '✕'}
                      </span>
                      <span className={col.good ? '' : 'line-through decoration-red-400/30'}>{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
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
              className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/28 mb-4">Cómo funciona</motion.p>
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
            Hablemos de<br />
            <em style={{ fontFamily: 'var(--font-instrument-serif)', fontStyle: 'italic', fontWeight: 400, color: 'rgba(255,255,255,0.28)' }}>tu proceso.</em>
          </h2>
          <p className="text-base text-white/40 leading-relaxed mb-14 max-w-md mx-auto">
            30 minutos para mapear qué se puede automatizar hoy. Sin compromiso, sin tecnicismos.
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

      <ServiciosRelacionados exclude="automatizacion" />
    </div>
  )
}
