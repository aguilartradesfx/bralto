import Link from 'next/link'
import { ArrowLeft, ArrowRight, Check, Globe, Palette, Search, FormInput, Zap, ChevronDown } from 'lucide-react'

const AGENDAR = '/agendar'

// ── Qué incluye ────────────────────────────────────────────────────────────────
const includes = [
  { icon: Palette, title: 'Diseño a medida', desc: 'Interfaz diseñada en base a tu identidad de marca y objetivos de negocio.' },
  { icon: Globe, title: 'Hasta 8 páginas', desc: 'Inicio, servicios, sobre nosotros, contacto y más — todo lo que necesitás.' },
  { icon: Search, title: 'SEO técnico incluido', desc: 'Estructura semántica, meta tags, velocidad y todo lo necesario para posicionar.' },
  { icon: FormInput, title: 'Formularios y CTA', desc: 'Formularios de contacto, cotización o registro según lo que necesite tu negocio.' },
  { icon: Zap, title: 'Integración básica', desc: 'Conexión con tu correo, WhatsApp o CRM para que los leads lleguen directo.' },
]

// ── Cómo funciona ──────────────────────────────────────────────────────────────
const steps = [
  { num: '01', title: 'Llamada de diagnóstico', desc: 'Entendemos tu negocio, tus objetivos y lo que querés comunicar. Definimos la estructura y el tono.' },
  { num: '02', title: 'Diseño y desarrollo', desc: 'Creamos el sitio completo — diseño, contenido base y todas las integraciones solicitadas.' },
  { num: '03', title: 'Entrega y ajustes', desc: 'Te entregamos el sitio funcionando. Aplicamos las correcciones necesarias hasta que estés conforme.' },
]

// ── FAQ ────────────────────────────────────────────────────────────────────────
const faqs = [
  { q: '¿El hosting y dominio están incluidos?', a: 'No. El sitio se entrega listo para deployar en la plataforma que prefieras (Vercel, Netlify, hosting propio). Te asesoramos en la elección.' },
  { q: '¿Cuánto tiempo tarda la entrega?', a: 'La mayoría de los proyectos se entregan en 5 a 10 días hábiles dependiendo de la complejidad y la velocidad de respuesta del cliente.' },
  { q: '¿Puedo pedir cambios después de la entrega?', a: 'Sí, el precio incluye una ronda de correcciones post-entrega. Cambios adicionales se cotizan por separado.' },
  { q: '¿Qué pasa si ya tengo un sitio y solo quiero mejorarlo?', a: 'Podemos hacer una auditoría y proponer mejoras. Dependiendo del alcance, lo cotizamos como rediseño parcial o completo.' },
]

export default function SitiosWebPage() {
  return (
    <ServiceLayout
      eyebrow="Presencia digital"
      title="Sitios web profesionales"
      subtitle="Tu vitrina online construida para convertir — no solo para verse bien."
      price="$997"
      priceSuffix="pago único"
      priceNote="Todo incluido. Sin costos ocultos."
      ctaLabel="Agendar llamada"
      ctaHref={AGENDAR}
      includes={includes}
      steps={steps}
      faqs={faqs}
    />
  )
}

// ── Shared layout component ────────────────────────────────────────────────────

