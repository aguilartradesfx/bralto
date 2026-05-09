'use client'
import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ArrowRight, ChevronDown } from 'lucide-react'
import { useLocale } from 'next-intl'
import { ServiciosRelacionados } from '@/components/servicios-relacionados'

const PLATFORM_COLORS: Record<string, string> = {
  IG: '#e1306c',
  TT: '#ff0050',
  FB: '#1877f2',
}

const MAYO_POSTS: Record<number, string[]> = {
  1:  ['IG'],
  5:  ['TT'],
  8:  ['IG', 'FB'],
  12: ['TT'],
  14: ['IG'],
  15: ['FB'],
  19: ['TT', 'IG'],
  22: ['IG'],
  26: ['TT'],
  28: ['FB'],
  29: ['IG'],
}

const CONTENT = {
  es: {
    badge: 'Producción de contenido',
    headline: 'Contenido que vende,',
    headlineItalic: 'mes a mes.',
    sub: 'Producimos, editamos y publicamos contenido profesional para tus redes sociales — sin que tengas que preocuparte por nada.',
    cta: 'Agendar llamada gratis',
    back: 'Servicios',
    stats: [['6–12', 'Videos al mes'], ['Stories', 'Incluidas'], ['100%', 'Gestionado']] as [string, string][],
    calSectionLabel: 'Tu mes de contenido, planeado',
    calHeadline: 'Siempre sabés',
    calItalic: 'qué se publica.',
    calDesc: 'Cada mes recibís el calendario completo con los posts programados por plataforma. Aprobás antes de publicar. Sin sorpresas, sin improvisación de último minuto.',
    weekdays: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
    monthLabel: 'Mayo 2026',
    postsLabel: '11 posts planificados',
    platforms: [
      { key: 'IG', label: 'Instagram', desc: 'Reels, carruseles y stories' },
      { key: 'TT', label: 'TikTok', desc: 'Videos cortos con tendencias' },
      { key: 'FB', label: 'Facebook', desc: 'Posts, videos y alcance orgánico' },
    ],
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
    ctaItalic: 'tu contenido.',
    ctaSub: '30 minutos para entender tu marca y diseñar una estrategia que tenga sentido para tu negocio.',
    ctaBtn: 'Agendar llamada gratis',
    ctaBack: 'Ver todos los servicios',
    features: [
      { n: '01', t: 'Videos cortos y Reels', d: 'Producción y edición de contenido vertical optimizado para Instagram, TikTok y Facebook. Entregamos listos para publicar.' },
      { n: '02', t: 'Stories y contenido diario', d: 'Diseño y producción de stories que mantienen presencia activa y llevan tráfico a tu perfil y sitio web.' },
      { n: '03', t: 'Estrategia editorial', d: 'Definimos pilares de contenido, tono de voz y objetivos de marca. Todo lo que publicamos tiene un propósito claro.' },
      { n: '04', t: 'Calendario de contenido', d: 'Planificación mensual anticipada para que siempre sepás qué se publica, cuándo y por qué. Sin improvisación.' },
      { n: '05', t: 'Gestión y publicación', d: 'Publicamos en tu nombre según el calendario acordado. Vos solo aprobás las piezas antes de que salgan.' },
      { n: '06', t: 'Reporte mensual de resultados', d: 'Revisión de métricas clave: alcance, engagement, crecimiento de cuenta y ajustes para el siguiente mes.' },
    ],
    steps: [
      { n: '01', t: 'Sesión de estrategia', d: 'Hacemos un briefing de marca, analizamos tu cuenta y la competencia, y definimos los pilares de contenido, tono de voz y objetivos del primer mes.' },
      { n: '02', t: 'Producción mensual', d: 'Grabamos y/o editamos las piezas del mes según el plan. Cada pieza pasa por revisión antes de ser publicada.' },
      { n: '03', t: 'Publicación y optimización', d: 'Publicamos según el calendario, monitoreamos el rendimiento y ajustamos la estrategia del mes siguiente con base en los datos.' },
    ],
    faqs: [
      { q: '¿Ustedes graban o solo editan?', a: 'Depende del plan y la ubicación. En la mayoría de los casos trabajamos con material que el cliente graba o nos envía. Para clientes en zona de cobertura, la producción en sitio se puede incluir o cotizar aparte.' },
      { q: '¿El servicio incluye la gestión de redes?', a: 'Sí. Publicamos en tu nombre según el calendario aprobado. Vos solo revisás y aprobás las piezas antes de que salgan — el resto lo manejamos nosotros.' },
      { q: '¿Qué plataformas cubren?', a: 'Instagram, TikTok, Facebook y YouTube Shorts. La estrategia se adapta según dónde está tu audiencia y cuáles plataformas generan más resultado para tu tipo de negocio.' },
      { q: '¿Puedo cambiar de plan?', a: 'Sí, con 15 días de anticipación antes del siguiente ciclo mensual. Sin penalidades.' },
    ],
  },
  en: {
    badge: 'Content Production',
    headline: 'Content that sells,',
    headlineItalic: 'every month.',
    sub: "We produce, edit, and publish professional content for your social media — so you don't have to worry about a thing.",
    cta: 'Book a free call',
    back: 'Services',
    stats: [['6–12', 'Videos per month'], ['Stories', 'Included'], ['100%', 'Managed']] as [string, string][],
    calSectionLabel: 'Your month of content, planned',
    calHeadline: 'You always know',
    calItalic: "what's going live.",
    calDesc: "Every month you get the full content calendar with posts scheduled by platform. You approve before anything goes live. No surprises, no last-minute scrambling.",
    weekdays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    monthLabel: 'May 2026',
    postsLabel: '11 posts scheduled',
    platforms: [
      { key: 'IG', label: 'Instagram', desc: 'Reels, carousels and stories' },
      { key: 'TT', label: 'TikTok', desc: 'Short videos with trending sounds' },
      { key: 'FB', label: 'Facebook', desc: 'Posts, videos and organic reach' },
    ],
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
    ctaItalic: 'your content.',
    ctaSub: '30 minutes to understand your brand and build a strategy that actually makes sense for your business.',
    ctaBtn: 'Book a free call',
    ctaBack: 'See all services',
    features: [
      { n: '01', t: 'Short videos & Reels', d: 'Production and editing of vertical content optimized for Instagram, TikTok, and Facebook. Delivered ready to post.' },
      { n: '02', t: 'Stories & daily content', d: 'Design and production of stories that keep your brand top of mind and drive traffic to your profile and website.' },
      { n: '03', t: 'Editorial strategy', d: 'We define content pillars, brand voice, and objectives. Everything we publish has a clear purpose.' },
      { n: '04', t: 'Content calendar', d: 'Monthly planning done in advance so you always know what goes live, when, and why. No improvising.' },
      { n: '05', t: 'Management & publishing', d: 'We publish on your behalf according to the agreed calendar. You just approve the pieces before they go out.' },
      { n: '06', t: 'Monthly results report', d: 'Review of key metrics: reach, engagement, account growth, and adjustments for the following month.' },
    ],
    steps: [
      { n: '01', t: 'Strategy session', d: 'We run a brand briefing, analyze your account and competitors, and define content pillars, brand voice, and goals for the first month.' },
      { n: '02', t: 'Monthly production', d: 'We shoot and/or edit the month\'s content according to the plan. Every piece goes through a review before publishing.' },
      { n: '03', t: 'Publishing & optimization', d: 'We publish on schedule, monitor performance, and adjust next month\'s strategy based on the data.' },
    ],
    faqs: [
      { q: 'Do you film or just edit?', a: "It depends on the plan and location. In most cases we work with footage the client films or sends us. For clients in our coverage area, on-site production can be included or quoted separately." },
      { q: 'Does the service include social media management?', a: 'Yes. We publish on your behalf according to the approved calendar. You just review and approve the pieces before they go live — we handle everything else.' },
      { q: 'Which platforms do you cover?', a: 'Instagram, TikTok, Facebook, and YouTube Shorts. The strategy adapts based on where your audience is and which platforms drive the most results for your type of business.' },
      { q: 'Can I change plans?', a: 'Yes, with 15 days notice before the next monthly cycle. No penalties.' },
    ],
  },
}

