import Link from 'next/link'
import { ArrowRight, Globe, BarChart3, MessageSquare, Zap, Cpu, LayoutDashboard, TrendingUp } from 'lucide-react'

const allServices = [
  { slug: 'sitios-web',           name: 'Sitios web profesionales',     desc: 'Diseño, SEO y entrega en tiempo récord.',                     href: '/servicios/sitios-web',           icon: Globe },
  { slug: 'automatizacion',       name: 'Automatización de procesos',   desc: 'Flujos, agentes de IA e integraciones a medida.',             href: '/servicios/automatizacion',       icon: Cpu },
  { slug: 'produccion-contenido', name: 'Producción de contenido',      desc: 'Videos, stories y estrategia editorial mes a mes.',           href: '/servicios/produccion-contenido', icon: BarChart3 },
  { slug: 'campanas',             name: 'Campañas publicitarias',       desc: 'Meta Ads y Google Ads gestionados de punta a punta.',         href: '/servicios/campanas',             icon: MessageSquare },
  { slug: 'sistemas-internos',    name: 'Sistemas internos a medida',   desc: 'CRMs, dashboards y herramientas construidas para tu equipo.', href: '/servicios/sistemas-internos',    icon: LayoutDashboard },
  { slug: 'asesoria',             name: 'Asesoría de marketing',        desc: 'Estrategia, posicionamiento y roadmap de 90 días.',           href: '/servicios/asesoria',             icon: Zap },
  { slug: 'funnel-labs',          name: 'FunnelLab',                    desc: 'Simulá tu funnel completo antes de gastar en publicidad.',    href: 'https://funnellabs.bralto.io',    icon: TrendingUp },
]

export function ServiciosRelacionados({ exclude }: { exclude: string }) {
  const related = allServices.filter(s => s.slug !== exclude).slice(0, 3)

  return (
    <section className="py-24" style={{ background: '#0a0a0a', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#F97316] mb-10">
          Servicios que quizá te interesen
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {related.map(s => (
            <Link
              key={s.slug}
              href={s.href}
              className="group rounded-2xl p-7 flex flex-col gap-5 transition-all hover:bg-white/[0.03]"
              style={{ border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 border border-white/8 group-hover:bg-[#F97316]/10 group-hover:border-[#F97316]/20 transition-all">
                <s.icon size={16} className="text-white/35 group-hover:text-[#F97316] transition-colors" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-semibold text-white mb-1.5">{s.name}</h3>
                <p className="text-sm text-white/40 leading-relaxed">{s.desc}</p>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-white/30 group-hover:text-[#F97316] transition-colors">
                Ver servicio <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
