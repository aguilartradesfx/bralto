import Link from 'next/link'
import { ArrowLeft, ArrowRight, Globe, BarChart3, MessageSquare, Zap, Cpu, LayoutDashboard, TrendingUp } from 'lucide-react'

const AGENDAR = '/agendar'

const services = [
  {
    icon: Globe,
    slug: 'sitios-web',
    name: 'Sitios web profesionales',
    href: '/servicios/sitios-web',
    from: 'Desde $997',
    period: 'pago único',
    desc: 'Diseño a medida, SEO incluido y entrega rápida. Tu presencia online lista para convertir.',
  },
  {
    icon: BarChart3,
    slug: 'produccion-contenido',
    name: 'Producción de contenido',
    href: '/servicios/produccion-contenido',
    from: 'Desde $650',
    period: 'por mes',
    desc: 'Videos, stories y estrategia editorial mensual. Producimos y publicamos por vos.',
  },
  {
    icon: MessageSquare,
    slug: 'campanas',
    name: 'Campañas publicitarias',
    href: '/servicios/campanas',
    from: 'A convenir',
    period: 'fee de gestión mensual',
    desc: 'Gestión de Meta Ads y Google Ads de punta a punta, con optimización y reporte semanal.',
  },
  {
    icon: Cpu,
    slug: 'automatizacion',
    name: 'Automatización de procesos',
    href: '/servicios/automatizacion',
    from: 'Desde $1,450',
    period: 'pago único',
    desc: 'Workflows, agentes de IA e integraciones que hacen correr tu operación sola.',
  },
  {
    icon: LayoutDashboard,
    slug: 'sistemas-internos',
    name: 'Sistemas internos a medida',
    href: '/servicios/sistemas-internos',
    from: 'Desde $1,997',
    period: 'según alcance',
    desc: 'CRMs, dashboards, portales internos y herramientas construidas para tu operación.',
  },
  {
    icon: Zap,
    slug: 'asesoria',
    name: 'Asesoría de marketing',
    href: '/servicios/asesoria',
    from: 'A convenir',
    period: 'según formato',
    desc: 'Estrategia, posicionamiento y roadmap de 90 días para crecer con intención.',
  },
  {
    icon: TrendingUp,
    slug: 'funnel-labs',
    name: 'FunnelLab',
    href: 'https://funnellabs.bralto.io',
    from: 'Gratis',
    period: 'para empezar',
    desc: 'Simulá tu embudo de ventas completo, identificá cuellos de botella y elegí la estrategia más rentable antes de invertir.',
  },
]

export default function PreciosPage() {
  return (
    <div className="min-h-screen bg-[#060607] text-white antialiased">

      {/* ═══════════════════════════════════════════
          HERO
      ═══════════════════════════════════════════ */}
      <section className="grid-bg relative pt-40 pb-28 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(91,182,255,0.05),transparent)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#060607]" />

        <Link
          href="/"
          className="absolute top-20 left-6 md:left-12 inline-flex items-center gap-2 text-white/40 hover:text-white/70 transition-colors text-sm z-10"
        >
          <ArrowLeft size={13} />
          Inicio
        </Link>

        <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12">
          <div
            className="inline-flex items-center gap-2.5 mb-10 px-4 py-2 rounded-full"
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(12px)' }}
          >
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#5bb6ff] text-white">
              Bralto
            </span>
            <span className="text-sm text-white/75">Servicios y precios</span>
          </div>

          <h1
            className="font-bold tracking-tight leading-[0.92] text-white mb-7"
            style={{ fontSize: 'clamp(2.4rem, 5vw, 4.2rem)' }}
          >
            Todo lo que
            <br />
            <em style={{ fontFamily: 'var(--font-instrument-serif)', fontStyle: 'italic', fontWeight: 400, color: 'rgba(255,255,255,0.25)' }}>hacemos.</em>
          </h1>

          <p className="text-lg text-white/50 leading-relaxed max-w-xl">
            Precios de referencia para que tengas una idea.
            El definitivo siempre depende del alcance — lo cerramos juntos en la llamada.
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          SERVICIOS GRID
      ═══════════════════════════════════════════ */}
      <section className="pb-32" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map((s) => (
              <Link
                key={s.slug}
                href={s.href}
                className="group relative rounded-card bg-[#131316] border border-white/[0.06] px-9 py-10 flex flex-col gap-6 hover:bg-[#1a1a1e] transition-colors"
              >
                {/* Icon */}
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 border border-white/8 group-hover:bg-[#5bb6ff]/10 group-hover:border-[#5bb6ff]/20 transition-all">
                  <s.icon size={16} className="text-white/35 group-hover:text-[#5bb6ff] transition-colors" />
                </div>

                {/* Name + description */}
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white mb-3">{s.name}</h3>
                  <p className="text-sm text-white/40 leading-relaxed">{s.desc}</p>
                </div>

                {/* Price */}
                <div>
                  <p className="text-2xl font-bold text-white">{s.from}</p>
                  <p className="text-xs text-white/30 mt-0.5 uppercase tracking-wider">{s.period}</p>
                </div>

                {/* CTA hint */}
                <div className="flex items-center gap-1.5 text-xs font-semibold text-white/30 group-hover:text-[#5bb6ff] transition-colors">
                  Ver detalles
                  <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                </div>

                {/* Bottom shimmer */}
                <div
                  className="absolute bottom-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: 'linear-gradient(to right, transparent, rgba(91,182,255,0.2), transparent)' }}
                />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          CTA FINAL
      ═══════════════════════════════════════════ */}
      <section className="relative py-40 overflow-hidden" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_80%_at_50%_50%,rgba(255,168,69,0.05),transparent)] pointer-events-none" />
        <div className="relative z-10 max-w-3xl mx-auto px-6 md:px-12 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#5bb6ff] mb-6">¿No sabés por dónde empezar?</p>
          <h2
            className="font-bold tracking-tight leading-[0.92] text-white mb-8"
            style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)' }}
          >
            Hablemos<br />
            <span style={{ color: 'rgba(255,255,255,0.2)' }}>sin compromiso.</span>
          </h2>
          <p className="text-base text-white/40 leading-relaxed mb-14 max-w-md mx-auto">
            30 minutos para entender tu negocio y proponerte
            qué tiene sentido para vos hoy.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href={AGENDAR}
              className="inline-flex items-center justify-center gap-2.5 px-10 py-4 rounded-full bg-[#ffa845] hover:bg-[#f59e0b] text-black font-semibold transition-all hover:shadow-[0_0_48px_rgba(255,168,69,0.25)]"
            >
              Agendar llamada gratis
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2.5 px-10 py-4 rounded-full font-semibold text-white/45 hover:text-white transition-all"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)' }}
            >
              Volver al inicio
            </Link>
          </div>
        </div>
      </section>

    </div>
  )
}