function ContentCalendar({ weekdays, monthLabel, postsLabel }: { weekdays: string[]; monthLabel: string; postsLabel: string }) {
  const cells: (number | null)[] = [
    ...Array(4).fill(null),
    ...Array.from({ length: 31 }, (_, i) => i + 1),
  ]

  return (
    <div className="rounded-card overflow-hidden" style={{ background: '#0d0d0f', border: '1px solid rgba(255,255,255,0.07)' }}>
      <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#111113' }}>
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
        </div>
        <span className="text-[11px] font-medium text-white/35">{monthLabel}</span>
        <span className="text-[10px] text-white/20">{postsLabel}</span>
      </div>

      <div className="p-4 sm:p-5">
        <div className="grid grid-cols-7 mb-2">
          {weekdays.map(d => (
            <div key={d} className="text-center text-[9px] sm:text-[10px] font-semibold uppercase tracking-[0.08em] text-white/20 py-1">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, idx) => {
            const posts = day ? MAYO_POSTS[day] : undefined
            return (
              <div
                key={idx}
                className="rounded-md aspect-square flex flex-col items-center justify-center gap-0.5"
                style={posts ? { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' } : {}}
              >
                {day && (
                  <>
                    <span className="text-[10px] sm:text-[11px] font-medium leading-none" style={{ color: posts ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.18)' }}>
                      {day}
                    </span>
                    {posts && (
                      <div className="flex gap-0.5">
                        {posts.map(p => (
                          <div key={p} className="w-[5px] h-[5px] rounded-full" style={{ background: PLATFORM_COLORS[p] }} />
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )
          })}
        </div>

        <div className="mt-4 pt-3 flex items-center gap-4 justify-center" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          {Object.entries(PLATFORM_COLORS).map(([p, col]) => (
            <div key={p} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ background: col }} />
              <span className="text-[10px] text-white/28">{p === 'IG' ? 'Instagram' : p === 'TT' ? 'TikTok' : 'Facebook'}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function ProduccionContenidoPage() {
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

      {/* CALENDAR */}
      <section className="py-28" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="max-w-6xl mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

            <div>
              <motion.p initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/28 mb-4">
                {c.calSectionLabel}
              </motion.p>
              <motion.h2 initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.08 }}
                className="font-bold tracking-tight leading-[0.92] mb-6" style={{ fontSize: 'clamp(2rem, 4vw, 3.2rem)' }}>
                {c.calHeadline}<br />
                <em style={{ fontFamily: 'var(--font-instrument-serif)', fontStyle: 'italic', fontWeight: 400, color: 'rgba(255,255,255,0.28)' }}>{c.calItalic}</em>
              </motion.h2>
              <motion.p initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.14 }}
                className="text-base text-white/40 leading-relaxed mb-10 max-w-md">
                {c.calDesc}
              </motion.p>

              <div className="flex flex-col gap-3">
                {c.platforms.map((p, i) => (
                  <motion.div key={p.key}
                    initial={{ opacity: 0, x: -12 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                    transition={{ delay: 0.2 + i * 0.08 }}
                    className="flex items-center gap-3 rounded-xl px-4 py-3"
                    style={{ background: '#131316', border: '1px solid rgba(255,255,255,0.06)' }}
                  >
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: PLATFORM_COLORS[p.key] }} />
                    <span className="text-sm font-semibold text-white/70">{p.label}</span>
                    <span className="text-xs text-white/28 ml-1">{p.desc}</span>
                  </motion.div>
                ))}
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <ContentCalendar weekdays={c.weekdays} monthLabel={c.monthLabel} postsLabel={c.postsLabel} />
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

      <ServiciosRelacionados exclude="produccion-contenido" />
    </div>
  )
}
