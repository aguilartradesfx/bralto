'use client'
import { useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence, useInView } from 'framer-motion'
import { ArrowLeft, ArrowRight, ArrowUpRight, ChevronDown } from 'lucide-react'
import { useLocale } from 'next-intl'
import { clients } from '@/app/servicios/sitios-web/clients'
import { ServiciosRelacionados } from '@/components/servicios-relacionados'

const SCORES = [
  { label: 'Performance', value: 100, color: '#4ade80' },
  { label: 'SEO', value: 98, color: '#4ade80' },
  { label: 'Best Practices', value: 100, color: '#4ade80' },
]
const CIRC = 2 * Math.PI * 40

const CONTENT = {
  es: {
    badge: 'Sitios web profesionales',
    headline: 'Tu mejor vendedor,',
    headlineItalic: 'online 24/7.',
    sub: 'Diseño a medida, SEO incluido y entrega en tiempo récord — para que tu presencia online trabaje mientras vos descansás.',
    cta: 'Agendar llamada gratis',
    back: 'Servicios',
    stats: [['4+', 'Proyectos entregados'], ['SEO', 'Incluido'], ['≤10 días', 'Tiempo de entrega']] as [string, string][],
    projectsLabel: 'Proyectos realizados',
    projectsHeadline: 'El trabajo',
    projectsItalic: 'habla solo.',
    projectsDesc: 'Hacé clic en cualquier proyecto para ver la historia completa y la galería de imágenes.',
    lighthouseLabel: 'Rendimiento que se mide',
    lighthouseHeadline: 'Sitios que',
    lighthouseItalic: 'cargan rápido.',
    lighthouseDesc: 'Google prioriza los sitios veloces. Cada décima de segundo que tardás en cargar es tráfico que perdés. Entregamos sitios con Lighthouse 100 en Performance — medible, verificable, sin excusas.',
    lighthouseStats: [
      { v: '< 1s', l: 'Time to interactive' },
      { v: '100', l: 'Performance' },
      { v: '98+', l: 'SEO score' },
    ],
    lighthousePassText: 'All criteria meet Google standards',
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
    ctaHeadline: 'Hablemos',
    ctaItalic: 'de tu proyecto.',
    ctaSub: '30 minutos, sin compromiso, sin presión. Entendemos lo que necesitás y te damos una propuesta concreta.',
    ctaBtn: 'Agendar llamada gratis',
    ctaBack: 'Ver todos los servicios',
    features: [
      { n: '01', t: 'Diseño a medida', d: 'Interfaz construida sobre tu identidad de marca — nunca plantillas genéricas.' },
      { n: '02', t: 'Hasta 8 páginas', d: 'Inicio, servicios, nosotros, contacto y más. Cada página pensada para convertir.' },
      { n: '03', t: 'SEO técnico', d: 'Estructura semántica, velocidad, meta tags y sitemap para posicionar desde el día uno.' },
      { n: '04', t: 'Captura de leads', d: 'Formularios directos a tu correo, WhatsApp o CRM sin fricciones.' },
      { n: '05', t: 'Integraciones', d: 'Conectamos con las herramientas que ya usás sin procesos intermedios.' },
      { n: '06', t: 'Entrega rápida', d: 'La mayoría de proyectos listos en 5–10 días hábiles desde el briefing.' },
    ],
    steps: [
      { n: '01', t: 'Diagnóstico', d: 'Entendemos tu negocio, objetivos y mensaje. Definimos estructura y tono.' },
      { n: '02', t: 'Construcción', d: 'Diseño + desarrollo + SEO + integraciones. Avances en tiempo real.' },
      { n: '03', t: 'Entrega', d: 'Sitio funcionando. Correcciones incluidas hasta que estés conforme al 100%.' },
    ],
    faqs: [
      { q: '¿Hosting y dominio incluidos?', a: 'No. El sitio se entrega listo para deployar donde prefieras. Te asesoramos sin costo adicional.' },
      { q: '¿Cuánto tarda la entrega?', a: '5 a 10 días hábiles según complejidad y velocidad de entrega del material de tu parte.' },
      { q: '¿Puedo pedir cambios después?', a: 'Una ronda de correcciones incluida post-entrega. Cambios adicionales se cotizan por separado.' },
      { q: '¿Ya tengo sitio, solo quiero mejorarlo?', a: 'Hacemos una auditoría y te proponemos mejoras. Lo cotizamos según el alcance.' },
    ],
  },
  en: {
    badge: 'Professional websites',
    headline: 'Your best salesperson,',
    headlineItalic: 'online 24/7.',
    sub: 'Custom design, SEO included, and delivered fast — so your online presence works while you sleep.',
    cta: 'Book a free call',
    back: 'Services',
    stats: [['4+', 'Projects delivered'], ['SEO', 'Included'], ['≤10 days', 'Delivery time']] as [string, string][],
    projectsLabel: 'Work we\'ve done',
    projectsHeadline: 'The work',
    projectsItalic: 'speaks for itself.',
    projectsDesc: 'Click any project to see the full story and image gallery.',
    lighthouseLabel: 'Performance you can measure',
    lighthouseHeadline: 'Sites that',
    lighthouseItalic: 'load fast.',
    lighthouseDesc: "Google prioritizes fast sites. Every tenth of a second you take to load is traffic you lose. We deliver sites with Lighthouse 100 on Performance — measurable, verifiable, no excuses.",
    lighthouseStats: [
      { v: '< 1s', l: 'Time to interactive' },
      { v: '100', l: 'Performance' },
      { v: '98+', l: 'SEO score' },
    ],
    lighthousePassText: 'All criteria meet Google standards',
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
    ctaItalic: 'your project.',
    ctaSub: '30 minutes, no commitment, no pressure. We understand what you need and give you a concrete proposal.',
    ctaBtn: 'Book a free call',
    ctaBack: 'See all services',
    features: [
      { n: '01', t: 'Custom design', d: 'Interface built on your brand identity — never generic templates.' },
      { n: '02', t: 'Up to 8 pages', d: 'Home, services, about, contact, and more. Every page designed to convert.' },
      { n: '03', t: 'Technical SEO', d: 'Semantic structure, speed, meta tags, and sitemap so you rank from day one.' },
      { n: '04', t: 'Lead capture', d: 'Forms that go straight to your email, WhatsApp, or CRM without friction.' },
      { n: '05', t: 'Integrations', d: 'We connect with the tools you already use without extra steps in between.' },
      { n: '06', t: 'Fast delivery', d: 'Most projects ready in 5–10 business days from the briefing.' },
    ],
    steps: [
      { n: '01', t: 'Discovery', d: 'We understand your business, goals, and message. We define structure and tone.' },
      { n: '02', t: 'Build', d: 'Design + development + SEO + integrations. Real-time progress updates.' },
      { n: '03', t: 'Delivery', d: 'Live site. Revisions included until you\'re 100% happy.' },
    ],
    faqs: [
      { q: 'Are hosting and domain included?', a: "No. The site is delivered ready to deploy wherever you prefer. We advise at no extra cost." },
      { q: 'How long does delivery take?', a: '5 to 10 business days depending on complexity and how quickly you provide materials.' },
      { q: 'Can I request changes after delivery?', a: 'One round of revisions included post-delivery. Additional changes are quoted separately.' },
      { q: 'I already have a site, I just want to improve it.', a: "We run an audit and propose improvements. We quote it based on the scope." },
    ],
  },
}

