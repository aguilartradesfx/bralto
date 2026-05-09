'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence, useInView } from 'framer-motion'
import { ArrowRight, ChevronDown } from 'lucide-react'
import { ServiciosRelacionados } from '@/components/servicios-relacionados'

const AGENDAR = '/agendar'

function useCountUp(end: number, duration = 1200, active: boolean) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (!active) return
    let start: number | null = null
    const step = (ts: number) => {
      if (!start) start = ts
      const p = Math.min((ts - start) / duration, 1)
      setVal(Math.round(p * end))
      if (p < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [active, end, duration])
  return val
}

const AD_EXAMPLES = [
  { platform: 'Meta Ads', type: 'Conversión', headline: '¿Cansado de perder clientes?', body: 'Automatizamos tu negocio para que nunca más pierdas un lead.', cta: 'Saber más →', color: '#5bb6ff', bg: 'rgba(91,182,255,0.06)' },
  { platform: 'Google Ads', type: 'Search', headline: 'automatización negocios costa rica', body: 'Bralto • Automatizamos tu operación completa\nSistemas IA, CRM y workflows a medida', cta: 'bralto.io ↗', color: '#82c8ff', bg: 'rgba(130,200,255,0.05)' },
  { platform: 'Instagram', type: 'Story', headline: '12 horas semanales liberadas', body: 'Así trabaja un negocio automatizado en 2024. Mira cómo lo lograron.', cta: 'Ver caso real ↓', color: '#ffa845', bg: 'rgba(255,168,69,0.06)' },
]

const features = [
  { n: '01', t: 'Campañas en Meta Ads', d: 'Configuración, creativos, segmentación de audiencias y A/B testing. Gestionamos todo desde la cuenta de anuncios hasta la optimización continua.' },
  { n: '02', t: 'Google Ads', d: 'Campañas de Search y Display con palabras clave seleccionadas, anuncios de texto y visuales. Capturamos demanda activa y generamos presencia de marca.' },
  { n: '03', t: 'Creativos y copy para anuncios', d: 'Diseñamos las piezas visuales y escribimos el copy de cada anuncio. Nada se lanza sin estar optimizado para convertir.' },
  { n: '04', t: 'Segmentación y audiencias', d: 'Definimos audiencias por comportamiento, intereses, ubicación y datos demográficos. También construimos audiencias similares desde tu base de clientes.' },
  { n: '05', t: 'Optimización continua', d: 'Revisamos el rendimiento mínimo dos veces por semana y ajustamos pujas, creativos y segmentaciones para maximizar el retorno.' },
  { n: '06', t: 'Reportes de resultados', d: 'Reportes semanales con las métricas que importan: CPC, ROAS, leads generados, costo por conversión y evolución de la inversión.' },
]

const steps = [
  { n: '01', t: 'Diagnóstico y estrategia', d: 'Analizamos tu negocio, competencia y audiencia objetivo. Definimos los objetivos de campaña, el presupuesto inicial recomendado y la plataforma más efectiva para tu caso.' },
  { n: '02', t: 'Creación y lanzamiento', d: 'Producimos los creativos, configuramos el pixel/tags de seguimiento, estructuramos las campañas y las lanzamos con los primeros sets de anuncios.' },
  { n: '03', t: 'Seguimiento y optimización', d: 'Monitoreamos el rendimiento diariamente, hacemos ajustes dos veces por semana y entregamos reporte semanal con los resultados y próximos pasos.' },
]

