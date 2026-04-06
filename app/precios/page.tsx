import Link from 'next/link'
import { ArrowLeft, Check, Globe, BarChart3, Cpu, LayoutDashboard, ArrowRight, Star } from 'lucide-react'

const AGENDAR = '/agendar'

// ─── Servicios individuales ───────────────────────────────────────────────────

const services = [
  {
    icon: Globe,
    name: 'Sitio web profesional',
    href: '/servicios/sitios-web',
    price: '$997',
    priceSuffix: 'pago único',
    description: 'Todo incluido: diseño, hasta 8 páginas, SEO on-page, formularios de contacto e integración básica. Entrega en tiempo récord.',
    features: [
      'Diseño a medida de tu marca',
      'Hasta 8 páginas optimizadas',
      'SEO técnico y on-page incluido',
      'Formularios y contacto directo',
      'Hosting y dominio no incluidos',
    ],
    cta: { label: 'Ver detalles', href: '/servicios/sitios-web', stripe: false },
  },
  {
    icon: BarChart3,
    name: 'Producción de contenido',
    href: '/servicios/produccion-contenido',
    price: null,
    priceSuffix: 'mensual',
    description: 'Contenido profesional para redes sociales, con estrategia editorial y producción completa incluida.',
    plans: [
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
      },
    ],
    features: [],
    cta: { label: 'Ver detalles', href: '/servicios/produccion-contenido', stripe: false },
  },
  {
    icon: Cpu,
    name: 'Automatización de procesos',
    href: '/servicios/automatizacion',
    price: '$1,450',
    priceSuffix: 'pago único',
    description: 'Workflow completo, agente de IA configurado, integraciones con tus herramientas, documentación y soporte por 30 días.',
    features: [
      'Diagnóstico de procesos incluido',
      'Workflow end-to-end configurado',
      'Agente de IA a medida',
      'Integraciones con tus herramientas',
      'Soporte post-entrega por 30 días',
    ],
    cta: { label: 'Ver detalles', href: '/servicios/automatizacion', stripe: false },
  },
  {
    icon: LayoutDashboard,
    name: 'Sistemas internos a medida',
    href: '/servicios/sistemas-internos',
    price: 'Desde $1,997',
    priceSuffix: 'según alcance',
    description: 'CRMs, dashboards, portales internos y herramientas de gestión construidas exactamente para tu operación.',
    features: [
      'Análisis de requerimientos incluido',
      'Interfaz diseñada a tu flujo',
      'Integraciones con sistemas existentes',
      'Documentación técnica',
      'Precio final según complejidad',
    ],
    cta: { label: 'Agendar llamada', href: AGENDAR, stripe: false },
  },
]

// ─── Combos ───────────────────────────────────────────────────────────────────

const combos = [
  {
    tag: 'Popular',
    name: 'Combo Crecimiento Digital',
    price: '$2,297',
    includes: ['Sitio web profesional', 'Automatización de procesos', 'Sistema interno básico'],
    description: 'Para empresas que quieren digitalizar operaciones y tener presencia sólida.',
    note: 'Precio especial por proyecto integral coordinado por un mismo equipo.',
  },
  {
    tag: 'Más completo',
    name: 'Combo Presencia Total',
    price: '$2,997',
    includes: [
      'Sitio web profesional',
      'Automatización de procesos',
      'Sistema interno básico',
      'Producción de contenido — Plan Esencial (primer mes)',
    ],
    description: 'Para negocios que quieren crecer en digital con todo resuelto desde el día uno.',
    note: 'Todo coordinado por un mismo equipo — sin fricción entre servicios.',
  },
]

// ─── Component ────────────────────────────────────────────────────────────────

