'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowLeft, ArrowRight, Check, Globe, Search,
  Zap, ChevronDown, Palette, FormInput, Clock
} from 'lucide-react'

const AGENDAR = '/agendar'
const STRIPE   = 'https://buy.stripe.com/7sY7sK4ZBcuE61487P5EY0t'

// ─── Portfolio de clientes ────────────────────────────────────────────────────
const clients = [
  {
    name: 'Nanku',
    industry: 'Moda & Lifestyle',
    description: 'Sitio de marca con catálogo visual, identidad premium y experiencia mobile-first.',
    images: [
      'https://assets.cdn.filesafe.space/hdVpvshZP3RGJQbxx8GA/media/69d4b1a6a7dcb4cff00335af.png',
      'https://assets.cdn.filesafe.space/hdVpvshZP3RGJQbxx8GA/media/69d4b1a6c5a58912fbcef5fe.png',
      'https://assets.cdn.filesafe.space/hdVpvshZP3RGJQbxx8GA/media/69d4b1a684c045c274b6e799.png',
      'https://assets.cdn.filesafe.space/hdVpvshZP3RGJQbxx8GA/media/69d4b1a6b892c092ea71c73a.png',
      'https://assets.cdn.filesafe.space/hdVpvshZP3RGJQbxx8GA/media/69d4b1a6a7dcb4cff00335ae.png',
      'https://assets.cdn.filesafe.space/hdVpvshZP3RGJQbxx8GA/media/69d4b1a6d9088c065c3baa62.png',
      'https://assets.cdn.filesafe.space/hdVpvshZP3RGJQbxx8GA/media/69d4b1a6d9088c065c3baa63.png',
    ],
  },
  {
    name: 'Ecoviva',
    industry: 'Salud & Bienestar',
    description: 'Plataforma de reservas online con integración de calendario, pagos y panel de administración.',
    images: [
      'https://assets.cdn.filesafe.space/hdVpvshZP3RGJQbxx8GA/media/69d4b1b73d829c73b2948285.png',
      'https://assets.cdn.filesafe.space/hdVpvshZP3RGJQbxx8GA/media/69d4b1b7a7dcb4cff00336b4.png',
      'https://assets.cdn.filesafe.space/hdVpvshZP3RGJQbxx8GA/media/69d4b1b7fbeab4c06decff73.png',
      'https://assets.cdn.filesafe.space/hdVpvshZP3RGJQbxx8GA/media/69d4b1b784c045c274b6e89a.png',
      'https://assets.cdn.filesafe.space/hdVpvshZP3RGJQbxx8GA/media/69d4b1b7b892c092ea71c838.png',
      'https://assets.cdn.filesafe.space/hdVpvshZP3RGJQbxx8GA/media/69d4b1b78a63585a16a61691.png',
      'https://assets.cdn.filesafe.space/hdVpvshZP3RGJQbxx8GA/media/69d4b1b784c045c274b6e899.png',
    ],
  },
  {
    name: 'Travelcore',
    industry: 'Turismo & Viajes',
    description: 'Sitio de agencia de viajes con catálogo de paquetes, cotizador y formularios de captura de leads.',
    images: [
      'https://assets.cdn.filesafe.space/hdVpvshZP3RGJQbxx8GA/media/69d4b1d558216e2b1626ef81.png',
      'https://assets.cdn.filesafe.space/hdVpvshZP3RGJQbxx8GA/media/69d4b1d5a7dcb4cff003393e.png',
      'https://assets.cdn.filesafe.space/hdVpvshZP3RGJQbxx8GA/media/69d4b1d584c045c274b6eb6d.png',
      'https://assets.cdn.filesafe.space/hdVpvshZP3RGJQbxx8GA/media/69d4b1d558216e2b1626ef80.png',
      'https://assets.cdn.filesafe.space/hdVpvshZP3RGJQbxx8GA/media/69d4b1d5bec7abdef1301c5f.png',
      'https://assets.cdn.filesafe.space/hdVpvshZP3RGJQbxx8GA/media/69d4b1d5fbeab4c06ded022b.png',
      'https://assets.cdn.filesafe.space/hdVpvshZP3RGJQbxx8GA/media/69d4b1d5739146c47c8fa704.png',
    ],
  },
  {
    name: 'Hidasol',
    industry: 'Energía Solar',
    description: 'Sitio corporativo con calculadora de ahorro, formulario de cotización y panel de proyectos instalados.',
    images: [
      'https://assets.cdn.filesafe.space/hdVpvshZP3RGJQbxx8GA/media/69d4b1c53d829c73b2948390.png',
      'https://assets.cdn.filesafe.space/hdVpvshZP3RGJQbxx8GA/media/69d4b1c53d829c73b294838f.png',
      'https://assets.cdn.filesafe.space/hdVpvshZP3RGJQbxx8GA/media/69d4b1c5fbeab4c06ded00b5.png',
      'https://assets.cdn.filesafe.space/hdVpvshZP3RGJQbxx8GA/media/69d4b1c5b892c092ea71c962.png',
      'https://assets.cdn.filesafe.space/hdVpvshZP3RGJQbxx8GA/media/69d4b1c53f4f3bc96cb86696.png',
      'https://assets.cdn.filesafe.space/hdVpvshZP3RGJQbxx8GA/media/69d4b1c5739146c47c8fa54e.png',
      'https://assets.cdn.filesafe.space/hdVpvshZP3RGJQbxx8GA/media/69d4b1c5fbeab4c06ded00b6.png',
    ],
  },
]