const faqs = [
  { q: '¿El presupuesto de pauta está incluido?', a: 'No. Bralto cobra un fee mensual de gestión y estrategia. El presupuesto de anuncios lo manejás vos directamente desde tu cuenta de Meta o Google — así tenés control total sobre lo que gastás.' },
  { q: '¿Qué plataformas cubren?', a: 'Principalmente Meta (Facebook e Instagram) y Google (Search y Display). Para ciertos negocios también gestionamos TikTok Ads o LinkedIn Ads según donde esté la audiencia más relevante.' },
  { q: '¿Cuánto tiempo tarda en ver resultados?', a: 'Las primeras 2-3 semanas son de aprendizaje del algoritmo. Entre la semana 4 y 8 empezamos a ver los primeros resultados sólidos. Para resultados consistentes y escalables, lo ideal es evaluar con 3 meses de datos.' },
  { q: '¿Qué pasa si los resultados no son los esperados?', a: 'Ajustamos la estrategia con base en los datos. Revisamos creativos, audiencias y estructuras de campaña. Nuestro trabajo es optimizar continuamente — no hay garantía de ROAS específico porque depende de muchas variables del mercado, pero sí hay compromiso de mejora constante.' },
]

function MetricsDashboard() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true })

  const roas = useCountUp(42, 1400, inView)
  const leads = useCountUp(234, 1200, inView)
  const cpc = useCountUp(180, 1000, inView)
  const reach = useCountUp(48200, 1600, inView)

  const BARS = [
    { label: 'Sem 1', val: 38 },
    { label: 'Sem 2', val: 54 },
    { label: 'Sem 3', val: 72 },
    { label: 'Sem 4', val: 91 },
    { label: 'Sem 5', val: 85 },
    { label: 'Sem 6', val: 100 },
    { label: 'Sem 7', val: 96 },
    { label: 'Sem 8', val: 100 },
  ]

  return (
    <div ref={ref} className="rounded-[18px] overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 32px 64px rgba(0,0,0,0.4)' }}>
      {/* Header bar */}
      <div className="flex items-center justify-between px-5 py-3.5 bg-[#131316]" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.6)]" />
          <p className="text-xs font-semibold text-white/55">Campaña activa — Mes 2</p>
        </div>
        <p className="text-[10px] text-white/25 font-mono">Últ. actualización: hace 2 min</p>
      </div>

      <div className="p-5 bg-[#0d0d10]">
        {/* Metric cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'ROAS', raw: roas, display: `${(roas / 10).toFixed(1)}×`, color: '#ffa845', good: true },
            { label: 'Leads generados', raw: leads, display: leads.toLocaleString(), color: '#5bb6ff', good: true },
            { label: 'CPC promedio', raw: cpc, display: `$${(cpc / 100).toFixed(2)}`, color: '#82c8ff', good: false },
            { label: 'Alcance total', raw: reach, display: `${(reach / 1000).toFixed(1)}k`, color: '#fbbf24', good: true },
          ].map(m => (
            <div key={m.label} className="rounded-[14px] p-4 relative overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              {m.good && <div className="absolute top-0 left-0 right-0 h-[2px]"
                style={{ background: `linear-gradient(to right, transparent, ${m.color}30, transparent)` }} />}
              <p className="text-2xl font-black leading-none" style={{ color: m.color }}>{m.display}</p>
              <p className="text-[10px] text-white/28 mt-2 uppercase tracking-[0.14em]">{m.label}</p>
            </div>
          ))}
        </div>

        {/* Bar chart */}
        <div className="rounded-[14px] p-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/25 mb-4">Evolución de leads por semana</p>
          <div className="flex items-end gap-2 h-[80px]">
            {BARS.map((b, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <motion.div
                  initial={{ height: 0 }}
                  whileInView={{ height: `${b.val}%` }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08, duration: 0.6, ease: 'easeOut' }}
                  className="w-full rounded-sm"
                  style={{
                    background: i === BARS.length - 1 || i === BARS.length - 2
                      ? 'linear-gradient(to top, #ffa845, #ffd085)'
                      : 'rgba(91,182,255,0.25)',
                    minHeight: 4,
                  }}
                />
                <p className="text-[8px] text-white/20 hidden sm:block">{b.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CampanasPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [activeAd, setActiveAd] = useState(0)

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
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/55">Campañas publicitarias</span>
          </div>
          <h1 className="font-bold tracking-tight leading-[0.92] text-white mb-7" style={{ fontSize: 'clamp(2.4rem, 5vw, 4.2rem)' }}>
            Anuncios que<br />
            <em style={{ fontFamily: 'var(--font-instrument-serif)', fontStyle: 'italic', fontWeight: 400, color: 'rgba(255,255,255,0.28)' }}>convierten.</em>
          </h1>
          <p className="text-lg text-white/50 leading-relaxed max-w-xl mb-12">
            Gestionamos tus campañas en Meta y Google de principio a fin —
            desde la estrategia hasta la optimización diaria.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 mb-20">
            <Link href={AGENDAR} className="inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-full bg-[#ffa845] hover:bg-[#f59e0b] text-black font-semibold text-sm transition-all hover:shadow-[0_0_40px_rgba(255,168,69,0.25)] active:scale-[0.98]">
              Agendar llamada gratis <ArrowRight size={15} />
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-8 pb-12 w-full" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            {[['Meta + Google', 'Plataformas'], ['2×/semana', 'Optimización'], ['Semanal', 'Reporte']].map(([v, l]) => (
              <div key={l} className="text-center">
                <p className="text-2xl md:text-3xl font-bold text-white">{v}</p>
                <p className="text-xs text-white/30 mt-1 uppercase tracking-[0.14em]">{l}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* METRICS DASHBOARD */}
      <section className="py-28" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="max-w-6xl mx-auto px-6 md:px-12">
          <div className="mb-12">
            <motion.p initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/28 mb-4">Resultados reales</motion.p>
            <motion.h2 initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.08 }}
              className="font-bold tracking-tight leading-[0.92] max-w-xl" style={{ fontSize: 'clamp(2rem, 4vw, 3.2rem)' }}>
              Lo que ves cuando<br />
              <em style={{ fontFamily: 'var(--font-instrument-serif)', fontStyle: 'italic', fontWeight: 400, color: 'rgba(255,255,255,0.28)' }}>la campaña funciona.</em>
            </motion.h2>
          </div>

          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
            <MetricsDashboard />
          </motion.div>

          {/* Ad examples */}
          <div className="mt-10">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/20 mb-4 text-center">Ejemplos de formatos</p>
            <div className="flex gap-2 justify-center mb-5">
              {AD_EXAMPLES.map((ad, i) => (
                <button key={i} onClick={() => setActiveAd(i)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                  style={activeAd === i
                    ? { background: ad.bg, border: `1px solid ${ad.color}40`, color: ad.color }
                    : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.35)' }}>
                  {ad.platform}
                </button>
              ))}
            </div>
            <AnimatePresence mode="wait">
              <motion.div key={activeAd}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="max-w-sm mx-auto rounded-[16px] p-5"
                style={{ background: AD_EXAMPLES[activeAd].bg, border: `1px solid ${AD_EXAMPLES[activeAd].color}28` }}>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[9px] font-bold uppercase tracking-[0.2em]" style={{ color: AD_EXAMPLES[activeAd].color }}>
                    {AD_EXAMPLES[activeAd].platform} · {AD_EXAMPLES[activeAd].type}
                  </p>
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: AD_EXAMPLES[activeAd].color }} />
                </div>
                <p className="text-sm font-bold text-white mb-2">{AD_EXAMPLES[activeAd].headline}</p>
                <p className="text-xs text-white/40 leading-relaxed mb-3 whitespace-pre-line">{AD_EXAMPLES[activeAd].body}</p>
                <p className="text-xs font-semibold" style={{ color: AD_EXAMPLES[activeAd].color }}>{AD_EXAMPLES[activeAd].cta}</p>
              </motion.div>
            </AnimatePresence>
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
            <em style={{ fontFamily: 'var(--font-instrument-serif)', fontStyle: 'italic', fontWeight: 400, color: 'rgba(255,255,255,0.28)' }}>tus campañas.</em>
          </h2>
          <p className="text-base text-white/40 leading-relaxed mb-14 max-w-md mx-auto">
            30 minutos para entender tus objetivos y proponerte una estrategia concreta. Sin compromiso.
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

      <ServiciosRelacionados exclude="campanas" />
    </div>
  )
}