export default function PreciosPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white px-4 py-10 md:py-16">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_80%_35%_at_50%_0%,rgba(249,115,22,0.05),transparent)] pointer-events-none" />

      <div className="relative z-10 max-w-4xl mx-auto">

        {/* Back */}
        <Link href="/" className="inline-flex items-center gap-2 text-white/30 hover:text-white/55 transition-colors text-sm mb-10">
          <ArrowLeft size={14} />
          Volver al inicio
        </Link>

        {/* Header */}
        <div className="mb-14">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1.5 h-1.5 rounded-full bg-[#F97316]" />
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#F97316]">Precios</p>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-4">
            Inversión clara,<br />resultados concretos.
          </h1>
          <p className="text-sm text-white/40 max-w-xl leading-relaxed">
            Sin costos ocultos. Sin sorpresas. Cada servicio tiene un precio fijo o un rango claro — sabés exactamente en qué estás invirtiendo.
          </p>
        </div>

        {/* ── Servicios individuales ── */}
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/25 mb-6">Servicios individuales</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-16">
          {services.map((s) => (
            <div key={s.name} className="rounded-2xl border border-white/8 bg-white/[0.025] p-5 flex flex-col">
              {/* Header */}
              <div className="flex items-start gap-3 mb-4">
                <div className="shrink-0 flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 border border-white/10">
                  <s.icon size={15} className="text-white/40" />
                </div>
                <div>
                  <Link href={s.href} className="text-sm font-semibold text-white hover:text-[#F97316] transition-colors leading-tight">
                    {s.name}
                  </Link>
                  {s.price && (
                    <div className="flex items-baseline gap-1.5 mt-1">
                      <span className="text-xl font-bold text-white">{s.price}</span>
                      <span className="text-xs text-white/30">{s.priceSuffix}</span>
                    </div>
                  )}
                </div>
              </div>

              <p className="text-xs text-white/40 leading-relaxed mb-4">{s.description}</p>

              {/* Plans (content production) */}
              {'plans' in s && s.plans && (
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {s.plans.map((plan) => (
                    <div key={plan.name} className="rounded-xl border border-white/8 bg-white/[0.03] p-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-white/30 mb-1">{plan.name}</p>
                      <p className="text-base font-bold text-white">
                        {plan.price}<span className="text-xs font-normal text-white/30">{plan.suffix}</span>
                      </p>
                      <ul className="mt-2 space-y-0.5">
                        {plan.items.map((item) => (
                          <li key={item} className="flex items-center gap-1.5 text-[11px] text-white/40">
                            <Check size={10} className="text-[#F97316] shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}

              {/* Features */}
              {s.features.length > 0 && (
                <ul className="space-y-1.5 mb-5 flex-1">
                  {s.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs text-white/45">
                      <Check size={11} className="text-[#F97316] shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-auto pt-4">
                <Link
                  href={s.cta.href}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/50 hover:text-white transition-colors group"
                >
                  {s.cta.label}
                  <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* ── Combos ── */}
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/25 mb-2">Combos destacados</p>
          <p className="text-sm text-white/35">Contratá varios servicios juntos con una sola coordinación y un precio especial.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-16">
          {combos.map((combo, i) => (
            <div
              key={combo.name}
              className={`rounded-2xl border p-6 flex flex-col ${
                i === 1
                  ? 'border-[#F97316]/30 bg-[#F97316]/[0.04]'
                  : 'border-white/10 bg-white/[0.03]'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                  i === 1
                    ? 'bg-[#F97316]/15 border-[#F97316]/25 text-[#F97316]'
                    : 'bg-white/5 border-white/10 text-white/40'
                }`}>
                  {combo.tag}
                </span>
                {i === 1 && <Star size={14} className="text-[#F97316]/60" />}
              </div>

              <h3 className="text-lg font-bold text-white mb-1">{combo.name}</h3>
              <p className="text-3xl font-bold text-white mb-1">{combo.price}</p>
              <p className="text-xs text-white/30 mb-4 italic">{combo.note}</p>

              <p className="text-xs text-white/45 leading-relaxed mb-5">{combo.description}</p>

              <ul className="space-y-2 mb-6 flex-1">
                {combo.includes.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-xs text-white/55">
                    <Check size={11} className="text-[#F97316] shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>

              <Link
                href={AGENDAR}
                className={`flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all ${
                  i === 1
                    ? 'bg-[#F97316] hover:bg-[#ea6c0c] text-white hover:shadow-[0_0_20px_rgba(249,115,22,0.3)]'
                    : 'bg-white/6 hover:bg-white/10 border border-white/10 hover:border-white/18 text-white/70 hover:text-white'
                }`}
              >
                Agendar llamada
                <ArrowRight size={14} />
              </Link>
            </div>
          ))}
        </div>

        {/* ── Servicio integral ── */}
        <div className="rounded-2xl border border-white/8 bg-gradient-to-br from-white/[0.03] to-[#F97316]/[0.03] p-8 md:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#F97316] mb-4">Servicio integral personalizado</p>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4 leading-tight">
            ¿Tu negocio necesita algo más complejo?
          </h2>
          <p className="text-sm text-white/45 leading-relaxed max-w-xl mb-3">
            Para proyectos con múltiples integraciones, equipos involucrados y acompañamiento continuo. Trabajamos codo a codo para diseñar, implementar y mantener tu infraestructura digital completa.
          </p>
          <p className="text-sm text-white/30 mb-8">
            Precio según alcance del proyecto.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href={AGENDAR}
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-[#F97316] hover:bg-[#ea6c0c] text-white text-sm font-semibold transition-all hover:shadow-[0_0_24px_rgba(249,115,22,0.35)]"
            >
              Agendar llamada estratégica
              <ArrowRight size={15} />
            </Link>
            <Link
              href="/#casos-reales"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl border border-white/10 hover:border-white/20 text-white/55 hover:text-white text-sm font-semibold transition-all"
            >
              Ver casos de éxito
            </Link>
          </div>
        </div>

      </div>
    </div>
  )
}