// ─── Lo que incluye ───────────────────────────────────────────────────────────
const features = [
  { icon: Palette,    title: 'Diseño a medida',        desc: 'Interfaz alineada a tu identidad de marca — no plantillas genéricas.' },
  { icon: Globe,      title: 'Hasta 8 páginas',        desc: 'Inicio, servicios, nosotros, contacto y más, todo optimizado.' },
  { icon: Search,     title: 'SEO técnico',            desc: 'Estructura semántica, velocidad, meta tags y sitemap para posicionar desde el día uno.' },
  { icon: FormInput,  title: 'Formularios y CTA',      desc: 'Captura de leads directo a tu correo, WhatsApp o CRM.' },
  { icon: Zap,        title: 'Integración básica',     desc: 'Conectamos con las herramientas que ya usás — sin fricciones.' },
  { icon: Clock,      title: 'Entrega en tiempo récord', desc: 'La mayoría de proyectos en 5–10 días hábiles desde el briefing.' },
]

// ─── Proceso ──────────────────────────────────────────────────────────────────
const steps = [
  {
    num: '01',
    title: 'Llamada de diagnóstico',
    desc: 'Entendemos tu negocio, objetivos y lo que querés comunicar. Definimos estructura, tono y páginas necesarias.',
  },
  {
    num: '02',
    title: 'Diseño y desarrollo',
    desc: 'Construimos el sitio completo — diseño, contenido base, SEO e integraciones. Te mostramos avances en el camino.',
  },
  {
    num: '03',
    title: 'Entrega y ajustes',
    desc: 'Te entregamos el sitio funcionando. Aplicamos correcciones hasta que estés conforme al 100%.',
  },
]

