'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, ArrowRight, Check, ChevronDown } from 'lucide-react'
import { ClientCardsSlider, type ClientProject } from '@/components/ui/client-cards-slider'

const AGENDAR = '/agendar'
const STRIPE = 'https://buy.stripe.com/7sY7sK4ZBcuE61487P5EY0t'

// ─── Hero images scattered in arc ─────────────────────────────────────────────
// Selected best-looking mockups from all 4 clients
const arcImages = [
  { src: 'https://assets.cdn.filesafe.space/hdVpvshZP3RGJQbxx8GA/media/69d4b1d558216e2b1626ef81.png', w: 260, rot: -6, top: '4%',  right: '36%', z: 2 },
  { src: 'https://assets.cdn.filesafe.space/hdVpvshZP3RGJQbxx8GA/media/69d4b1a6a7dcb4cff00335af.png', w: 230, rot: 4,  top: '20%', right: '8%',  z: 4 },
  { src: 'https://assets.cdn.filesafe.space/hdVpvshZP3RGJQbxx8GA/media/69d4b1b73d829c73b2948285.png', w: 210, rot: -3, top: '52%', right: '28%', z: 3 },
  { src: 'https://assets.cdn.filesafe.space/hdVpvshZP3RGJQbxx8GA/media/69d4b1c53d829c73b2948390.png', w: 190, rot: 8,  top: '62%', right: '2%',  z: 2 },
]