function ServiceLayout({
  eyebrow, title, subtitle, price, priceSuffix, priceNote, ctaLabel, ctaHref, includes, steps, faqs,
}: {
  eyebrow: string
  title: string
  subtitle: string
  price: string
  priceSuffix: string
  priceNote: string
  ctaLabel: string
  ctaHref: string
  includes: { icon: React.ComponentType<{ size?: number; className?: string }>; title: string; desc: string }[]
  steps: { num: string; title: string; desc: string }[]
  faqs: { q: string; a: string }[]
}) {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white px-4 py-10 md:py-16">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_80%_35%_at_50%_0%,rgba(249,115,22,0.05),transparent)] pointer-events-none" />

      <div className="relative z-10 max-w-3xl mx-auto">

        {/* Back */}
        <Link href="/precios" className="inline-flex items-center gap-2 text-white/30 hover:text-white/55 transition-colors text-sm mb-10">
          <ArrowLeft size={14} />
          Volver a precios
        </Link>

        {/* Hero */}
        <div className="mb-14">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1.5 h-1.5 rounded-full bg-[#F97316]" />
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#F97316]">{eyebrow}</p>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-4">{title}</h1>
          <p className="text-base text-white/45 max-w-xl leading-relaxed mb-8">{subtitle}</p>
          <Link
            href={ctaHref}
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-[#F97316] hover:bg-[#ea6c0c] text-white text-sm font-semibold transition-all hover:shadow-[0_0_24px_rgba(249,115,22,0.3)] active:scale-[0.99]"
          >
            {ctaLabel}
            <ArrowRight size={15} />
          </Link>
        </div>

        {/* Qué incluye */}
        <Section label="Qué incluye">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {includes.map((item) => (
              <div key={item.title} className="flex items-start gap-3 rounded-2xl border border-white/8 bg-white/[0.025] p-4">
                <div className="shrink-0 flex h-8 w-8 items-center justify-center rounded-lg bg-[#F97316]/10 border border-[#F97316]/20">
                  <item.icon size={14} className="text-[#F97316]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white mb-0.5">{item.title}</p>
                  <p className="text-xs text-white/40 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Cómo funciona */}
        <Section label="Cómo funciona">
          <div className="space-y-3">
            {steps.map((step, i) => (
              <div key={step.num} className="flex gap-4 rounded-2xl border border-white/8 bg-white/[0.025] p-5">
                <div className="shrink-0 text-2xl font-bold text-[#F97316]/20 w-8 tabular-nums">{step.num}</div>
                <div>
                  <p className="text-sm font-semibold text-white mb-1">{step.title}</p>
                  <p className="text-xs text-white/40 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Precio */}
        <Section label="Precio">
          <div className="rounded-2xl border border-white/8 bg-white/[0.025] p-6 flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-3xl font-bold text-white">{price}</p>
              <p className="text-xs text-white/30 mt-1">{priceSuffix}</p>
              <p className="text-xs text-white/25 mt-0.5 italic">{priceNote}</p>
            </div>
            <Link
              href={ctaHref}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#F97316] hover:bg-[#ea6c0c] text-white text-sm font-semibold transition-all hover:shadow-[0_0_20px_rgba(249,115,22,0.3)]"
            >
              {ctaLabel}
              <ArrowRight size={14} />
            </Link>
          </div>
        </Section>

        {/* FAQ */}
        <Section label="Preguntas frecuentes">
          <div className="space-y-2">
            {faqs.map((faq) => (
              <details key={faq.q} className="group rounded-2xl border border-white/8 bg-white/[0.025] overflow-hidden">
                <summary className="flex items-center justify-between gap-4 px-5 py-4 cursor-pointer list-none text-sm font-medium text-white/70 hover:text-white transition-colors">
                  {faq.q}
                  <ChevronDown size={14} className="shrink-0 text-white/25 group-open:rotate-180 transition-transform" />
                </summary>
                <p className="px-5 pb-4 text-xs text-white/40 leading-relaxed">{faq.a}</p>
              </details>
            ))}
          </div>
        </Section>

        {/* CTA final */}
        <div className="rounded-2xl border border-[#F97316]/20 bg-[#F97316]/[0.04] p-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#F97316] mb-3">¿Listo para empezar?</p>
          <h2 className="text-2xl font-bold text-white mb-3">Hablemos de tu proyecto</h2>
          <p className="text-sm text-white/40 mb-7 max-w-sm mx-auto">30 minutos para entender lo que necesitás y darte una propuesta concreta. Sin compromiso.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href={AGENDAR}
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-[#F97316] hover:bg-[#ea6c0c] text-white text-sm font-semibold transition-all hover:shadow-[0_0_24px_rgba(249,115,22,0.3)]"
            >
              Agendar llamada gratis
              <ArrowRight size={15} />
            </Link>
            <Link
              href="/precios"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl border border-white/10 hover:border-white/20 text-white/55 hover:text-white text-sm font-semibold transition-all"
            >
              Ver todos los servicios
            </Link>
          </div>
        </div>

      </div>
    </div>
  )
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-10">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/25 mb-4">{label}</p>
      {children}
    </div>
  )
}
