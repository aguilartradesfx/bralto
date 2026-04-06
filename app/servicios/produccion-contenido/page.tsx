import Link from 'next/link'
import { ArrowLeft, ArrowRight, Check, Video, Calendar, BarChart3, Layers, ChevronDown } from 'lucide-react'

const AGENDAR = '/agendar'

const includes = [
  { icon: Video, title: 'Videos cortos para Reels e Instagram', desc: 'Producción, edición y publicación de contenido vertical optimizado para cada plataforma.' },
  { icon: Layers, title: 'Stories y contenido de apoyo', desc: 'Diseño y producción de stories para mantener presencia diaria en tu cuenta.' },
  { icon: BarChart3, title: 'Estrategia editorial', desc: '// TODO: describir en detalle la estrategia que se entrega — calendario, objetivos, métricas.' },
  { icon: Calendar, title: 'Calendario de contenido', desc: '// TODO: detallar formato y periodicidad del calendario editorial (Plan Completo).' },
]

const steps = [
  { num: '01', title: 'Sesión de estrategia', desc: '// TODO: describir cómo se hace el onboarding — briefing, tono de voz, objetivos de marca.' },
  { num: '02', title: 'Producción mensual', desc: '// TODO: detallar el proceso de grabación, edición y entrega de piezas cada mes.' },
  { num: '03', title: 'Revisión y publicación', desc: '// TODO: describir el flujo de aprobación y si Bralto gestiona la publicación o solo entrega.' },
]

const faqs = [
  { q: '¿Ustedes graban el contenido o solo editan?', a: '// TODO: definir si el servicio incluye producción de campo (grabación) o solo edición con material del cliente.' },
  { q: '¿El servicio incluye la gestión de redes?', a: '// TODO: aclarar si se publica en nombre del cliente o solo se entregan los archivos.' },
  { q: '¿Puedo cambiar de plan mensualmente?', a: '// TODO: definir política de cambio de plan y penalidades si las hay.' },
  { q: '¿Qué plataformas se cubren?', a: '// TODO: especificar Instagram, TikTok, YouTube Shorts u otras según lo que ofrece el servicio.' },
]

const plans = [
  {
    name: 'Plan Esencial',
    price: '$650',
    suffix: '/mes',
    items: ['6 videos cortos', '8 stories', 'Estrategia de contenido'],
  },
  {
    name: 'Plan Completo',
    price: '$997',
    suffix: '/mes',
    items: ['12 videos cortos', 'Stories ilimitados', '1 video largo', 'Calendario editorial'],
    highlight: true,
  },
]

export default function ProduccionContenidoPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white px-4 py-10 md:py-16">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_80%_35%_at_50%_0%,rgba(249,115,22,0.05),transparent)] pointer-events-none" />

      <div className="relative z-10 max-w-3xl mx-auto">

        <Link href="/precios" className="inline-flex items-center gap-2 text-white/30 hover:text-white/55 transition-colors text-sm mb-10">
          <ArrowLeft size={14} />
          Volver a precios
        </Link>

        {/* Hero */}
        <div className="mb-14">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1.5 h-1.5 rounded-full bg-[#F97316]" />
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#F97316]">Presencia digital</p>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-4">Producción de contenido</h1>
          {/* TODO: personalizar subtitle con el problema que resuelve este servicio */}
          <p className="text-base text-white/45 max-w-xl leading-relaxed mb-8">
            Contenido profesional para redes sociales, mes a mes, sin que tengas que preocuparte por nada.
          </p>
          <Link href={AGENDAR} className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-[#F97316] hover:bg-[#ea6c0c] text-white text-sm font-semibold transition-all hover:shadow-[0_0_24px_rgba(249,115,22,0.3)] active:scale-[0.99]">
            Agendar llamada
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
            {steps.map((step) => (
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
        <Section label="Planes">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {plans.map((plan) => (
              <div key={plan.name} className={`rounded-2xl border p-6 flex flex-col ${plan.highlight ? 'border-[#F97316]/30 bg-[#F97316]/[0.04]' : 'border-white/8 bg-white/[0.025]'}`}>
                <p className="text-xs font-semibold uppercase tracking-wider text-white/30 mb-1">{plan.name}</p>
                <p className="text-3xl font-bold text-white mb-0.5">{plan.price}<span className="text-sm font-normal text-white/30">{plan.suffix}</span></p>
                <ul className="mt-4 space-y-2 flex-1">
                  {plan.items.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-xs text-white/55">
                      <Check size={11} className="text-[#F97316] shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link href={AGENDAR} className={`mt-5 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all ${plan.highlight ? 'bg-[#F97316] hover:bg-[#ea6c0c] text-white' : 'bg-white/6 border border-white/10 hover:bg-white/10 text-white/65 hover:text-white'}`}>
                  Empezar
                  <ArrowRight size={13} />
                </Link>
              </div>
            ))}
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
        <FinalCta />
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

function FinalCta() {
  return (
    <div className="rounded-2xl border border-[#F97316]/20 bg-[#F97316]/[0.04] p-8 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#F97316] mb-3">¿Listo para empezar?</p>
      <h2 className="text-2xl font-bold text-white mb-3">Hablemos de tu proyecto</h2>
      <p className="text-sm text-white/40 mb-7 max-w-sm mx-auto">30 minutos para entender lo que necesitás y darte una propuesta concreta. Sin compromiso.</p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link href={AGENDAR} className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-[#F97316] hover:bg-[#ea6c0c] text-white text-sm font-semibold transition-all hover:shadow-[0_0_24px_rgba(249,115,22,0.3)]">
          Agendar llamada gratis
          <ArrowRight size={15} />
        </Link>
        <Link href="/precios" className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl border border-white/10 hover:border-white/20 text-white/55 hover:text-white text-sm font-semibold transition-all">
          Ver todos los servicios
        </Link>
      </div>
    </div>
  )
}
