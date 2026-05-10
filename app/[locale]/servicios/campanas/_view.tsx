'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence, useInView } from 'framer-motion'
import { ArrowRight, ChevronDown } from 'lucide-react'
import { useLocale } from 'next-intl'
import { ServiciosRelacionados } from '@/components/servicios-relacionados'

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

const AD_EXAMPLES_META = [
  { platform: 'Meta Ads', type: 'Conversión', color: '#5bb6ff', bg: 'rgba(91,182,255,0.06)' },
  { platform: 'Google Ads', type: 'Search', color: '#82c8ff', bg: 'rgba(130,200,255,0.05)' },
  { platform: 'Instagram', type: 'Story', color: '#ffa845', bg: 'rgba(255,168,69,0.06)' },
]

const BAR_VALS = [38, 54, 72, 91, 85, 100, 96, 100]

type DashLabels = {
  header: string
  updated: string
  metricLabels: string[]
  chartLabel: string
  barLabels: string[]
}

const CONTENT = {
  es: {
    badge: 'Campañas publicitarias',
    headline: 'Anuncios que',
    headlineItalic: 'convierten.',
    sub: 'Gestionamos tus campañas en Meta y Google de principio a fin — desde la estrategia hasta la optimización diaria.',
    cta: 'Agendar llamada gratis',
    stats: [['Meta + Google', 'Plataformas'], ['2×/semana', 'Optimización'], ['Semanal', 'Reporte']] as [string, string][],
    dash: {
      header: 'Campaña activa — Mes 2',
      updated: 'Últ. actualización: hace 2 min',
      metricLabels: ['ROAS', 'Leads generados', 'CPC promedio', 'Alcance total'],
      chartLabel: 'Evolución de leads por semana',
      barLabels: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5', 'Sem 6', 'Sem 7', 'Sem 8'],
    } as DashLabels,
    adExamplesLabel: 'Ejemplos de formatos',
    adExamples: [
      { headline: '¿Cansado de perder clientes?', body: 'Automatizamos tu negocio para que nunca más pierdas un lead.', cta: 'Saber más →' },
      { headline: 'automatización negocios costa rica', body: 'Bralto • Automatizamos tu operación completa\nSistemas IA, CRM y workflows a medida', cta: 'bralto.io ↗' },
      { headline: '12 horas semanales liberadas', body: 'Así trabaja un negocio automatizado en 2024. Mira cómo lo lograron.', cta: 'Ver caso real ↓' },
    ],
    metricsLabel: 'Resultados reales',
    metricsHeadline: 'Lo que ves cuando',
    metricsItalic: 'la campaña funciona.',
    featLabel: 'Lo que obtenés',
    featHeadline: 'Todo incluido.',
    featItalic: 'Sin sorpresas.',
    processLabel: 'Cómo funciona',
    processHeadline: 'Simple y',
    processItalic: 'sin vueltas.',
    faqLabel: 'Preguntas frecuentes',
    faqHeadline: 'Todo lo que',
    faqItalic: 'querías saber.',
    ctaLabel: '¿Listo para empezar?',
    ctaHeadline: 'Hablemos de',
    ctaItalic: 'tus campañas.',
    ctaSub: '30 minutos para entender tus objetivos y proponerte una estrategia concreta. Sin compromiso.',
    ctaBtn: 'Agendar llamada gratis',
    ctaBack: 'Ver todos los servicios',
    features: [
      { n: '01', t: 'Campañas en Meta Ads', d: 'Configuración, creativos, segmentación de audiencias y A/B testing. Gestionamos todo desde la cuenta de anuncios hasta la optimización continua.' },
      { n: '02', t: 'Google Ads', d: 'Campañas de Search y Display con palabras clave seleccionadas, anuncios de texto y visuales. Capturamos demanda activa y generamos presencia de marca.' },
      { n: '03', t: 'Creativos y copy para anuncios', d: 'Diseñamos las piezas visuales y escribimos el copy de cada anuncio. Nada se lanza sin estar optimizado para convertir.' },
      { n: '04', t: 'Segmentación y audiencias', d: 'Definimos audiencias por comportamiento, intereses, ubicación y datos demográficos. También construimos audiencias similares desde tu base de clientes.' },
      { n: '05', t: 'Optimización continua', d: 'Revisamos el rendimiento mínimo dos veces por semana y ajustamos pujas, creativos y segmentaciones para maximizar el retorno.' },
      { n: '06', t: 'Reportes de resultados', d: 'Reportes semanales con las métricas que importan: CPC, ROAS, leads generados, costo por conversión y evolución de la inversión.' },
    ],
    steps: [
      { n: '01', t: 'Diagnóstico y estrategia', d: 'Analizamos tu negocio, competencia y audiencia objetivo. Definimos los objetivos de campaña, el presupuesto inicial recomendado y la plataforma más efectiva para tu caso.' },
      { n: '02', t: 'Creación y lanzamiento', d: 'Producimos los creativos, configuramos el pixel/tags de seguimiento, estructuramos las campañas y las lanzamos con los primeros sets de anuncios.' },
      { n: '03', t: 'Seguimiento y optimización', d: 'Monitoreamos el rendimiento diariamente, hacemos ajustes dos veces por semana y entregamos reporte semanal con los resultados y próximos pasos.' },
    ],
    faqs: [
      { q: '¿El presupuesto de pauta está incluido?', a: 'No. Bralto cobra un fee mensual de gestión y estrategia. El presupuesto de anuncios lo manejás vos directamente desde tu cuenta de Meta o Google — así tenés control total sobre lo que gastás.' },
      { q: '¿Qué plataformas cubren?', a: 'Principalmente Meta (Facebook e Instagram) y Google (Search y Display). Para ciertos negocios también gestionamos TikTok Ads o LinkedIn Ads según donde esté la audiencia más relevante.' },
      { q: '¿Cuánto tiempo tarda en ver resultados?', a: 'Las primeras 2-3 semanas son de aprendizaje del algoritmo. Entre la semana 4 y 8 empezamos a ver los primeros resultados sólidos. Para resultados consistentes y escalables, lo ideal es evaluar con 3 meses de datos.' },
      { q: '¿Qué pasa si los resultados no son los esperados?', a: 'Ajustamos la estrategia con base en los datos. Revisamos creativos, audiencias y estructuras de campaña. Nuestro trabajo es optimizar continuamente — no hay garantía de ROAS específico porque depende de muchas variables del mercado, pero sí hay compromiso de mejora constante.' },
    ],
  },
  en: {
    badge: 'Paid Advertising',
    headline: 'Ads that',
    headlineItalic: 'actually convert.',
    sub: 'We run your Meta and Google campaigns end to end — from strategy to daily optimization.',
    cta: 'Book a free call',
    stats: [['Meta + Google', 'Platforms'], ['2×/week', 'Optimization'], ['Weekly', 'Reporting']] as [string, string][],
    dash: {
      header: 'Active campaign — Month 2',
      updated: 'Last updated: 2 min ago',
      metricLabels: ['ROAS', 'Leads generated', 'Avg CPC', 'Total reach'],
      chartLabel: 'Weekly lead growth',
      barLabels: ['Wk 1', 'Wk 2', 'Wk 3', 'Wk 4', 'Wk 5', 'Wk 6', 'Wk 7', 'Wk 8'],
    } as DashLabels,
    adExamplesLabel: 'Ad format examples',
    adExamples: [
      { headline: 'Tired of losing leads?', body: 'We automate your business so you never miss a lead again.', cta: 'Learn more →' },
      { headline: 'business automation services', body: 'Bralto • We automate your entire operation\nAI systems, CRM and custom workflows', cta: 'bralto.io ↗' },
      { headline: '12 hours freed up every week', body: 'This is how an automated business runs in 2024. See how they did it.', cta: 'See the story ↓' },
    ],
    metricsLabel: 'Real results',
    metricsHeadline: 'What you see when',
    metricsItalic: 'the campaign works.',
    featLabel: 'What you get',
    featHeadline: 'Everything included.',
    featItalic: 'No surprises.',
    processLabel: 'How it works',
    processHeadline: 'Simple and',
    processItalic: 'straightforward.',
    faqLabel: 'FAQ',
    faqHeadline: 'Everything you',
    faqItalic: 'want to know.',
    ctaLabel: 'Ready to get started?',
    ctaHeadline: "Let's talk about",
    ctaItalic: 'your campaigns.',
    ctaSub: '30 minutes to understand your goals and put together a concrete strategy. No commitment.',
    ctaBtn: 'Book a free call',
    ctaBack: 'See all services',
    features: [
      { n: '01', t: 'Meta Ads campaigns', d: 'Setup, creatives, audience targeting, and A/B testing. We handle everything from the ad account to ongoing optimization.' },
      { n: '02', t: 'Google Ads', d: 'Search and Display campaigns with curated keywords, text and visual ads. We capture active demand and build brand presence.' },
      { n: '03', t: 'Ad creatives & copy', d: 'We design the visuals and write the copy for every ad. Nothing goes live without being optimized to convert.' },
      { n: '04', t: 'Targeting & audiences', d: 'We define audiences by behavior, interests, location, and demographics. We also build lookalike audiences from your customer base.' },
      { n: '05', t: 'Ongoing optimization', d: 'We review performance at least twice a week and adjust bids, creatives, and targeting to maximize your return.' },
      { n: '06', t: 'Results reports', d: 'Weekly reports covering the metrics that matter: CPC, ROAS, leads generated, cost per conversion, and spend trends.' },
    ],
    steps: [
      { n: '01', t: 'Diagnosis & strategy', d: 'We analyze your business, competitors, and target audience. We set campaign goals, a recommended starting budget, and the most effective platform for your case.' },
      { n: '02', t: 'Creation & launch', d: 'We produce the creatives, set up tracking pixels and tags, build the campaign structure, and launch with the first set of ads.' },
      { n: '03', t: 'Tracking & optimization', d: 'We monitor performance daily, make adjustments twice a week, and deliver a weekly report with results and next steps.' },
    ],
    faqs: [
      { q: 'Is ad spend included?', a: "No. Bralto charges a monthly management and strategy fee. You control the ad budget directly from your Meta or Google account — so you always know exactly what you're spending." },
      { q: 'Which platforms do you cover?', a: 'Mainly Meta (Facebook and Instagram) and Google (Search and Display). For certain businesses we also manage TikTok Ads or LinkedIn Ads depending on where the most relevant audience is.' },
      { q: 'How long before I see results?', a: 'The first 2–3 weeks are the algorithm learning phase. Between weeks 4 and 8 we start seeing solid early results. For consistent, scalable performance, 3 months of data is the ideal window to evaluate.' },
      { q: "What if results don't meet expectations?", a: "We adjust strategy based on the data — revisiting creatives, audiences, and campaign structure. Our job is to keep optimizing. There's no guarantee of a specific ROAS since it depends on many market variables, but there is a commitment to constant improvement." },
    ],
  },
}

