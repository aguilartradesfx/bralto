'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, ArrowRight, Check, ChevronDown } from 'lucide-react'
import { ClientCardsSlider, type ClientProject } from '@/components/ui/client-cards-slider'

const AGENDAR = '/agendar'
const STRIPE  = 'https://buy.stripe.com/7sY7sK4ZBcuE61487P5EY0t'

// ─── Client data ──────────────────────────────────────────────────────────────
const clients: ClientProject[] = [
  {
    id: 'nanku',
    name: 'Nanku',
    industry: 'Restaurante & Reservas',
    tagline: 'Plataforma completa de reservas, agente de IA 24/7 y producción audiovisual mensual.',
    url: 'https://www.restaurantenanku.net/',
    story: 'Nanku no tenía presencia digital ni forma de gestionar sus reservas. Les entregamos una operación digital completa — desde el sitio hasta la atención al cliente — sin que ellos tuvieran que preocuparse por nada técnico. Hoy reciben reservas en automático, atienden por múltiples canales y tienen contenido nuevo cada mes.',
    deliverables: [
      'Sitio web diseñado desde cero, mobile-first y optimizado para SEO',
      'Sistema de reservas integrado directamente en el sitio',
      'Plataforma all-in-one para gestionar clientes, pedidos y comunicaciones',
      'Conexión multicanal: WhatsApp, Instagram, Messenger y página web desde un solo lugar',
      'Agente de IA especializado en el negocio que atiende, guía y cierra reservas 24/7',
      'Producción audiovisual mensual: videos, reels y contenido para redes sociales',
      'Automatizaciones de seguimiento post-reserva y recordatorios automáticos',
    ],
    coverImage: 'https://assets.cdn.filesafe.space/hdVpvshZP3RGJQbxx8GA/media/69d5723c6584e0c530f51dff.jpg',
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
    tagline: 'Presencia digital de alto impacto con agente de IA que asesora y agenda visitas en tiempo real.',
    url: 'https://www.ecovivadesarrollos.com/',
    story: 'Ecoviva llegó con un desafío claro: transmitir confianza y profesionalismo en el mercado inmobiliario, sin una presencia digital que estuviera a la altura. Construimos un sitio que comunica con fuerza y credibilidad, y lo respaldamos con inteligencia artificial que trabaja los 7 días de la semana para convertir visitas en citas.',
    deliverables: [
      'Sitio web de alto impacto con diseño premium y enfoque en conversión',
      'Agente de IA con acceso a toda la base de propiedades disponibles',
      'Asesoría automatizada a visitantes: características, precios, ubicaciones y disponibilidad',
      'Sistema de agendamiento de visitas presenciales directo desde el chat',
      'Notificaciones automáticas al equipo interno cuando se agenda una visita',
      'Catálogo de propiedades con opción de descarga de fichas técnicas',
      'Integración con canales digitales para centralizar todas las consultas',
    ],
    coverImage: 'https://assets.cdn.filesafe.space/hdVpvshZP3RGJQbxx8GA/media/69d5723cf5ebf27de325201b.jpg',
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
    tagline: 'Portal 4 en 1 con motor de agenda para tours, flujos automatizados y rutas por tipo de cliente.',
    url: 'https://www.mytravelcore.com/',
    story: 'TravelCore quería una plataforma que pudiera manejar tanto clientes corporativos como vacacionales, con reservas en tiempo real y sin gestión manual. Construimos un ecosistema digital completo que separa, enruta y atiende a cada tipo de cliente de forma diferente — todo automatizado por debajo.',
    deliverables: [
      'Portal web 4 en 1 con página de entrada y tres rutas diferenciadas: corporativo, vacacional y reservas',
      'Motor de agenda para tours con disponibilidad en tiempo real',
      'Flujo corporativo 100% automatizado: cada cliente llega exactamente donde necesita sin fricción',
      'Flujo vacacional con opción de reserva directa o agendamiento de llamada con el equipo',
      'Automatizaciones de confirmación, recordatorios y seguimiento post-reserva',
      'Integraciones con herramientas de comunicación y gestión interna',
      'Registro automático de cada cliente, tour reservado y datos de contacto',
    ],
    coverImage: 'https://assets.cdn.filesafe.space/hdVpvshZP3RGJQbxx8GA/media/69d5723cbeaa70357710eec8.jpg',
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
    id: 'ao',
    name: 'AO Liquidation Warehouse',
    industry: 'Comercio Mayorista',
    tagline: 'Sitio web y sistema digital para el principal distribuidor de liquidaciones de Costa Rica.',
    url: 'https://www.aoliquidationwarehouse.com/',
    story: 'AO Liquidation Warehouse es el proveedor oficial de mercancía de liquidación de retailers estadounidenses en Costa Rica — Amazon, Target, Walmart, Home Depot. Tenían presencia física y años de experiencia, pero no una plataforma digital que estuviera a la altura de la operación. Les construimos una presencia online que transmite autoridad y confianza, y que genera leads de clientes B2B calificados de forma constante.',
    deliverables: [
      'Sitio web profesional con diseño que comunica autoridad en el mercado de liquidaciones',
      'Catálogo de productos y lotes organizado por categorías (pallets, lotes, contenedores)',
      'Sección de "About Us" que posiciona los 15+ años de experiencia y la relación con retailers premium',
      'Sistema de contacto y solicitud de cotización directo al equipo de ventas',
      'Integración con redes sociales para captura de leads desde múltiples canales',
      'Optimización SEO local para búsquedas de distribuidores mayoristas en Costa Rica',
      'Estructura pensada para operaciones B2B: lenguaje, propuesta de valor y CTAs para emprendedores y empresas',
    ],
    coverImage: 'https://assets.cdn.filesafe.space/hdVpvshZP3RGJQbxx8GA/media/69d5723cebf1a608431006fb.jpg',
    images: [
      'https://assets.cdn.filesafe.space/hdVpvshZP3RGJQbxx8GA/media/69d5723cebf1a608431006fb.jpg',
    ],
  },
]

