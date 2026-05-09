'use client'
import Link from 'next/link'
import { ArrowRight, Globe, BarChart3, MessageSquare, Zap, Cpu, LayoutDashboard, TrendingUp } from 'lucide-react'
import { useLocale } from 'next-intl'

const SERVICE_DEFS = [
  { slug: 'sitios-web',           nameEs: 'Sitios web profesionales',     nameEn: 'Professional websites',       descEs: 'Diseño, SEO y entrega en tiempo récord.',                     descEn: 'Custom design, SEO, and fast turnaround.',                    path: (l: string) => `/${l}/servicios/sitios-web`,           icon: Globe },
  { slug: 'automatizacion',       nameEs: 'Automatización de procesos',   nameEn: 'Process automation',          descEs: 'Flujos, agentes de IA e integraciones a medida.',             descEn: 'Workflows, AI agents, and custom integrations.',              path: (l: string) => `/${l}/servicios/automatizacion`,       icon: Cpu },
  { slug: 'produccion-contenido', nameEs: 'Producción de contenido',      nameEn: 'Content production',          descEs: 'Videos, stories y estrategia editorial mes a mes.',           descEn: 'Videos, stories, and monthly editorial strategy.',            path: (l: string) => `/${l}/servicios/produccion-contenido`, icon: BarChart3 },
  { slug: 'campanas',             nameEs: 'Campañas publicitarias',       nameEn: 'Ad campaigns',                descEs: 'Meta Ads y Google Ads gestionados de punta a punta.',         descEn: 'End-to-end Meta Ads and Google Ads management.',              path: (l: string) => `/${l}/servicios/campanas`,             icon: MessageSquare },
  { slug: 'sistemas-internos',    nameEs: 'Sistemas internos a medida',   nameEn: 'Custom internal tools',       descEs: 'CRMs, dashboards y herramientas construidas para tu equipo.', descEn: 'CRMs, dashboards, and tools built for your team.',            path: (l: string) => `/${l}/servicios/sistemas-internos`,    icon: LayoutDashboard },
  { slug: 'asesoria',             nameEs: 'Asesoría de marketing',        nameEn: 'Marketing consulting',        descEs: 'Estrategia, posicionamiento y roadmap de 90 días.',           descEn: 'Strategy, positioning, and a 90-day growth roadmap.',         path: (l: string) => `/${l}/servicios/asesoria`,             icon: Zap },
  { slug: 'funnel-labs',          nameEs: 'FunnelLab',                    nameEn: 'FunnelLab',                   descEs: 'Simulá tu funnel completo antes de gastar en publicidad.',    descEn: 'Simulate your full funnel before spending on ads.',           path: () => 'https://funnellabs.bralto.io',                  icon: TrendingUp },
]

const LABEL = { es: 'Servicios que quizá te interesen', en: 'Services you might like' }
const CTA   = { es: 'Ver servicio', en: 'View service' }

export function ServiciosRelacionados({ exclude }: { exclude: string }) {
  const locale = useLocale()
  const isEn = locale === 'en'
  const related = SERVICE_DEFS.filter(s => s.slug !== exclude).slice(0, 3)

  return (
    <section className="py-24">
      <div className="max-w-6xl mx-auto px-6 md:px-12">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/28 mb-10">
          {isEn ? LABEL.en : LABEL.es}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {related.map(s => (
            <Link
              key={s.slug}
              href={s.path(locale)}
              className="group rounded-card p-7 flex flex-col gap-5 transition-all"
              style={{ background: '#131316', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.04] border border-white/[0.07] group-hover:bg-[#ffa845]/10 group-hover:border-[#ffa845]/20 transition-all">
                <s.icon size={16} className="text-white/35 group-hover:text-[#ffa845] transition-colors" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-semibold text-white mb-1.5">{isEn ? s.nameEn : s.nameEs}</h3>
                <p className="text-sm text-white/40 leading-relaxed">{isEn ? s.descEn : s.descEs}</p>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-white/30 group-hover:text-[#ffa845] transition-colors">
                {isEn ? CTA.en : CTA.es} <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
