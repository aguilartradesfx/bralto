'use client'
import { useRef, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence, useInView } from 'framer-motion'
import { ArrowLeft, ArrowRight, ChevronDown, Check } from 'lucide-react'
import { useLocale } from 'next-intl'
import { ServiciosRelacionados } from '@/components/servicios-relacionados'

const CONTENT = {
  es: {
    badge: 'Asesoría de marketing',
    headline: 'Estrategia clara,',
    headlineItalic: 'acciones concretas.',
    sub: 'Para negocios que ya tienen algo construido y quieren crecer con intención — no con tácticas sueltas que no van a ningún lado.',
    cta: 'Agendar llamada gratis',
    back: 'Servicios',
    stats: [['Diagnóstico', 'Incluido'], ['90 días', 'Roadmap'], ['2×/mes', 'Seguimiento']] as [string, string][],
    roadmapLabel: 'Tu hoja de ruta en 90 días',
    roadmapHeadline: 'De la confusión',
    roadmapItalic: 'a la claridad.',
    phases: [
      { num: '01', days: 'Días 1–30',  title: 'Diagnóstico', desc: 'Auditoría completa del negocio, análisis competitivo y definición de la base estratégica.' },
      { num: '02', days: 'Días 31–60', title: 'Estrategia',  desc: 'Documento de posicionamiento, canales prioritarios, mensajes clave y KPIs por fase.' },
      { num: '03', days: 'Días 61–90', title: 'Ejecución',   desc: 'Primeras acciones en marcha, seguimiento semanal y ajuste según los primeros datos.' },
    ],
    checklistLabel: 'Diagnóstico rápido',
    checklistHeadline: '¿Cómo está tu',
    checklistItalic: 'marketing hoy?',
    checklistDesc: 'Marcá todo lo que te suena conocido. Si elegís 3 o más, tenemos algo importante para hablar.',
    checklistItems: [
      'No tengo claro en qué me diferencio de la competencia',
      'No mido el resultado de mis acciones de marketing',
      'No tengo un embudo de conversión definido',
      'Mi mensaje no es consistente en todos los canales',
      'No sé en qué canales debo invertir',
      'No tengo una estrategia de contenido clara',
    ],
    triggerTitle: 'La asesoría es exactamente para esto.',
    triggerBody: (n: number) => `Si reconocés ${n} de estos puntos, ya tenemos por dónde empezar. Una sesión de 30 minutos puede cambiar completamente la dirección.`,
    triggerBtn: 'Agendar ahora',
    featLabel: 'Lo que obtenés',
    featHeadline: 'Todo incluido.',
    featItalic: 'Sin sorpresas.',
    processLabel: 'El proceso',
    processHeadline: 'Simple y',
    processItalic: 'sin vueltas.',
    faqLabel: 'Preguntas frecuentes',
    faqHeadline: 'Todo lo que',
    faqItalic: 'querías saber.',
    ctaLabel: '¿Listo para empezar?',
    ctaHeadline: 'Hablemos de',
    ctaItalic: 'tu estrategia.',
    ctaSub: '30 minutos para entender dónde estás y hacia dónde querés ir. Sin compromiso.',
    ctaBtn: 'Agendar llamada gratis',
    ctaBack: 'Ver todos los servicios',
    features: [
      { n: '01', t: 'Diagnóstico de marca', d: 'Analizamos tu propuesta de valor, posicionamiento actual, competencia directa y audiencia objetivo. Identificamos brechas y oportunidades concretas.' },
      { n: '02', t: 'Plan de marketing a medida', d: 'Definimos canales prioritarios, mensajes clave, presupuesto recomendado y un cronograma de acciones para los próximos 90 días.' },
      { n: '03', t: 'Estrategia de crecimiento', d: 'Diseñamos el embudo de conversión, establecemos KPIs claros y construimos el roadmap para escalar desde donde estás hoy.' },
      { n: '04', t: 'Sesiones de seguimiento', d: 'Dos sesiones mensuales de una hora para revisar métricas, ajustar la estrategia y resolver dudas sobre la ejecución.' },
      { n: '05', t: 'Entregable documentado', d: 'Todo lo que trabajamos queda en un documento de estrategia y una presentación ejecutiva que podés compartir con tu equipo.' },
      { n: '06', t: 'Acceso directo al equipo', d: 'Canal de comunicación directa para consultas rápidas entre sesiones. Sin esperar a la próxima reunión para resolver algo urgente.' },
    ],
    steps: [
      { n: '01', t: 'Diagnóstico inicial', d: 'Completás un formulario de onboarding, tenemos una entrevista estratégica de 60 minutos y revisamos todos tus materiales existentes — sitio, redes, campañas anteriores.' },
      { n: '02', t: 'Construcción de la estrategia', d: 'Entregamos un documento de estrategia completo con posicionamiento, canales, mensajes, roadmap de 90 días y KPIs por fase. Incluye sesión de presentación.' },
      { n: '03', t: 'Acompañamiento y ajuste', d: 'Dos sesiones mensuales para revisar resultados, ajustar la estrategia según los datos y mantenerte enfocado en las acciones de mayor impacto.' },
    ],
    faqs: [
      { q: '¿La asesoría es puntual o continua?', a: 'Ambas. La modalidad puntual incluye diagnóstico + estrategia en un solo entregable. La modalidad retainer es mensual e incluye sesiones de seguimiento y ajuste continuo del plan.' },
      { q: '¿Implementan o solo asesoran?', a: 'Este servicio es de estrategia y asesoría. La ejecución es responsabilidad del cliente o de su equipo. Si necesitás ejecución, podemos complementarlo con otros servicios de Bralto como campañas, contenido o automatización.' },
      { q: '¿Para qué tipo de negocio es este servicio?', a: 'Ideal para negocios con 1-3 años de operación que quieren crecer con una estrategia clara, no solo tácticas sueltas. También para emprendedores que están lanzando y quieren evitar errores costosos desde el inicio.' },
      { q: '¿Cuánto cuesta?', a: 'Depende del formato — sesión puntual o retainer mensual. Hablamos para definir qué se adapta mejor a tu momento y objetivo, y te damos el detalle completo en la llamada.' },
    ],
  },
  en: {
    badge: 'Marketing advisory',
    headline: 'Clear strategy,',
    headlineItalic: 'concrete action.',
    sub: "For businesses that already have something built and want to grow with intention — not with scattered tactics that go nowhere.",
    cta: 'Book a free call',
    back: 'Services',
    stats: [['Diagnosis', 'Included'], ['90 days', 'Roadmap'], ['2×/mo', 'Check-ins']] as [string, string][],
    roadmapLabel: 'Your 90-day roadmap',
    roadmapHeadline: 'From confusion',
    roadmapItalic: 'to clarity.',
    phases: [
      { num: '01', days: 'Days 1–30',  title: 'Diagnosis', desc: 'Full business audit, competitive analysis, and definition of the strategic foundation.' },
      { num: '02', days: 'Days 31–60', title: 'Strategy',  desc: 'Positioning document, priority channels, key messages, and KPIs by phase.' },
      { num: '03', days: 'Days 61–90', title: 'Execution', desc: 'First actions in motion, weekly check-ins, and adjustments based on early data.' },
    ],
    checklistLabel: 'Quick diagnosis',
    checklistHeadline: "How's your",
    checklistItalic: 'marketing today?',
    checklistDesc: 'Check everything that sounds familiar. If you pick 3 or more, we have something important to talk about.',
    checklistItems: [
      "I'm not clear on what sets me apart from competitors",
      "I don't measure the results of my marketing efforts",
      "I don't have a defined conversion funnel",
      "My message isn't consistent across all channels",
      "I don't know which channels to invest in",
      "I don't have a clear content strategy",
    ],
    triggerTitle: 'This is exactly what the advisory is for.',
    triggerBody: (n: number) => `If you checked ${n} of these, we already know where to start. One 30-minute session can completely change your direction.`,
    triggerBtn: 'Book now',
    featLabel: 'What you get',
    featHeadline: 'Everything included.',
    featItalic: 'No surprises.',
    processLabel: 'The process',
    processHeadline: 'Simple and',
    processItalic: 'straightforward.',
    faqLabel: 'FAQ',
    faqHeadline: 'Everything you',
    faqItalic: 'want to know.',
    ctaLabel: 'Ready to get started?',
    ctaHeadline: "Let's talk about",
    ctaItalic: 'your strategy.',
    ctaSub: '30 minutes to understand where you are and where you want to go. No commitment.',
    ctaBtn: 'Book a free call',
    ctaBack: 'See all services',
    features: [
      { n: '01', t: 'Brand diagnosis', d: 'We analyze your value proposition, current positioning, direct competitors, and target audience. We identify gaps and concrete opportunities.' },
      { n: '02', t: 'Custom marketing plan', d: 'We define priority channels, key messages, recommended budget, and an action timeline for the next 90 days.' },
      { n: '03', t: 'Growth strategy', d: 'We design your conversion funnel, set clear KPIs, and build the roadmap to scale from where you are today.' },
      { n: '04', t: 'Follow-up sessions', d: 'Two monthly one-hour sessions to review metrics, adjust strategy, and work through execution questions.' },
      { n: '05', t: 'Documented deliverable', d: 'Everything we work on is captured in a strategy document and an executive presentation you can share with your team.' },
      { n: '06', t: 'Direct team access', d: 'A direct communication channel for quick questions between sessions. No waiting for the next meeting to resolve something urgent.' },
    ],
    steps: [
      { n: '01', t: 'Initial diagnosis', d: 'You fill out an onboarding form, we run a 60-minute strategy interview, and review all your existing materials — website, social, past campaigns.' },
      { n: '02', t: 'Strategy build', d: 'We deliver a complete strategy document with positioning, channels, messages, a 90-day roadmap, and KPIs by phase. Includes a presentation session.' },
      { n: '03', t: 'Ongoing support', d: 'Two monthly sessions to review results, adjust strategy based on data, and keep you focused on the highest-impact actions.' },
    ],
    faqs: [
      { q: 'Is this a one-time or ongoing engagement?', a: "Both. The one-time format includes diagnosis + strategy in a single deliverable. The retainer format is monthly and includes follow-up sessions and continuous plan adjustment." },
      { q: 'Do you implement or just advise?', a: "This service is strategy and advisory. Execution is the client's responsibility or their team's. If you need execution, we can complement it with other Bralto services like campaigns, content, or automation." },
      { q: 'What type of business is this for?', a: "Ideal for businesses with 1–3 years of operation that want to grow with a clear strategy, not just scattered tactics. Also great for founders launching something new who want to avoid costly mistakes from the start." },
      { q: 'How much does it cost?', a: "It depends on the format — one-time session or monthly retainer. We talk to figure out what fits your stage and goals best, and we give you the full breakdown on the call." },
    ],
  },
}