const features = [
  { n: '01', t: 'Diseño a medida', d: 'Interfaz construida sobre tu identidad de marca — nunca plantillas genéricas.' },
  { n: '02', t: 'Hasta 8 páginas', d: 'Inicio, servicios, nosotros, contacto y más. Cada página pensada para convertir.' },
  { n: '03', t: 'SEO técnico', d: 'Estructura semántica, velocidad, meta tags y sitemap para posicionar desde el día uno.' },
  { n: '04', t: 'Captura de leads', d: 'Formularios directos a tu correo, WhatsApp o CRM sin fricciones.' },
  { n: '05', t: 'Integraciones', d: 'Conectamos con las herramientas que ya usás sin procesos intermedios.' },
  { n: '06', t: 'Entrega rápida', d: 'La mayoría de proyectos listos en 5–10 días hábiles desde el briefing.' },
]

const steps = [
  { n: '01', t: 'Diagnóstico', d: 'Entendemos tu negocio, objetivos y mensaje. Definimos estructura y tono.' },
  { n: '02', t: 'Construcción', d: 'Diseño + desarrollo + SEO + integraciones. Avances en tiempo real.' },
  { n: '03', t: 'Entrega', d: 'Sitio funcionando. Correcciones incluidas hasta que estés conforme al 100%.' },
]

const faqs = [
  { q: '¿Hosting y dominio incluidos?', a: 'No. El sitio se entrega listo para deployar donde prefieras. Te asesoramos sin costo adicional.' },
  { q: '¿Cuánto tarda la entrega?', a: '5 a 10 días hábiles según complejidad y velocidad de entrega del material de tu parte.' },
  { q: '¿Puedo pedir cambios después?', a: 'Una ronda de correcciones incluida post-entrega. Cambios adicionales se cotizan por separado.' },
  { q: '¿Ya tengo sitio, solo quiero mejorarlo?', a: 'Hacemos una auditoría y te proponemos mejoras. Lo cotizamos según el alcance.' },
]