// ─── Client projects ───────────────────────────────────────────────────────────
const clients: ClientProject[] = [
  {
    id: 'nanku',
    name: 'Nanku',
    industry: 'Moda & Lifestyle',
    tagline: 'Sitio completo, sistema de reservas, agente de IA y producción audiovisual mensual.',
    story: 'Nanku fue un proyecto de principio a fin. Construimos su sitio web desde cero, montamos un sistema de reservas integrado con una plataforma all-in-one para manejar el negocio, y conectamos múltiples canales: WhatsApp, Instagram, Messenger y la página web. Todo acompañado de un agente de IA especializado que atiende clientes y los guía a través de sus reservas. El servicio también incluye producción audiovisual mensual. Una entrega total.',
    deliverables: [
      'Sitio web desde cero',
      'Sistema de reservas integrado',
      'Plataforma all-in-one de gestión',
      'Conexión multicanal: WhatsApp, Instagram, Messenger, Web',
      'Agente de IA especializado en el negocio',
      'Producción audiovisual mensual',
    ],
    coverImage: 'https://assets.cdn.filesafe.space/hdVpvshZP3RGJQbxx8GA/media/69d4b1a6a7dcb4cff00335af.png',
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
    id: 'ecoviva',
    name: 'Ecoviva',
    industry: 'Inmobiliaria',
    tagline: 'Página de alto impacto con agente de IA que asesora a los visitantes y agenda visitas.',
    story: 'Ecoviva es una inmobiliaria que necesitaba una página que transmitiera su mensaje con fuerza, sin ser complicada. Construimos una presencia digital que comunica con claridad y credibilidad. Le añadimos un agente de IA conectado al sitio y a toda su base de conocimiento, que asesora a los visitantes sobre las propiedades, resuelve sus dudas y los guía para agendar una visita presencial — notificando al equipo interno para que tome la cita. El sitio también incluye descarga de archivos y selección de propiedades.',
    deliverables: [
      'Sitio web de alto impacto y diseño editorial',
      'Agente de IA conectado a toda la base de conocimiento',
      'Asesoría sobre propiedades en tiempo real',
      'Sistema de agendamiento de visitas presenciales',
      'Notificaciones al equipo interno',
      'Descarga de archivos y catálogo de propiedades',
    ],
    coverImage: 'https://assets.cdn.filesafe.space/hdVpvshZP3RGJQbxx8GA/media/69d4b1b73d829c73b2948285.png',
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
    id: 'travelcore',
    name: 'TravelCore',
    industry: 'Turismo & Viajes',
    tagline: 'Portal 4 en 1 con motor de agenda, automatizaciones y rutas diferenciadas por cliente.',
    story: 'TravelCore necesitaba un motor de agenda para tours pero no tenía nada. Construimos una página 4 en 1: un portal de entrada con tres rutas — corporativo, vacacional y reservas. Desde el lado corporativo, todo está automatizado para que cada persona llegue exactamente donde debe. En el lado vacacional podés reservar directo o agendar una llamada con alguien del equipo. Todo con automatizaciones e integraciones corriendo por debajo.',
    deliverables: [
      'Portal web 4 en 1 con rutas diferenciadas',
      'Motor de agenda para tours y excursiones',
      'Flujo corporativo completamente automatizado',
      'Reserva directa + agendamiento de llamada en modo vacacional',
      'Automatizaciones e integraciones de fondo',
      'Registro y seguimiento de cada cliente',
    ],
    coverImage: 'https://assets.cdn.filesafe.space/hdVpvshZP3RGJQbxx8GA/media/69d4b1d558216e2b1626ef81.png',
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
    id: 'hidasol',
    name: 'Hidasol',
    industry: 'Energía Solar',
    tagline: 'Agente de IA con +1000 productos, automatización de pedidos y flujo interno sin papel.',
    story: 'Hidasol tenía un problema muy concreto: activaban anuncios y les llegaba una avalancha de mensajes que no podían atender. Se les iba la mitad sin respuesta, y todo lo manejaban a mano, en papel. La solución fue un agente de IA con acceso a una base de datos de más de mil productos y sus variantes. Después automatizamos todo el flujo interno: los clientes hacen su pedido por cualquier canal digital, la IA toma el pedido, registra los datos, manda una confirmación con número de orden y avisa al equipo también.',
    deliverables: [
      'Sitio web con catálogo y sistema de pedidos',
      'Agente de IA con acceso a +1,000 productos',
      'Flujo de atención multicanal automatizado',
      'Registro automático de clientes y pedidos',
      'Confirmación automática con número de orden',
      'Notificaciones al equipo interno en tiempo real',
    ],
    coverImage: 'https://assets.cdn.filesafe.space/hdVpvshZP3RGJQbxx8GA/media/69d4b1c53d829c73b2948390.png',
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

// ─── What's included ───────────────────────────────────────────────────────────
const features = [
  { num: '01', title: 'Diseño a medida',           desc: 'Interfaz construida sobre tu identidad de marca — no plantillas genéricas.' },
  { num: '02', title: 'Hasta 8 páginas',            desc: 'Inicio, servicios, nosotros, contacto y más. Todo pensado para convertir.' },
  { num: '03', title: 'SEO técnico incluido',       desc: 'Estructura semántica, velocidad, meta tags y sitemap para posicionar desde el día uno.' },
  { num: '04', title: 'Formularios y captura',      desc: 'Leads directos a tu correo, WhatsApp o CRM sin pasos intermedios.' },
  { num: '05', title: 'Integración con tus tools',  desc: 'Conectamos con las herramientas que ya usás sin fricción.' },
  { num: '06', title: 'Entrega en tiempo récord',   desc: 'La mayoría de proyectos están listos en 5 a 10 días hábiles.' },
]

// ─── Process ──────────────────────────────────────────────────────────────────
const steps = [
  { num: '// 01', title: 'Llamada de diagnóstico', desc: 'Entendemos tu negocio, objetivos y lo que querés comunicar. Definimos estructura, páginas y tono.' },
  { num: '// 02', title: 'Diseño y desarrollo',    desc: 'Construimos el sitio completo con diseño, contenido base, SEO e integraciones. Te mostramos avances.' },
  { num: '// 03', title: 'Entrega y ajustes',      desc: 'Sitio funcionando. Aplicamos correcciones hasta que estés conforme al 100%.' },
]

// ─── FAQ ──────────────────────────────────────────────────────────────────────
const faqs = [
  { q: '¿El hosting y dominio están incluidos?', a: 'No. El sitio se entrega listo para deployar en la plataforma que prefieras. Te asesoramos en la elección.' },
  { q: '¿Cuánto tiempo tarda la entrega?',       a: 'La mayoría de proyectos en 5 a 10 días hábiles según complejidad y velocidad de entrega de material.' },
  { q: '¿Puedo pedir cambios después?',          a: 'El precio incluye una ronda de correcciones post-entrega. Cambios adicionales se cotizan por separado.' },
  { q: '¿Ya tengo sitio, solo quiero mejorarlo?', a: 'Podemos hacer una auditoría y proponer mejoras. Lo cotizamos como rediseño parcial o completo.' },
]

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function SitiosWebPage() {
  return (
    <div className="min-h-screen bg-[#080808] text-white overflow-x-hidden">

      {/* ══════════════════════════════════════════════════════
          HERO — full viewport, big type, scattered images
      ══════════════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex flex-col justify-end pb-20 overflow-hidden">

        {/* Gradient overlay — makes text readable */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#080808] via-[#080808]/85 to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-transparent to-[#080808]/40 z-10 pointer-events-none" />

        {/* Scattered arc images — right side */}
        {arcImages.map((img, i) => (
          <div
            key={i}
            className="absolute hidden md:block rounded-2xl overflow-hidden shadow-2xl shadow-black/60"
            style={{
              width: img.w,
              top: img.top,
              right: img.right,
              zIndex: img.z,
              transform: `rotate(${img.rot}deg)`,
              aspectRatio: '16/10',
            }}
          >
            <Image src={img.src} alt="" fill className="object-cover" sizes="300px" />
          </div>
        ))}

        {/* Mobile single image */}
        <div className="absolute inset-0 md:hidden z-0">
          <Image
            src={arcImages[0].src}
            alt=""
            fill
            className="object-cover opacity-20"
            sizes="100vw"
            priority
          />
        </div>

        {/* Content */}
        <div className="relative z-20 max-w-7xl mx-auto px-6 md:px-10">

          {/* Back nav */}
          <Link href="/precios" className="inline-flex items-center gap-2 text-white/30 hover:text-white/60 transition-colors text-sm mb-12">
            <ArrowLeft size={14} />
            Precios
          </Link>

          {/* Tag pill */}
          <div className="inline-flex items-center gap-2 mb-8 px-3 py-1.5 rounded-full bg-white/6 border border-white/10">
            <span className="w-1.5 h-1.5 rounded-full bg-[#F97316]" />
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/60">Presencia digital</span>
          </div>

          {/* BIG headline */}
          <h1
            className="font-bold leading-[0.95] tracking-tight mb-8"
            style={{ fontSize: 'clamp(3.5rem, 10vw, 9rem)' }}
          >
            Sitios web<br />
            <span className="text-white/20">profesionales.</span>
          </h1>

          {/* Description + stats row */}
          <div className="flex flex-col md:flex-row md:items-end gap-10 mb-12">
            <p className="text-lg text-white/45 leading-relaxed max-w-md">
              Tu presencia online construida para convertir —
              diseño a medida, SEO incluido y entrega en tiempo récord.
            </p>
            <div className="flex items-center gap-10 shrink-0">
              {[['4+', 'Proyectos'], ['$997', 'Precio único'], ['≤10d', 'Entrega']].map(([v, l]) => (
                <div key={l}>
                  <p className="text-2xl font-bold text-white">{v}</p>
                  <p className="text-xs text-white/30 mt-0.5 uppercase tracking-wider">{l}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CTAs */}
          <div className="flex flex-wrap gap-3">
            <Link
              href={AGENDAR}
              className="inline-flex items-center gap-2.5 px-8 py-4 rounded-full bg-[#F97316] hover:bg-[#ea6c0c] text-white font-semibold transition-all hover:shadow-[0_0_32px_rgba(249,115,22,0.4)] active:scale-[0.98]"
            >
              Agendar llamada gratis
              <ArrowRight size={16} />
            </Link>
            <a
              href={STRIPE}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 px-8 py-4 rounded-full bg-white/8 hover:bg-white/12 text-white/70 hover:text-white font-semibold transition-all"
            >
              Contratar — $997
            </a>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          CLIENTES — card slider con modals
      ══════════════════════════════════════════════════════ */}
      <section className="py-28 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 md:px-10">

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#F97316] mb-4">Proyectos realizados</p>
              <h2 className="text-5xl md:text-6xl font-bold tracking-tight leading-tight">
                El trabajo<br />
                <span className="text-white/25">habla solo.</span>
              </h2>
            </div>
            <p className="text-sm text-white/35 max-w-xs leading-relaxed md:text-right">
              Hacé clic en cualquier proyecto para ver la historia completa y la galería de imágenes.
            </p>
          </div>

          <ClientCardsSlider clients={clients} />

        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          QUÉ INCLUYE — editorial numbered list
      ══════════════════════════════════════════════════════ */}
      <section className="py-28">
        <div className="max-w-7xl mx-auto px-6 md:px-10">

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-20">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#F97316] mb-4">Lo que obtenés</p>
              <h2 className="text-5xl md:text-6xl font-bold tracking-tight leading-tight">
                Todo incluido.<br />
                <span className="text-white/25">Sin sorpresas.</span>
              </h2>
            </div>
            <p className="text-sm text-white/35 max-w-xs leading-relaxed md:text-right">
              Un solo precio cubre diseño, desarrollo, SEO e integración. Nada queda afuera.
            </p>
          </div>

          {/* Features — grid editorial */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-white/[0.05]">
            {features.map((f) => (
              <div key={f.num} className="bg-[#080808] px-8 py-10 group hover:bg-[#0d0d0d] transition-colors">
                <p className="text-xs font-mono text-[#F97316]/60 mb-6">{f.num}</p>
                <h3 className="text-xl font-bold text-white mb-3">{f.title}</h3>
                <p className="text-sm text-white/40 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          PROCESO — editorial with large step text
      ══════════════════════════════════════════════════════ */}
      <section className="py-28 bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto px-6 md:px-10">

          <div className="mb-20">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#F97316] mb-4">El proceso</p>
            <h2 className="text-5xl md:text-6xl font-bold tracking-tight leading-tight">
              Simple, rápido<br />
              <span className="text-white/25">y sin vueltas.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 divide-y md:divide-y-0 md:divide-x divide-white/[0.06]">
            {steps.map((step, i) => (
              <div key={step.num} className="px-0 md:px-10 py-10 md:py-0 first:md:pl-0 last:md:pr-0">
                <p className="text-xs font-mono text-white/20 mb-6">{step.num}</p>
                <h3 className="text-2xl font-bold text-white mb-4">{step.title}</h3>
                <p className="text-sm text-white/40 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          PRECIO — clean, prominent
      ══════════════════════════════════════════════════════ */}
      <section className="py-28">
        <div className="max-w-7xl mx-auto px-6 md:px-10">

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

            {/* Left */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#F97316] mb-4">Inversión</p>
              <h2 className="text-5xl md:text-6xl font-bold tracking-tight leading-tight mb-6">
                Un precio.<br />
                <span className="text-white/25">Todo adentro.</span>
              </h2>
              <p className="text-sm text-white/40 leading-relaxed max-w-sm">
                Sin sorpresas al final. Sin módulos adicionales. Sin licencias escondidas.
                Lo que ves es lo que pagás.
              </p>
            </div>

            {/* Right */}
            <div>
              <div className="mb-8">
                <p className="text-7xl font-bold text-white mb-2">$997</p>
                <p className="text-sm text-white/30">Pago único · Sin costos recurrentes</p>
              </div>

              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 mb-10">
                {[
                  'Diseño a medida de tu marca',
                  'Hasta 8 páginas completas',
                  'SEO técnico y on-page',
                  'Formularios de captura de leads',
                  'Integración con tus herramientas',
                  'Entrega en máximo 10 días hábiles',
                  'Ronda de correcciones incluida',
                  'Asesoría en hosting y dominio',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2.5 text-sm text-white/55">
                    <Check size={13} className="text-[#F97316] shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>

              <div className="flex flex-wrap gap-3">
                <a
                  href={STRIPE}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-[#F97316] hover:bg-[#ea6c0c] text-white font-semibold transition-all hover:shadow-[0_0_32px_rgba(249,115,22,0.4)]"
                >
                  Contratar ahora
                  <ArrowRight size={15} />
                </a>
                <Link
                  href={AGENDAR}
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white/6 hover:bg-white/10 text-white/60 hover:text-white font-semibold transition-all"
                >
                  Primero quiero hablar
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          FAQ
      ══════════════════════════════════════════════════════ */}
      <section className="py-28 bg-[#0a0a0a]">
        <div className="max-w-3xl mx-auto px-6 md:px-10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#F97316] mb-4">FAQ</p>
          <h2 className="text-5xl font-bold tracking-tight mb-16">Preguntas<br /><span className="text-white/25">frecuentes.</span></h2>

          <div className="divide-y divide-white/[0.06]">
            {faqs.map((faq) => (
              <details key={faq.q} className="group py-6">
                <summary className="flex items-center justify-between gap-6 cursor-pointer list-none text-lg font-semibold text-white/70 hover:text-white transition-colors">
                  {faq.q}
                  <ChevronDown size={18} className="shrink-0 text-white/20 group-open:rotate-180 transition-transform duration-200" />
                </summary>
                <p className="mt-4 text-sm text-white/40 leading-relaxed max-w-xl">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          CTA FINAL
      ══════════════════════════════════════════════════════ */}
      <section className="py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_70%_at_50%_50%,rgba(249,115,22,0.07),transparent)] pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto px-6 md:px-10 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#F97316] mb-6">¿Listo?</p>
          <h2
            className="font-bold tracking-tight leading-[0.95] text-white mb-8"
            style={{ fontSize: 'clamp(2.5rem, 6vw, 5rem)' }}
          >
            Hablemos de<br />tu proyecto.
          </h2>
          <p className="text-base text-white/40 leading-relaxed mb-12 max-w-md mx-auto">
            30 minutos para entender lo que necesitás y darte una propuesta concreta.
            Sin compromiso. Sin presión.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href={AGENDAR}
              className="inline-flex items-center justify-center gap-2.5 px-10 py-4 rounded-full bg-[#F97316] hover:bg-[#ea6c0c] text-white font-semibold transition-all hover:shadow-[0_0_32px_rgba(249,115,22,0.4)]"
            >
              Agendar llamada gratis
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/precios"
              className="inline-flex items-center justify-center gap-2.5 px-10 py-4 rounded-full bg-white/6 hover:bg-white/10 text-white/55 hover:text-white font-semibold transition-all"
            >
              Ver todos los servicios
            </Link>
          </div>
        </div>
      </section>

    </div>
  )
}