function RoadmapTimeline({ phases }: { phases: typeof CONTENT.es.phases }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <div ref={ref} className="relative">
      <div className="hidden md:block absolute top-[22px] left-[calc(16.67%+16px)] right-[calc(16.67%+16px)] h-px overflow-hidden">
        <motion.div
          className="h-full w-full"
          style={{ background: 'linear-gradient(to right, rgba(255,168,69,0.35), rgba(255,168,69,0.35))' }}
          initial={{ scaleX: 0, transformOrigin: 'left center' }}
          animate={{ scaleX: inView ? 1 : 0 }}
          transition={{ duration: 1.1, ease: 'easeOut', delay: 0.5 }}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-4">
        {phases.map((p, i) => (
          <motion.div
            key={p.num}
            className="flex flex-col items-center text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: inView ? 1 : 0, y: inView ? 0 : 20 }}
            transition={{ delay: 0.15 + i * 0.2, duration: 0.5 }}
          >
            <motion.div
              className="w-11 h-11 rounded-full flex items-center justify-center mb-5 relative z-10"
              style={{ background: '#131316', border: '2px solid rgba(255,168,69,0.35)' }}
              initial={{ scale: 0 }}
              animate={{ scale: inView ? 1 : 0 }}
              transition={{ delay: 0.15 + i * 0.2, type: 'spring', stiffness: 220, damping: 16 }}
            >
              <span className="text-[11px] font-bold text-[#ffa845]">{p.num}</span>
            </motion.div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/25 mb-1.5">{p.days}</p>
            <h3 className="text-lg font-bold text-white mb-2">{p.title}</h3>
            <p className="text-sm text-white/38 leading-relaxed max-w-[200px]">{p.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

function DiagnosticChecklist({ agendar, items, triggerTitle, triggerBody, triggerBtn }: {
  agendar: string
  items: string[]
  triggerTitle: string
  triggerBody: (count: number) => string
  triggerBtn: string
}) {
  const [checked, setChecked] = useState<Set<number>>(new Set())
  const triggered = checked.size >= 3

  const toggle = (i: number) => {
    setChecked(prev => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      return next
    })
  }

  return (
    <div>
      <div className="space-y-2 mb-6">
        {items.map((item, i) => {
          const active = checked.has(i)
          return (
            <button
              key={i}
              onClick={() => toggle(i)}
              className="w-full flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-all duration-200"
              style={{
                background: active ? 'rgba(255,168,69,0.06)' : 'rgba(255,255,255,0.02)',
                border: active ? '1px solid rgba(255,168,69,0.2)' : '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <div
                className="w-5 h-5 rounded-md shrink-0 flex items-center justify-center transition-all duration-200"
                style={{
                  background: active ? 'rgba(255,168,69,0.9)' : 'rgba(255,255,255,0.04)',
                  border: active ? '1px solid transparent' : '1px solid rgba(255,255,255,0.1)',
                }}
              >
                {active && <Check size={11} className="text-black" strokeWidth={3} />}
              </div>
              <span className="text-sm leading-snug transition-colors duration-200" style={{ color: active ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.38)' }}>
                {item}
              </span>
            </button>
          )
        })}
      </div>

      <AnimatePresence>
        {triggered && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.3 }}
            className="rounded-xl p-5"
            style={{ background: 'rgba(255,168,69,0.07)', border: '1px solid rgba(255,168,69,0.2)' }}
          >
            <p className="text-sm font-semibold text-[#ffa845] mb-1">{triggerTitle}</p>
            <p className="text-xs text-white/40 leading-relaxed mb-4">{triggerBody(checked.size)}</p>
            <Link
              href={agendar}
              className="inline-flex items-center gap-2 rounded-full bg-[#ffa845] hover:bg-[#f59e0b] px-5 py-2.5 text-xs font-semibold text-black transition-all"
            >
              {triggerBtn}
              <ArrowRight size={11} />
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function AsesoriaPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const locale = useLocale()
  const c = CONTENT[locale as 'es' | 'en'] ?? CONTENT.es

  return (
    <div className="min-h-screen bg-[#060607] text-white antialiased">

      {/* HERO */}
      <section className="grid-bg relative min-h-screen flex flex-col items-center justify-center overflow-hidden text-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_40%,rgba(255,168,69,0.04),transparent)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#060607]" />

        <Link href={`/${locale}/precios`} className="absolute top-20 left-6 md:left-12 inline-flex items-center gap-2 text-white/40 hover:text-white/70 transition-colors text-sm z-10">
          <ArrowLeft size={13} />
          {c.back}
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}
          className="relative z-10 max-w-4xl mx-auto px-6 md:px-12 py-32 flex flex-col items-center"
        >
          <div className="inline-flex items-center gap-2 mb-8 px-4 py-2 rounded-full"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/35">{locale === 'es' ? 'Servicio' : 'Service'}</span>
            <span className="text-white/20 mx-0.5">·</span>
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/55">{c.badge}</span>
          </div>

          <h1 className="font-bold tracking-tight leading-[0.92] text-white mb-7" style={{ fontSize: 'clamp(2.4rem, 5vw, 4.2rem)' }}>
            {c.headline}<br />
            <em style={{ fontFamily: 'var(--font-instrument-serif)', fontStyle: 'italic', fontWeight: 400, color: 'rgba(255,255,255,0.28)' }}>{c.headlineItalic}</em>
          </h1>

          <p className="text-lg text-white/50 leading-relaxed max-w-xl mb-12">{c.sub}</p>

          <div className="flex flex-col sm:flex-row gap-3 mb-20">
            <Link href={`/${locale}/agendar`} className="inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-full bg-[#ffa845] hover:bg-[#f59e0b] text-black font-semibold text-sm transition-all hover:shadow-[0_0_40px_rgba(255,168,69,0.25)] active:scale-[0.98]">
              {c.cta} <ArrowRight size={15} />
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-8 pb-12 w-full" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            {c.stats.map(([v, l]) => (
              <div key={l} className="text-center">
                <p className="text-2xl md:text-3xl font-bold text-white">{v}</p>
                <p className="text-xs text-white/30 mt-1 uppercase tracking-[0.14em]">{l}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ROADMAP + CHECKLIST */}
      <section className="py-28" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="max-w-6xl mx-auto px-6 md:px-12">

          <div className="mb-20">
            <motion.p initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/28 mb-4">{c.roadmapLabel}</motion.p>
            <motion.h2 initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.08 }}
              className="font-bold tracking-tight leading-[0.92] mb-14" style={{ fontSize: 'clamp(2rem, 4vw, 3.2rem)' }}>
              {c.roadmapHeadline}<br />
              <em style={{ fontFamily: 'var(--font-instrument-serif)', fontStyle: 'italic', fontWeight: 400, color: 'rgba(255,255,255,0.28)' }}>{c.roadmapItalic}</em>
            </motion.h2>
            <RoadmapTimeline phases={c.phases} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">
            <div>
              <motion.p initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/28 mb-4">{c.checklistLabel}</motion.p>
              <motion.h3 initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.08 }}
                className="font-bold tracking-tight leading-[1.1] mb-4" style={{ fontSize: 'clamp(1.6rem, 3vw, 2.4rem)' }}>
                {c.checklistHeadline}<br />
                <em style={{ fontFamily: 'var(--font-instrument-serif)', fontStyle: 'italic', fontWeight: 400, color: 'rgba(255,255,255,0.28)' }}>{c.checklistItalic}</em>
              </motion.h3>
              <motion.p initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.14 }}
                className="text-sm text-white/38 leading-relaxed mb-3">{c.checklistDesc}</motion.p>
            </div>

            <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.12 }}>
              <DiagnosticChecklist
                agendar={`/${locale}/agendar`}
                items={c.checklistItems}
                triggerTitle={c.triggerTitle}
                triggerBody={c.triggerBody}
                triggerBtn={c.triggerBtn}
              />
            </motion.div>
          </div>

        </div>
      </section>

      {/* FEATURES */}
      <section className="py-28 bg-[#060607]" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="max-w-6xl mx-auto px-6 md:px-12">
          <div className="mb-16">
            <motion.p initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/28 mb-4">{c.featLabel}</motion.p>
            <motion.h2 initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.08 }}
              className="font-bold tracking-tight leading-[0.92]" style={{ fontSize: 'clamp(2rem, 4vw, 3.2rem)' }}>
              {c.featHeadline}<br />
              <em style={{ fontFamily: 'var(--font-instrument-serif)', fontStyle: 'italic', fontWeight: 400, color: 'rgba(255,255,255,0.28)' }}>{c.featItalic}</em>
            </motion.h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {c.features.map((f, i) => (
              <motion.div key={f.n}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ delay: i * 0.06, duration: 0.4 }}
                className="relative rounded-card bg-[#131316] border border-white/[0.06] p-8 group hover:border-white/[0.1] transition-all cursor-default overflow-hidden"
              >
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
              className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/28 mb-4">{c.processLabel}</motion.p>
            <motion.h2 initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.08 }}
              className="font-bold tracking-tight leading-[0.92]" style={{ fontSize: 'clamp(2rem, 4vw, 3.2rem)' }}>
              {c.processHeadline}<br />
              <em style={{ fontFamily: 'var(--font-instrument-serif)', fontStyle: 'italic', fontWeight: 400, color: 'rgba(255,255,255,0.28)' }}>{c.processItalic}</em>
            </motion.h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {c.steps.map((s, i) => (
              <motion.div key={s.n}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
                className="relative rounded-card bg-[#131316] border border-white/[0.06] p-8 overflow-hidden"
              >
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
            className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/28 mb-4">{c.faqLabel}</motion.p>
          <motion.h2 initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.08 }}
            className="font-bold tracking-tight leading-[0.92] mb-14" style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)' }}>
            {c.faqHeadline}<br />
            <em style={{ fontFamily: 'var(--font-instrument-serif)', fontStyle: 'italic', fontWeight: 400, color: 'rgba(255,255,255,0.28)' }}>{c.faqItalic}</em>
          </motion.h2>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
            {c.faqs.map((faq, i) => (
              <div key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex items-center justify-between gap-6 py-6 w-full text-left">
                  <span className={`text-base font-semibold transition-colors duration-200 ${openFaq === i ? 'text-white' : 'text-white/60 hover:text-white'}`}>{faq.q}</span>
                  <ChevronDown size={16}
                    className={`shrink-0 transition-all duration-300 ${openFaq === i ? 'rotate-180' : ''}`}
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
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/28 mb-6">{c.ctaLabel}</p>
          <h2 className="font-bold tracking-tight leading-[0.92] text-white mb-8" style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)' }}>
            {c.ctaHeadline}<br />
            <em style={{ fontFamily: 'var(--font-instrument-serif)', fontStyle: 'italic', fontWeight: 400, color: 'rgba(255,255,255,0.28)' }}>{c.ctaItalic}</em>
          </h2>
          <p className="text-base text-white/40 leading-relaxed mb-14 max-w-md mx-auto">{c.ctaSub}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href={`/${locale}/agendar`} className="inline-flex items-center justify-center gap-2.5 px-10 py-4 rounded-full bg-[#ffa845] hover:bg-[#f59e0b] text-black font-semibold transition-all hover:shadow-[0_0_48px_rgba(255,168,69,0.25)]">
              {c.ctaBtn} <ArrowRight size={16} />
            </Link>
            <Link href={`/${locale}/precios`} className="inline-flex items-center justify-center gap-2.5 px-10 py-4 rounded-full font-semibold text-white/45 hover:text-white transition-all"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)' }}>
              {c.ctaBack}
            </Link>
          </div>
        </motion.div>
      </section>

      <ServiciosRelacionados exclude="asesoria" />
    </div>
  )
}