const METRIC_DISPLAYS = [
  (v: number) => `${(v / 10).toFixed(1)}×`,
  (v: number) => v.toLocaleString(),
  (v: number) => `$${(v / 100).toFixed(2)}`,
  (v: number) => `${(v / 1000).toFixed(1)}k`,
]
const METRIC_COLORS = ['#ffa845', '#5bb6ff', '#82c8ff', '#fbbf24']
const METRIC_GOOD = [true, true, false, true]
const METRIC_ENDS = [42, 234, 180, 48200]
const METRIC_DURATIONS = [1400, 1200, 1000, 1600]

function MetricsDashboard({ labels }: { labels: DashLabels }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true })
  const vals = [
    useCountUp(METRIC_ENDS[0], METRIC_DURATIONS[0], inView),
    useCountUp(METRIC_ENDS[1], METRIC_DURATIONS[1], inView),
    useCountUp(METRIC_ENDS[2], METRIC_DURATIONS[2], inView),
    useCountUp(METRIC_ENDS[3], METRIC_DURATIONS[3], inView),
  ]

  return (
    <div ref={ref} className="rounded-[18px] overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 32px 64px rgba(0,0,0,0.4)' }}>
      <div className="flex items-center justify-between px-5 py-3.5 bg-[#131316]" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.6)]" />
          <p className="text-xs font-semibold text-white/55">{labels.header}</p>
        </div>
        <p className="text-[10px] text-white/25 font-mono">{labels.updated}</p>
      </div>

      <div className="p-5 bg-[#0d0d10]">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {labels.metricLabels.map((label, i) => (
            <div key={label} className="rounded-[14px] p-4 relative overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              {METRIC_GOOD[i] && <div className="absolute top-0 left-0 right-0 h-[2px]"
                style={{ background: `linear-gradient(to right, transparent, ${METRIC_COLORS[i]}30, transparent)` }} />}
              <p className="text-2xl font-black leading-none" style={{ color: METRIC_COLORS[i] }}>{METRIC_DISPLAYS[i](vals[i])}</p>
              <p className="text-[10px] text-white/28 mt-2 uppercase tracking-[0.14em]">{label}</p>
            </div>
          ))}
        </div>

        <div className="rounded-[14px] p-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/25 mb-4">{labels.chartLabel}</p>
          <div className="flex items-end gap-2 h-[80px]">
            {BAR_VALS.map((bv, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <motion.div
                  initial={{ height: 0 }}
                  whileInView={{ height: `${bv}%` }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08, duration: 0.6, ease: 'easeOut' }}
                  className="w-full rounded-sm"
                  style={{
                    background: i >= BAR_VALS.length - 2
                      ? 'linear-gradient(to top, #ffa845, #ffd085)'
                      : 'rgba(91,182,255,0.25)',
                    minHeight: 4,
                  }}
                />
                <p className="text-[8px] text-white/20 hidden sm:block">{labels.barLabels[i]}</p>
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
  const locale = useLocale()
  const c = CONTENT[locale as 'es' | 'en'] ?? CONTENT.es

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

      {/* METRICS DASHBOARD */}
      <section className="py-28" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="max-w-6xl mx-auto px-6 md:px-12">
          <div className="mb-12">
            <motion.p initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/28 mb-4">{c.metricsLabel}</motion.p>
            <motion.h2 initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.08 }}
              className="font-bold tracking-tight leading-[0.92] max-w-xl" style={{ fontSize: 'clamp(2rem, 4vw, 3.2rem)' }}>
              {c.metricsHeadline}<br />
              <em style={{ fontFamily: 'var(--font-instrument-serif)', fontStyle: 'italic', fontWeight: 400, color: 'rgba(255,255,255,0.28)' }}>{c.metricsItalic}</em>
            </motion.h2>
          </div>

          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
            <MetricsDashboard labels={c.dash} />
          </motion.div>

          <div className="mt-10">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/20 mb-4 text-center">{c.adExamplesLabel}</p>
            <div className="flex gap-2 justify-center mb-5">
              {AD_EXAMPLES_META.map((ad, i) => (
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
                style={{ background: AD_EXAMPLES_META[activeAd].bg, border: `1px solid ${AD_EXAMPLES_META[activeAd].color}28` }}>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[9px] font-bold uppercase tracking-[0.2em]" style={{ color: AD_EXAMPLES_META[activeAd].color }}>
                    {AD_EXAMPLES_META[activeAd].platform} · {AD_EXAMPLES_META[activeAd].type}
                  </p>
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: AD_EXAMPLES_META[activeAd].color }} />
                </div>
                <p className="text-sm font-bold text-white mb-2">{c.adExamples[activeAd].headline}</p>
                <p className="text-xs text-white/40 leading-relaxed mb-3 whitespace-pre-line">{c.adExamples[activeAd].body}</p>
                <p className="text-xs font-semibold" style={{ color: AD_EXAMPLES_META[activeAd].color }}>{c.adExamples[activeAd].cta}</p>
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
              className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/28 mb-4">{c.featLabel}</motion.p>
            <motion.h2 initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.08 }}
              className="font-bold tracking-tight leading-[0.92]" style={{ fontSize: 'clamp(2rem, 4vw, 3.2rem)' }}>
              {c.featHeadline}<br />
              <em style={{ fontFamily: 'var(--font-instrument-serif)', fontStyle: 'italic', fontWeight: 400, color: 'rgba(255,255,255,0.28)' }}>{c.featItalic}</em>
            </motion.h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {c.features.map((f, i) => (
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
              className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/28 mb-4">{c.processLabel}</motion.p>
            <motion.h2 initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.08 }}
              className="font-bold tracking-tight leading-[0.92]" style={{ fontSize: 'clamp(2rem, 4vw, 3.2rem)' }}>
              {c.processHeadline}<br />
              <em style={{ fontFamily: 'var(--font-instrument-serif)', fontStyle: 'italic', fontWeight: 400, color: 'rgba(255,255,255,0.28)' }}>{c.processItalic}</em>
            </motion.h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {c.steps.map((s, i) => (
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

      <ServiciosRelacionados exclude="campanas" />
    </div>
  )
}