export default function SitiosWebPage() {
  return (
    <div className="min-h-screen bg-[#080808] text-white antialiased">

      {/* ═══════════════════════════════════════════════
          HERO — full-screen centered, single bg image
      ═══════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden text-center">

        {/* Single background image */}
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

        {/* Layered overlays */}
        <div className="absolute inset-0 bg-[#080808]/60" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#080808]/50 via-transparent to-[#080808]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_50%,rgba(249,115,22,0.08),transparent)]" />

        {/* Back nav — top left */}
        <Link
          href="/precios"
          className="absolute top-8 left-6 md:left-12 inline-flex items-center gap-2 text-white/40 hover:text-white/70 transition-colors text-sm z-10"
        >
          <ArrowLeft size={13} />
          Precios
        </Link>

        {/* Content — centered */}
        <div className="relative z-10 max-w-4xl mx-auto px-6 md:px-12 py-32 flex flex-col items-center">

          {/* Badge */}
          <div
            className="inline-flex items-center gap-2.5 mb-10 px-4 py-2 rounded-full"
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(12px)' }}
          >
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#F97316] text-white">
              Servicio
            </span>
            <span className="text-sm text-white/75">Sitios web profesionales</span>
          </div>

          {/* Headline */}
          <h1
            className="font-bold tracking-tight leading-[0.92] text-white mb-7"
            style={{ fontSize: 'clamp(3.2rem, 8vw, 7.5rem)' }}
          >
            Tu mejor vendedor,
            <br />
            <span style={{ color: 'rgba(255,255,255,0.3)' }}>online 24/7.</span>
          </h1>

          <p className="text-lg text-white/55 leading-relaxed max-w-xl mb-12">
            Diseño a medida, SEO incluido y entrega en tiempo récord —
            para que tu presencia online trabaje mientras vos descansás.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 mb-20">
            <Link
              href={AGENDAR}
              className="inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-full bg-[#F97316] hover:bg-[#ea6c0c] text-white font-semibold text-sm transition-all hover:shadow-[0_0_40px_rgba(249,115,22,0.5)] active:scale-[0.98]"
            >
              Agendar llamada gratis
              <ArrowRight size={15} />
            </Link>
            <a
              href={STRIPE}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-full font-semibold text-sm text-white/65 hover:text-white transition-all"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(12px)' }}
            >
              Contratar — $997
            </a>
          </div>

          {/* Stats row */}
          <div
            className="flex items-center gap-8 mb-12 pb-12 w-full justify-center"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}
          >
            {[['4+', 'Proyectos entregados'], ['$997', 'Precio único'], ['≤10 días', 'Tiempo de entrega']].map(([v, l]) => (
              <div key={l}>
                <p className="text-3xl font-bold text-white">{v}</p>
                <p className="text-xs text-white/30 mt-1 uppercase tracking-wider">{l}</p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          PROYECTOS
      ═══════════════════════════════════════════════ */}
      <section className="py-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#F97316] mb-5">Proyectos realizados</p>
              <h2 className="font-bold tracking-tight leading-[0.92]" style={{ fontSize: 'clamp(2.8rem, 6vw, 5.5rem)' }}>
                El trabajo<br />
                <span style={{ color: 'rgba(255,255,255,0.2)' }}>habla solo.</span>
              </h2>
            </div>
            <p className="text-sm text-white/35 max-w-xs leading-relaxed">
              Hacé clic en cualquier proyecto para ver la historia completa, lo que construimos y la galería.
            </p>
          </div>
          <ClientCardsSlider clients={clients} />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          QUÉ INCLUYE
      ═══════════════════════════════════════════════ */}
      <section className="py-32" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="mb-20">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#F97316] mb-5">Lo que obtenés</p>
            <h2 className="font-bold tracking-tight leading-[0.92]" style={{ fontSize: 'clamp(2.8rem, 6vw, 5.5rem)' }}>
              Todo incluido.<br />
              <span style={{ color: 'rgba(255,255,255,0.2)' }}>Sin sorpresas.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px" style={{ background: 'rgba(255,255,255,0.05)' }}>
            {features.map(f => (
              <div key={f.n} className="relative bg-[#080808] px-9 py-10 overflow-hidden group hover:bg-[#0d0d0d] transition-colors cursor-default">
                <p className="text-xs font-mono text-[#F97316]/40 mb-7 tracking-widest">{f.n}</p>
                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-white transition-colors">{f.t}</h3>
                <p className="text-sm text-white/40 leading-relaxed">{f.d}</p>
                <div className="absolute bottom-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'linear-gradient(to right, transparent, rgba(249,115,22,0.3), transparent)' }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          PROCESO
      ═══════════════════════════════════════════════ */}
      <section className="py-32" style={{ background: '#0a0a0a', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="mb-20">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#F97316] mb-5">El proceso</p>
            <h2 className="font-bold tracking-tight leading-[0.92]" style={{ fontSize: 'clamp(2.8rem, 6vw, 5.5rem)' }}>
              Simple y<br />
              <span style={{ color: 'rgba(255,255,255,0.2)' }}>sin vueltas.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-0" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
            {steps.map((s, i) => (
              <div key={s.n} className="pt-10 pb-4 md:pr-16" style={{ borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.05)' : undefined }}>
                <p className="text-xs font-mono text-white/20 mb-8 tracking-widest">// {s.n}</p>
                <h3 className="text-2xl font-bold text-white mb-4">{s.t}</h3>
                <p className="text-sm text-white/40 leading-relaxed">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          PRECIO
      ═══════════════════════════════════════════════ */}
      <section className="py-32" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#F97316] mb-5">Inversión</p>
              <h2 className="font-bold tracking-tight leading-[0.92] mb-8" style={{ fontSize: 'clamp(2.8rem, 6vw, 5.5rem)' }}>
                Un precio.<br />
                <span style={{ color: 'rgba(255,255,255,0.2)' }}>Todo adentro.</span>
              </h2>
              <p className="text-base text-white/40 leading-relaxed max-w-sm">
                Sin módulos adicionales. Sin licencias escondidas.
                Lo que ves es exactamente lo que pagás, una sola vez.
              </p>
            </div>

            <div>
              <div className="mb-10">
                <p className="text-[5.5rem] font-bold text-white leading-none mb-2">$997</p>
                <p className="text-sm text-white/30">Pago único · Sin costos recurrentes</p>
              </div>

              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3.5 mb-12">
                {['Diseño a medida de tu marca', 'Hasta 8 páginas completas', 'SEO técnico y on-page', 'Formularios de captura', 'Integración con tus herramientas', 'Entrega en máx. 10 días hábiles', 'Correcciones incluidas', 'Asesoría en hosting y dominio'].map(item => (
                  <li key={item} className="flex items-center gap-2.5 text-sm text-white/55">
                    <Check size={13} className="text-[#F97316] shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>

              <div className="flex flex-wrap gap-3">
                <a href={STRIPE} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-[#F97316] hover:bg-[#ea6c0c] text-white font-semibold text-sm transition-all hover:shadow-[0_0_40px_rgba(249,115,22,0.4)]">
                  Contratar ahora
                  <ArrowRight size={15} />
                </a>
                <Link href={AGENDAR} className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-semibold text-sm text-white/55 hover:text-white transition-all" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)' }}>
                  Primero quiero hablar
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          FAQ
      ═══════════════════════════════════════════════ */}
      <section className="py-32" style={{ background: '#0a0a0a', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="max-w-3xl mx-auto px-6 md:px-12">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#F97316] mb-5">FAQ</p>
          <h2 className="font-bold tracking-tight leading-[0.92] mb-16" style={{ fontSize: 'clamp(2.5rem, 5vw, 4.5rem)' }}>
            Preguntas<br />
            <span style={{ color: 'rgba(255,255,255,0.2)' }}>frecuentes.</span>
          </h2>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
            {faqs.map(faq => (
              <details key={faq.q} className="group" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                <summary className="flex items-center justify-between gap-6 py-7 cursor-pointer list-none text-lg font-semibold text-white/65 hover:text-white transition-colors">
                  {faq.q}
                  <ChevronDown size={18} className="shrink-0 text-white/20 group-open:rotate-180 transition-transform duration-300" />
                </summary>
                <p className="pb-7 text-sm text-white/40 leading-relaxed max-w-xl">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          CTA FINAL
      ═══════════════════════════════════════════════ */}
      <section className="relative py-40 overflow-hidden" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_80%_at_50%_50%,rgba(249,115,22,0.08),transparent)] pointer-events-none" />
        <div className="relative z-10 max-w-3xl mx-auto px-6 md:px-12 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#F97316] mb-6">¿Listo para empezar?</p>
          <h2 className="font-bold tracking-tight leading-[0.92] text-white mb-8" style={{ fontSize: 'clamp(2.8rem, 7vw, 6rem)' }}>
            Hablemos<br />
            <span style={{ color: 'rgba(255,255,255,0.2)' }}>de tu proyecto.</span>
          </h2>
          <p className="text-base text-white/40 leading-relaxed mb-14 max-w-md mx-auto">
            30 minutos, sin compromiso, sin presión.
            Entendemos lo que necesitás y te damos una propuesta concreta.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href={AGENDAR} className="inline-flex items-center justify-center gap-2.5 px-10 py-4 rounded-full bg-[#F97316] hover:bg-[#ea6c0c] text-white font-semibold transition-all hover:shadow-[0_0_48px_rgba(249,115,22,0.45)]">
              Agendar llamada gratis
              <ArrowRight size={16} />
            </Link>
            <Link href="/precios" className="inline-flex items-center justify-center gap-2.5 px-10 py-4 rounded-full font-semibold text-white/45 hover:text-white transition-all" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)' }}>
              Ver todos los servicios
            </Link>
          </div>
        </div>
      </section>

    </div>
  )
}