// ─── FAQ ──────────────────────────────────────────────────────────────────────
const faqs = [
  {
    q: '¿El hosting y dominio están incluidos?',
    a: 'No. El sitio se entrega listo para deployar en la plataforma que prefieras (Vercel, Netlify, hosting propio). Te asesoramos en la elección y el proceso es simple.',
  },
  {
    q: '¿Cuánto tiempo tarda la entrega?',
    a: 'La mayoría de proyectos se entregan en 5 a 10 días hábiles. El tiempo varía según la complejidad y la velocidad con que nos entregues el material (logos, textos, fotos).',
  },
  {
    q: '¿Puedo pedir cambios después de la entrega?',
    a: 'El precio incluye una ronda de correcciones post-entrega. Cambios adicionales o nuevas páginas se cotizan por separado.',
  },
  {
    q: '¿Y si ya tengo un sitio y solo quiero mejorarlo?',
    a: 'Podemos hacer una auditoría y proponer mejoras. Dependiendo del alcance lo cotizamos como rediseño parcial o completo.',
  },
]

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function SitiosWebPage() {
  const [activeClient, setActiveClient] = useState(0)
  const [activeImg, setActiveImg]       = useState(0)

  const client = clients[activeClient]

  const handleClientChange = (i: number) => {
    setActiveClient(i)
    setActiveImg(0)
  }

  return (
    <div className="min-h-screen bg-[#080808] text-white">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_70%_40%_at_60%_0%,rgba(249,115,22,0.06),transparent)] pointer-events-none" />

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="relative pt-24 pb-0 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-0 items-center min-h-[85vh]">

          {/* Left */}
          <div className="relative z-10 flex flex-col justify-center py-16 lg:pr-16">
            <Link href="/precios" className="inline-flex items-center gap-2 text-white/30 hover:text-white/55 transition-colors text-sm mb-8 w-fit">
              <ArrowLeft size={14} />
              Volver a precios
            </Link>

            <div className="inline-flex items-center gap-2 mb-6 w-fit px-3 py-1.5 rounded-full border border-[#F97316]/25 bg-[#F97316]/8">
              <Globe size={12} className="text-[#F97316]" />
              <span className="text-xs font-semibold text-[#F97316] uppercase tracking-[0.15em]">Sitios web profesionales</span>
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-[4.5rem] font-bold tracking-tight leading-[1.05] text-white mb-6">
              Tu sitio web.<br />
              <span className="text-white/35">Tu mejor</span><br />
              vendedor.
            </h1>

            <p className="text-lg text-white/45 leading-relaxed max-w-md mb-10">
              Diseño profesional, SEO incluido y entrega en tiempo récord — para que tu presencia online convierta desde el primer día.
            </p>

            {/* Stats row */}
            <div className="flex items-center gap-8 mb-10 pb-10 border-b border-white/[0.07]">
              {[['4+', 'Clientes'], ['$997', 'Precio único'], ['10d', 'Entrega máx.']].map(([val, label]) => (
                <div key={label}>
                  <p className="text-2xl font-bold text-white">{val}</p>
                  <p className="text-xs text-white/30 mt-0.5">{label}</p>
                </div>
              ))}
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap gap-3">
              <Link
                href={AGENDAR}
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-[#F97316] hover:bg-[#ea6c0c] text-white text-sm font-semibold transition-all hover:shadow-[0_0_28px_rgba(249,115,22,0.35)] active:scale-[0.99]"
              >
                Agendar llamada gratis
                <ArrowRight size={15} />
              </Link>
              <a
                href={STRIPE}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl border border-white/12 hover:border-white/22 text-white/60 hover:text-white text-sm font-semibold transition-all"
              >
                Contratar — $997
              </a>
            </div>
          </div>

          {/* Right — hero image */}
          <div className="relative h-[420px] lg:h-auto lg:self-stretch flex items-end">
            <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-transparent to-transparent z-10 pointer-events-none" />
            <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-[#080808] to-transparent z-10 pointer-events-none" />
            <div className="relative w-full h-full min-h-[420px]">
              <Image
                src={clients[2].images[0]}
                alt="Ejemplo de sitio web desarrollado por Bralto"
                fill
                className="object-cover object-left-top rounded-2xl"
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
          </div>

        </div>
      </section>

      {/* ── Trabajos realizados ───────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">

          {/* Section header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#F97316] mb-3">Trabajos realizados</p>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white">
                Resultados que<br />hablan solos.
              </h2>
            </div>
            <p className="text-sm text-white/40 max-w-sm leading-relaxed md:text-right">
              Estos son algunos de los sitios y sistemas que hemos construido para nuestros clientes.
            </p>
          </div>

          {/* Client tabs */}
          <div className="flex items-center gap-2 mb-8 flex-wrap">
            {clients.map((c, i) => (
              <button
                key={c.name}
                onClick={() => handleClientChange(i)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  activeClient === i
                    ? 'bg-[#F97316] text-white'
                    : 'bg-white/[0.04] border border-white/8 text-white/45 hover:text-white/70 hover:bg-white/[0.07]'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>

          {/* Client info */}
          <div className="flex items-center gap-4 mb-6">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-white/25 mr-3">{client.industry}</span>
              <span className="text-sm text-white/50">{client.description}</span>
            </div>
          </div>

          {/* Image grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {client.images.map((src, i) => (
              <button
                key={src}
                onClick={() => setActiveImg(i)}
                className={`relative rounded-xl overflow-hidden aspect-video border-2 transition-all ${
                  activeImg === i ? 'border-[#F97316]/60 shadow-[0_0_20px_rgba(249,115,22,0.15)]' : 'border-white/[0.06] hover:border-white/20'
                } ${i === 0 ? 'col-span-2 row-span-2' : ''}`}
                style={i === 0 ? { aspectRatio: '16/9' } : {}}
              >
                <Image
                  src={src}
                  alt={`${client.name} mockup ${i + 1}`}
                  fill
                  className="object-cover hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
              </button>
            ))}
          </div>

        </div>
      </section>

      {/* ── Qué incluye ───────────────────────────────────────── */}
      <section className="py-24 px-6 border-t border-white/[0.05]">
        <div className="max-w-7xl mx-auto">
          <div className="mb-14">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#F97316] mb-3">Lo que obtenés</p>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white">
              Todo incluido.<br />
              <span className="text-white/35">Sin sorpresas.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f, i) => (
              <div
                key={f.title}
                className="group relative rounded-2xl border border-white/8 bg-white/[0.02] p-6 hover:border-[#F97316]/20 hover:bg-[#F97316]/[0.03] transition-all overflow-hidden"
              >
                <div className="absolute top-0 right-0 text-[8rem] font-black text-white/[0.02] leading-none select-none -mt-4 -mr-4">
                  {String(i + 1).padStart(2, '0')}
                </div>
                <div className="relative z-10">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F97316]/10 border border-[#F97316]/20 mb-5 group-hover:bg-[#F97316]/15 transition-colors">
                    <f.icon size={16} className="text-[#F97316]" />
                  </div>
                  <h3 className="text-base font-semibold text-white mb-2">{f.title}</h3>
                  <p className="text-sm text-white/40 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Proceso ───────────────────────────────────────────── */}
      <section className="py-24 px-6 border-t border-white/[0.05]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">

            <div className="lg:sticky lg:top-24">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#F97316] mb-3">El proceso</p>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-6">
                Simple,<br />rápido<br />y sin vueltas.
              </h2>
              <p className="text-sm text-white/40 leading-relaxed max-w-sm">
                Tres pasos desde la llamada inicial hasta tu sitio publicado y funcionando.
              </p>
            </div>

            <div className="space-y-4">
              {steps.map((step, i) => (
                <div key={step.num} className="relative rounded-2xl border border-white/8 bg-white/[0.025] p-7 overflow-hidden">
                  <div className="absolute top-4 right-6 text-6xl font-black text-white/[0.04] leading-none select-none">
                    {step.num}
                  </div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#F97316]/15 border border-[#F97316]/25 text-xs font-bold text-[#F97316]">
                        {i + 1}
                      </div>
                      <h3 className="text-base font-semibold text-white">{step.title}</h3>
                    </div>
                    <p className="text-sm text-white/45 leading-relaxed pl-10">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* ── Precio ────────────────────────────────────────────── */}
      <section className="py-24 px-6 border-t border-white/[0.05]">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#F97316] mb-3 text-center">Inversión</p>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white text-center mb-14">
            Un solo precio.<br />
            <span className="text-white/35">Todo incluido.</span>
          </h2>

          <div className="rounded-2xl border border-[#F97316]/25 bg-[#F97316]/[0.04] p-8 md:p-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-8 pb-8 border-b border-white/[0.08]">
              <div>
                <p className="text-sm text-white/40 mb-1">Sitio web profesional</p>
                <p className="text-6xl font-bold text-white">$997</p>
                <p className="text-sm text-white/30 mt-2">Pago único · Sin costos recurrentes</p>
              </div>
              <div className="flex flex-col gap-3">
                <a
                  href={STRIPE}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-[#F97316] hover:bg-[#ea6c0c] text-white font-semibold transition-all hover:shadow-[0_0_28px_rgba(249,115,22,0.4)] active:scale-[0.99]"
                >
                  Contratar ahora
                  <ArrowRight size={16} />
                </a>
                <Link
                  href={AGENDAR}
                  className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl border border-white/10 hover:border-white/20 text-white/55 hover:text-white text-sm font-semibold transition-all"
                >
                  Primero quiero hablar
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
              {[
                'Diseño a medida de tu marca',
                'Hasta 8 páginas completas',
                'SEO técnico y on-page',
                'Formularios y captura de leads',
                'Integración básica con tus herramientas',
                'Entrega en máximo 10 días hábiles',
                'Una ronda de correcciones incluida',
                'Asesoría en hosting y dominio',
              ].map((item) => (
                <div key={item} className="flex items-center gap-2.5">
                  <Check size={14} className="text-[#F97316] shrink-0" />
                  <span className="text-sm text-white/60">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────── */}
      <section className="py-24 px-6 border-t border-white/[0.05]">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#F97316] mb-3">FAQ</p>
          <h2 className="text-4xl font-bold tracking-tight text-white mb-12">Preguntas frecuentes.</h2>

          <div className="space-y-2">
            {faqs.map((faq) => (
              <details key={faq.q} className="group rounded-2xl border border-white/8 bg-white/[0.025] overflow-hidden">
                <summary className="flex items-center justify-between gap-4 px-6 py-5 cursor-pointer list-none text-sm font-medium text-white/70 hover:text-white transition-colors">
                  {faq.q}
                  <ChevronDown size={15} className="shrink-0 text-white/25 group-open:rotate-180 transition-transform duration-200" />
                </summary>
                <p className="px-6 pb-5 text-sm text-white/40 leading-relaxed border-t border-white/[0.05] pt-4">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Final ─────────────────────────────────────────── */}
      <section className="py-24 px-6 border-t border-white/[0.05]">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#F97316] mb-4">¿Listo?</p>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-5">
            Hablemos de<br />tu proyecto.
          </h2>
          <p className="text-base text-white/40 leading-relaxed mb-10 max-w-md mx-auto">
            30 minutos para entender lo que necesitás y darte una propuesta concreta. Sin compromiso, sin presión.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href={AGENDAR}
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-[#F97316] hover:bg-[#ea6c0c] text-white font-semibold transition-all hover:shadow-[0_0_28px_rgba(249,115,22,0.35)]"
            >
              Agendar llamada gratis
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/precios"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl border border-white/10 hover:border-white/20 text-white/55 hover:text-white font-semibold transition-all"
            >
              Ver todos los servicios
            </Link>
          </div>
        </div>
      </section>

    </div>
  )
}