function LighthouseViz({ passText }: { passText: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <div ref={ref} className="rounded-card overflow-hidden" style={{ background: '#0d0d0f', border: '1px solid rgba(255,255,255,0.07)' }}>
      <div className="flex items-center gap-3 px-5 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#111113' }}>
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
          <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
          <div className="w-3 h-3 rounded-full bg-[#28c840]" />
        </div>
        <div className="flex-1 flex items-center gap-2 rounded-md px-3 py-1.5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <span className="text-[11px] text-white/25">🔒</span>
          <span className="text-[11px] text-white/35 font-mono">tuempresa.com</span>
        </div>
        <span className="text-[10px] text-white/20 font-mono hidden sm:block">Lighthouse</span>
      </div>

      <div className="p-6 sm:p-8">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/20 mb-8 text-center">
          Lighthouse audit — tuempresa.com
        </p>
        <div className="flex justify-around items-center gap-4">
          {SCORES.map((s, i) => (
            <div key={s.label} className="flex flex-col items-center gap-3">
              <div className="relative w-[90px] h-[90px] sm:w-[110px] sm:h-[110px]">
                <svg viewBox="0 0 100 100" width="100%" height="100%">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
                  <g transform="rotate(-90 50 50)">
                    <motion.circle
                      cx="50" cy="50" r="40"
                      fill="none"
                      stroke={s.color}
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeDasharray={CIRC}
                      initial={{ strokeDashoffset: CIRC }}
                      animate={{ strokeDashoffset: inView ? CIRC * (1 - s.value / 100) : CIRC }}
                      transition={{ duration: 1.4, ease: 'easeOut', delay: 0.3 + i * 0.2 }}
                    />
                  </g>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.span
                    className="text-xl sm:text-2xl font-bold text-white"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: inView ? 1 : 0 }}
                    transition={{ delay: 0.7 + i * 0.2 }}
                  >
                    {s.value}
                  </motion.span>
                </div>
              </div>
              <p className="text-[11px] text-white/35 text-center leading-tight">{s.label}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 flex items-center justify-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#4ade80] shrink-0" />
          <span className="text-[11px] text-white/25 text-center">{passText}</span>
        </div>
      </div>
    </div>
  )
}

export default function SitiosWebPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const locale = useLocale()
  const c = CONTENT[locale as 'es' | 'en'] ?? CONTENT.es

  return (
    <div className="min-h-screen bg-[#060607] text-white antialiased">

      {/* HERO */}
      <section className="grid-bg relative min-h-screen flex flex-col items-center justify-center overflow-hidden text-center">
        <div className="absolute inset-0">
          <Image
            src="https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/0e2dbea0-c0a9-413f-a57b-af279633c0df_3840w.jpg"
            alt=""
            fill
            className="object-cover object-center"
            sizes="100vw"
            priority
          />
        </div>
        <div className="absolute inset-0 bg-[#060607]/65" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#080808]/40 via-transparent to-[#060607]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_50%,rgba(255,168,69,0.04),transparent)]" />

        <Link href={`/${locale}/precios`} className="absolute top-20 left-6 md:left-12 inline-flex items-center gap-2 text-white/40 hover:text-white/70 transition-colors text-sm z-10">
          <ArrowLeft size={13} />
          {c.back}
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}
          className="relative z-10 max-w-4xl mx-auto px-6 md:px-12 py-32 flex flex-col items-center"
        >
          <div className="inline-flex items-center gap-2 mb-8 px-4 py-2 rounded-full"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)' }}>
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

          <div className="grid grid-cols-3 gap-8 pb-12 w-full" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            {c.stats.map(([v, l]) => (
              <div key={l} className="text-center">
                <p className="text-2xl md:text-3xl font-bold text-white">{v}</p>
                <p className="text-xs text-white/30 mt-1 uppercase tracking-[0.14em]">{l}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* PROJECTS */}
      <section className="py-28" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="max-w-6xl mx-auto px-6 md:px-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-14">
            <div>
              <motion.p initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/28 mb-4">{c.projectsLabel}</motion.p>
              <motion.h2 initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.08 }}
                className="font-bold tracking-tight leading-[0.92]" style={{ fontSize: 'clamp(2rem, 4vw, 3.2rem)' }}>
                {c.projectsHeadline}<br />
                <em style={{ fontFamily: 'var(--font-instrument-serif)', fontStyle: 'italic', fontWeight: 400, color: 'rgba(255,255,255,0.28)' }}>{c.projectsItalic}</em>
              </motion.h2>
            </div>
            <p className="text-sm text-white/35 max-w-xs leading-relaxed">{c.projectsDesc}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {clients.map((client, i) => (
              <motion.div key={client.id}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ delay: i * 0.07, duration: 0.4 }}
              >
                <Link
                  href={`/${locale}/servicios/sitios-web/${client.id}`}
                  className="group relative rounded-card overflow-hidden flex flex-col"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <div className="relative h-[200px] overflow-hidden bg-[#131316] shrink-0">
                    <Image
                      src={client.coverImage}
                      alt={client.name}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <div className="absolute top-3 right-3 h-8 w-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300"
                      style={{ background: 'rgba(255,168,69,0.9)' }}>
                      <ArrowUpRight size={13} className="text-black" />
                    </div>
                  </div>
                  <div className="px-5 py-4 flex-1">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/30 mb-1.5">{client.industry}</p>
                    <h3 className="text-base font-bold text-white mb-1.5">{client.name}</h3>
                    <p className="text-xs text-white/35 leading-relaxed line-clamp-2">{client.tagline}</p>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ background: 'linear-gradient(to right, transparent, rgba(255,168,69,0.2), transparent)' }} />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* LIGHTHOUSE */}
      <section className="py-28" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="max-w-6xl mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

            <div>
              <motion.p initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/28 mb-4">{c.lighthouseLabel}</motion.p>
              <motion.h2 initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.08 }}
                className="font-bold tracking-tight leading-[0.92] mb-6" style={{ fontSize: 'clamp(2rem, 4vw, 3.2rem)' }}>
                {c.lighthouseHeadline}<br />
                <em style={{ fontFamily: 'var(--font-instrument-serif)', fontStyle: 'italic', fontWeight: 400, color: 'rgba(255,255,255,0.28)' }}>{c.lighthouseItalic}</em>
              </motion.h2>
              <motion.p initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.14 }}
                className="text-base text-white/40 leading-relaxed mb-10 max-w-md">{c.lighthouseDesc}</motion.p>

              <div className="grid grid-cols-3 gap-3">
                {c.lighthouseStats.map((s, i) => (
                  <motion.div key={s.l}
                    initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                    transition={{ delay: 0.2 + i * 0.08 }}
                    className="rounded-xl p-4 text-center"
                    style={{ background: '#131316', border: '1px solid rgba(255,255,255,0.06)' }}
                  >
                    <p className="text-xl font-bold text-white mb-1">{s.v}</p>
                    <p className="text-[10px] text-white/30 uppercase tracking-[0.12em] leading-tight">{s.l}</p>
                  </motion.div>
                ))}
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <LighthouseViz passText={c.lighthousePassText} />
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

      <ServiciosRelacionados exclude="sitios-web" />
    </div>
  )
}
