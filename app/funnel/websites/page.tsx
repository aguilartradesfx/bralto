"use client"

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  Check, Globe, Smartphone, Zap, Search,
  BarChart3, Layout, Code2, Settings, ArrowRight,
} from 'lucide-react'

const AGENDAR = '/agendar'

/* ─── Portfolio ─────────────────────────────────────────────────────── */
const projects = [
  { name: 'Ecoviva',         src: 'https://assets.cdn.filesafe.space/hdVpvshZP3RGJQbxx8GA/media/69d5723cf5ebf27de325201b.jpg' },
  { name: 'AO Liquidation',  src: 'https://assets.cdn.filesafe.space/hdVpvshZP3RGJQbxx8GA/media/69d5723cebf1a608431006fb.jpg' },
  { name: 'Travelcore',      src: 'https://assets.cdn.filesafe.space/hdVpvshZP3RGJQbxx8GA/media/69d5723cbeaa70357710eec8.jpg' },
  { name: 'Nanku',           src: 'https://assets.cdn.filesafe.space/hdVpvshZP3RGJQbxx8GA/media/69d5723c6584e0c530f51dff.jpg' },
]

/* ─── Content ───────────────────────────────────────────────────────── */
const heroPoints = [
  'Ahorrás tiempo y dolores de cabeza en diseño y desarrollo',
  'Mejoramos los puntos débiles de tu presencia digital actual',
  'Descubrimos cómo resolver "tengo web pero no llegan clientes"',
  'Aumentamos la percepción visual volviéndola premium',
  'Creamos una web que trabaja por vos las 24 horas, los 7 días',
]
const e1Features = [
  { Icon: Layout,     label: 'Creado en Figma' },
  { Icon: Code2,      label: 'Recursos a Medida' },
  { Icon: Smartphone, label: 'Diseño Responsive' },
  { Icon: Zap,        label: '100% Optimizado' },
  { Icon: Settings,   label: 'Optimización UX/UI' },
]
const e3Features = [
  { Icon: Code2,      label: 'Animaciones CSS' },
  { Icon: Smartphone, label: 'Mobile-First' },
  { Icon: Layout,     label: 'Diseño Responsive' },
  { Icon: Zap,        label: '100% Optimizado' },
  { Icon: Settings,   label: 'Panel de control' },
]
const checklist = [
  'Diseño web personalizado a medida',
  'Auditoría de marca y estrategia',
  'Desarrollo e implementación completa',
  'SEO técnico desde el día uno',
  'Diseño responsive + recursos responsive',
  'Sesión 1 a 1 de revisión y ajustes',
  'Formularios y capturas de leads',
  'Configuraciones de dominio y hosting',
  'Google Analytics integrado',
  '2 semanas de soporte post-entrega',
]
const chats = [
  { text: 'Estuvimos meses dándole vueltas al diseño y vos en pocos días pudiste encontrarle la vuelta.', hl: '¡Más que recomendado!' },
  { text: '¿Cómo hiciste eso?? ¡Quedé impresionado! En palabras, el mejor diseño que tuvimos lejos.', hl: '¡Muchas gracias!!' },
  { text: 'Nos mejoró x2 en consultas en 2 semanas después de cambiar el diseño.', hl: '🔥' },
  { text: 'Que gente talentosa. ¡Apoyo 100% esto y la pasión que le entregan al proyecto!', hl: '' },
  { text: 'La verdad me sorprendió lo que se puede lograr. Nuestra web ahora habla por nosotros.', hl: '¡De verdad!' },
  { text: 'Qué gusto que nos dio al fin conseguir que nuestra página se vea así. ¡Ese cambio que necesitábamos!', hl: '¡Gracias!' },
]
const quiz = [
  { text: 'Sí, está claro desde el primer segundo',  sub: 'Los visitantes entienden al instante qué ofrezco' },
  { text: 'Más o menos, podría ser más específico',   sub: 'Recibo consultas pero no siempre me entienden bien' },
  { text: 'No tengo sitio web todavía',               sub: 'El único modo de contactarme es por Instagram o WhatsApp' },
  { text: 'No tengo un headline claro definido',      sub: 'El título es el nombre de mi empresa o algo genérico' },
]

/* ─── Helpers ───────────────────────────────────────────────────────── */
function Btn({ href, children, variant = 'primary', className = '' }: {
  href: string; children: React.ReactNode; variant?: 'primary' | 'ghost'; className?: string
}) {
  if (variant === 'primary') {
    return (
      <Link href={href}
        className={`inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-[#ffa845] hover:bg-[#f59e0b] text-black font-semibold text-sm tracking-wide transition-colors active:scale-[0.98] ${className}`}>
        {children}
      </Link>
    )
  }
  return (
    <Link href={href}
      className={`inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full text-white/60 hover:text-white font-semibold text-sm tracking-wide transition-colors border border-white/10 hover:border-white/25 ${className}`}>
      {children}
    </Link>
  )
}

function FeatureRow({ Icon, label }: { Icon: React.ElementType; label: string }) {
  return (
    <li className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg border border-[#5bb6ff]/15 flex items-center justify-center shrink-0"
        style={{ background: 'rgba(91,182,255,0.05)' }}>
        <Icon className="w-4 h-4 text-[#5bb6ff]/70" />
      </div>
      <span className="text-sm text-white/65">{label}</span>
    </li>
  )
}

function Badge({ n }: { n: number }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5bb6ff]/70 mb-4 tracking-wider">
      ✦ ENTREGABLE #{n}
    </span>
  )
}

function Card({ children, className = '', accentBorder = false }: {
  children: React.ReactNode; className?: string; accentBorder?: boolean
}) {
  return (
    <div className={`relative rounded-2xl overflow-hidden ${className}`}
      style={{
        background: 'rgba(10,10,10,0.75)',
        border: accentBorder ? '1px solid rgba(91,182,255,0.14)' : '1px solid rgba(255,255,255,0.06)',
        backdropFilter: 'blur(12px)',
      }}>
      {children}
    </div>
  )
}

/* ─── Mini website mockup ───────────────────────────────────────────── */
function MiniWebsite() {
  return (
    <div className="rounded-2xl overflow-hidden shadow-2xl shadow-black/70"
      style={{ border: '1px solid rgba(255,255,255,0.08)', background: '#0a0a0a' }}>
      {/* Chrome */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-white/5"
        style={{ background: '#141414' }}>
        <div className="flex gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: 'rgba(255,95,87,0.55)' }} />
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: 'rgba(254,188,46,0.55)' }} />
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: 'rgba(40,200,64,0.55)' }} />
        </div>
        <div className="flex-1 mx-2 rounded-md px-2.5 py-1 text-[9px] font-mono flex items-center gap-1.5"
          style={{ background: '#1c1c1c', color: 'rgba(255,255,255,0.22)' }}>
          <span style={{ color: 'rgba(255,255,255,0.15)' }}>🔒</span> tunegocio.com
        </div>
      </div>

      {/* Fake website */}
      <div style={{ background: '#0d0d0d' }}>
        {/* Fake nav */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.04]">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ background: 'rgba(91,182,255,0.5)' }} />
            <div className="w-12 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.2)' }} />
          </div>
          <div className="flex gap-2.5">
            {[8, 8, 10].map((w, i) => (
              <div key={i} className={`w-${w} h-1.5 rounded-full`} style={{ background: 'rgba(255,255,255,0.1)' }} />
            ))}
          </div>
          <div className="w-16 h-5 rounded-full" style={{ background: 'rgba(91,182,255,0.35)' }} />
        </div>

        {/* Fake hero */}
        <div className="px-4 pt-5 pb-4 space-y-2 border-b border-white/[0.04]"
          style={{ background: 'radial-gradient(ellipse 80% 70% at 50% 40%, rgba(91,182,255,0.05), transparent)' }}>
          <div className="w-20 h-1.5 rounded-full" style={{ background: 'rgba(91,182,255,0.3)' }} />
          <div className="w-4/5 h-2.5 rounded-full" style={{ background: 'rgba(255,255,255,0.22)' }} />
          <div className="w-full h-2.5 rounded-full" style={{ background: 'rgba(255,255,255,0.16)' }} />
          <div className="w-3/5 h-2.5 rounded-full" style={{ background: 'rgba(255,255,255,0.10)' }} />
          <div className="flex gap-2 pt-2">
            <div className="w-20 h-6 rounded-full" style={{ background: 'rgba(91,182,255,0.5)' }} />
            <div className="w-20 h-6 rounded-full border" style={{ borderColor: 'rgba(255,255,255,0.15)' }} />
          </div>
        </div>

        {/* Fake features */}
        <div className="grid grid-cols-3 gap-2 px-4 py-3 border-b border-white/[0.04]">
          {[0.06, 0.04, 0.03].map((op, i) => (
            <div key={i} className="rounded-xl p-2.5 space-y-1.5"
              style={{ background: `rgba(255,255,255,${op})`, border: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="w-5 h-5 rounded-md" style={{ background: 'rgba(91,182,255,0.16)', border: '1px solid rgba(91,182,255,0.12)' }} />
              <div className="w-full h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.14)' }} />
              <div className="w-3/4 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }} />
              <div className="w-4/5 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }} />
            </div>
          ))}
        </div>

        {/* Fake testimonials */}
        <div className="flex gap-2 px-4 py-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex-1 rounded-xl p-2 space-y-1"
              style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, j) => (
                  <span key={j} className="text-[8px]" style={{ color: 'rgba(91,182,255,0.4)' }}>★</span>
                ))}
              </div>
              <div className="w-full h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }} />
              <div className="w-3/4 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ─── Page ──────────────────────────────────────────────────────────── */
export default function FunnelWebsitesPage() {
  const [answer, setAnswer] = useState<number | null>(null)

  return (
    <div className="relative min-h-screen text-white font-sans antialiased bg-[#060607]">

      <div className="fixed inset-0 z-0 pointer-events-none bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,rgba(91,182,255,0.04),transparent)]" />

      {/* Content */}
      <div className="relative z-10">

        {/* ══════════════════════════════════
            HEADER
        ══════════════════════════════════ */}
        <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-3.5"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(6,6,7,0.85)', backdropFilter: 'blur(16px)' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-[#5bb6ff] flex items-center justify-center shrink-0">
              <span className="text-white text-xs font-black">B</span>
            </div>
            <span className="text-sm font-semibold text-white/75 tracking-wide">Bralto</span>
          </div>

          <nav className="hidden md:flex items-center gap-6">
            {['Servicio', 'Entregables', 'Testimonios'].map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`}
                className="text-sm text-white/40 hover:text-white/75 transition-colors">
                {item}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link href={AGENDAR} className="hidden md:block text-sm text-white/40 hover:text-white/70 transition-colors">
              Ver más
            </Link>
            <Link href={AGENDAR}
              className="px-4 py-2 rounded-full bg-[#ffa845] hover:bg-[#f59e0b] text-black text-xs font-bold uppercase tracking-wider transition-colors">
              Agenda una llamada
            </Link>
          </div>
        </header>

        {/* ══════════════════════════════════
            HERO
        ══════════════════════════════════ */}
        <section id="servicio" className="max-w-6xl mx-auto px-6 pt-16 pb-16 grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
          <div>
            <div className="flex items-center gap-2.5 mb-7">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-white bg-[#5bb6ff]">
                Servicio
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-white/50"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                Diseño + Desarrollo
              </span>
            </div>

            <h1 className="font-bold tracking-tight leading-[0.95] text-white mb-5"
              style={{ fontSize: 'clamp(2.6rem, 5vw, 4rem)' }}>
              Creamos el Sitio Web
              <br />
              <span style={{ color: 'rgba(255,255,255,0.28)' }}>de tu negocio.</span>
            </h1>

            <p className="text-lg text-white/45 leading-relaxed mb-8 max-w-md">
              Diseño profesional, estrategia de conversión y entrega en tiempo récord — para que tu presencia online trabaje mientras vos descansás.
            </p>

            <ul className="space-y-2.5 mb-10">
              {heroPoints.map((b, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-white/48">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#5bb6ff] shrink-0" />
                  {b}
                </li>
              ))}
            </ul>

            <div className="flex flex-col sm:flex-row gap-3">
              <Btn href={AGENDAR}>
                Agendar llamada gratis <ArrowRight className="w-4 h-4" />
              </Btn>
              <Btn href="#entregables" variant="ghost">
                Ver entregables
              </Btn>
            </div>
          </div>

          {/* Mini website */}
          <div className="relative">
            <div className="absolute -inset-1 rounded-3xl opacity-40 pointer-events-none"
              style={{ background: 'linear-gradient(135deg, rgba(91,182,255,0.2), transparent 60%)' }} />
            <MiniWebsite />
          </div>
        </section>

        {/* ══════════════════════════════════
            WHAT WE OFFER
        ══════════════════════════════════ */}
        <section id="entregables" className="max-w-5xl mx-auto px-6 mb-12 grid grid-cols-1 md:grid-cols-[1fr_auto] items-center gap-8">
          <h2 className="text-3xl md:text-4xl font-bold leading-[1.15] max-w-lg">
            Qué incluye nuestro servicio para que tu sitio web trabaje por vos 24/7
          </h2>
          <div className="w-28 h-28 shrink-0 rounded-2xl border border-[#5bb6ff]/15 flex items-center justify-center"
            style={{ background: 'radial-gradient(circle at 40% 35%, rgba(91,182,255,0.08), rgba(10,10,10,0.8))' }}>
            <Globe className="w-14 h-14 text-[#5bb6ff]/45" />
          </div>
        </section>

        {/* ══════════════════════════════════
            DELIVERABLES
        ══════════════════════════════════ */}
        <div className="max-w-5xl mx-auto px-6 flex flex-col gap-5 mb-20">

          {/* #1 */}
          <Card accentBorder className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex flex-col">
              <Badge n={1} />
              <h3 className="text-2xl font-bold mb-3">Diseño Web a medida y personalizado</h3>
              <p className="text-sm text-white/48 leading-relaxed mb-6">
                Creamos un diseño <strong className="text-white/85">específico para tu negocio</strong> y mercado.
                Basado en principios de UX/UI para mayor conversión desde el primer día.
              </p>
              <div className="grid grid-cols-2 gap-2 mt-auto">
                {projects.map((p) => (
                  <div key={p.name} className="relative aspect-video rounded-lg overflow-hidden border border-white/5">
                    <Image src={p.src} alt={p.name} fill className="object-cover object-top" sizes="200px" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <span className="absolute bottom-1.5 left-2 text-[9px] font-semibold text-white/55">{p.name}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-col">
              <h4 className="text-xl font-bold mb-1">
                100% <span className="text-[#5bb6ff]">Tuyo</span> y auto gestionable
              </h4>
              <p className="text-sm text-white/38 mb-6 leading-relaxed">
                Serás dueño del diseño y tendrás todas las ventajas de un sistema construido a medida.
              </p>
              <ul className="flex flex-col gap-3 mb-8">
                {e1Features.map((f) => <FeatureRow key={f.label} Icon={f.Icon} label={f.label} />)}
              </ul>
              <Btn href={AGENDAR} className="mt-auto w-full">AGENDA UNA LLAMADA</Btn>
            </div>
          </Card>

          {/* #2 */}
          <Card className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="flex items-center justify-center">
              <div className="w-40 h-40 rounded-3xl border border-[#5bb6ff]/12 flex items-center justify-center"
                style={{ background: 'radial-gradient(circle at 40% 35%, rgba(91,182,255,0.08), rgba(10,10,10,0.8))' }}>
                <Search className="w-20 h-20 text-[#5bb6ff]/35" />
              </div>
            </div>
            <div>
              <Badge n={2} />
              <h3 className="text-2xl font-bold mb-3">Auditoría de Marca y Estrategia</h3>
              <p className="text-sm text-white/50 leading-relaxed">
                Combinamos análisis de negocio, competencia y psicología del cliente para construir una web que convierta.
                Buscamos que te vean y te elijan en un mundo donde todos hacen lo mismo.
              </p>
            </div>
          </Card>

          {/* #3 */}
          <Card accentBorder className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex flex-col">
              <Badge n={3} />
              <h3 className="text-2xl font-bold mb-3">Desarrollo e Implementación</h3>
              <p className="text-sm text-white/48 leading-relaxed mb-5">
                Nos encargamos de construir todo y entregarte el sitio listo para que empieces a ver resultados desde el día uno.
              </p>
              {/* Mini browser */}
              <div className="rounded-xl overflow-hidden border border-white/5 mt-auto"
                style={{ background: '#0a0a0a' }}>
                <div className="flex items-center gap-1.5 px-2.5 py-2 border-b border-white/5"
                  style={{ background: '#141414' }}>
                  <span className="w-2 h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }} />
                  <span className="w-2 h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }} />
                  <span className="w-2 h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }} />
                  <span className="ml-2 text-[9px] font-mono" style={{ color: 'rgba(255,255,255,0.18)' }}>tunegocio.com</span>
                </div>
                <div className="p-3 space-y-2">
                  <div className="w-2/3 h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.15)' }} />
                  <div className="w-full h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.10)' }} />
                  <div className="flex gap-1.5 pt-1">
                    <div className="w-14 h-4 rounded-full" style={{ background: 'rgba(91,182,255,0.35)' }} />
                    <div className="w-14 h-4 rounded-full border" style={{ borderColor: 'rgba(255,255,255,0.10)' }} />
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 pt-1">
                    {[...Array(3)].map((_,i) => (
                      <div key={i} className="h-8 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col">
              <h4 className="text-xl font-bold mb-1">
                En <span className="text-[#5bb6ff]">5-10 días</span> tu web está online
              </h4>
              <p className="text-sm text-white/38 mb-6 leading-relaxed">
                Nos encargamos de armar todo y entregarte el sitio listo para que empiece a trabajar por vos.
              </p>
              <ul className="flex flex-col gap-3 mb-8">
                {e3Features.map((f) => <FeatureRow key={f.label} Icon={f.Icon} label={f.label} />)}
              </ul>
              <Btn href={AGENDAR} className="mt-auto w-full">AGENDA UNA LLAMADA</Btn>
            </div>
          </Card>

          {/* #4 */}
          <Card className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="flex items-center justify-center">
              <div className="w-40 h-40 rounded-3xl border border-[#5bb6ff]/12 flex items-center justify-center"
                style={{ background: 'radial-gradient(circle at 60% 35%, rgba(91,182,255,0.08), rgba(10,10,10,0.8))' }}>
                <BarChart3 className="w-20 h-20 text-[#5bb6ff]/35" />
              </div>
            </div>
            <div>
              <Badge n={4} />
              <h3 className="text-2xl font-bold mb-5">Configuraciones para que empieces a convertir</h3>
              <div className="flex flex-wrap gap-2">
                {['SEO Técnico', 'Google Analytics', 'Formularios', 'Conexión de dominio'].map((tag) => (
                  <span key={tag} className="text-xs px-3 py-1.5 rounded-full text-white/48"
                    style={{ border: '1px solid rgba(91,182,255,0.16)', background: 'rgba(249,115,22,0.05)' }}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* ══════════════════════════════════
            BONUSES
        ══════════════════════════════════ */}
        <section className="max-w-5xl mx-auto px-6 mb-20">
          <div className="w-16 h-px mx-auto mb-10"
            style={{ background: 'linear-gradient(to right, transparent, rgba(91,182,255,0.3), transparent)' }} />
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
            Además obtendrás dos regalos<br />valorados en +$800 USD
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: 'AYUDA A GENERAR MÁS LEADS', title: 'Guía de contenido para tu web', desc: 'Una guía exclusiva para que sepas exactamente qué publicar y tengas contenido que convierta visitas en clientes.' },
              { label: 'AYUDA A DESTACAR VISUALMENTE', title: 'Pack de elementos gráficos para redes', desc: 'Pack de diseños para redes sociales enfocados en tu nicho, para que destaques de forma inteligente fuera del sitio.' },
            ].map((b) => (
              <Card key={b.label} className="p-6">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5bb6ff]/65 mb-4 tracking-wider">
                  ✦ {b.label}
                </span>
                <h3 className="text-xl font-bold mb-3">{b.title}</h3>
                <p className="text-sm text-white/48 leading-relaxed mb-5">{b.desc}</p>
                <div className="grid grid-cols-4 gap-2">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="aspect-square rounded-lg"
                      style={{ background: `rgba(249,115,22,${0.03 + (i % 3) * 0.01})`, border: '1px solid rgba(91,182,255,0.05)' }} />
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* ══════════════════════════════════
            PACKAGE
        ══════════════════════════════════ */}
        <section className="max-w-5xl mx-auto px-6 mb-20">
          <div className="w-16 h-px mx-auto mb-10"
            style={{ background: 'linear-gradient(to right, transparent, rgba(91,182,255,0.3), transparent)' }} />
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
            Hacemos todo por vos y te<br />entregamos una web lista para convertir
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card accentBorder className="p-6">
              <p className="text-xs font-semibold text-white/22 uppercase tracking-widest mb-1">BRALTO</p>
              <h3 className="text-2xl font-bold text-[#5bb6ff] mb-6">Websites Pack</h3>
              <ul className="flex flex-col gap-2.5 mb-7">
                {checklist.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-[#5bb6ff] mt-0.5 shrink-0" />
                    <span className="text-sm text-white/55">{item}</span>
                  </li>
                ))}
              </ul>
              <Btn href={AGENDAR} className="w-full">AGENDA UNA LLAMADA</Btn>
            </Card>
            <Card className="p-6 flex flex-col items-center justify-center text-center gap-5">
              <div className="w-20 h-20 rounded-2xl border border-[#5bb6ff]/15 flex items-center justify-center"
                style={{ background: 'radial-gradient(circle at 40% 35%, rgba(91,182,255,0.1), rgba(10,10,10,0.8))' }}>
                <Globe className="w-10 h-10 text-[#5bb6ff]/45" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2 leading-snug">
                  ¿Tenés una <span className="text-[#5bb6ff]">agencia</span> y querés delegar el diseño web?
                </h3>
                <p className="text-sm text-white/38 mb-1">Ofrecemos un servicio especializado para agencias.</p>
              </div>
              <Btn href={AGENDAR} variant="ghost" className="w-full">AGENDA UNA LLAMADA</Btn>
            </Card>
          </div>
        </section>

        {/* ══════════════════════════════════
            SOCIAL PROOF
        ══════════════════════════════════ */}
        <section id="testimonios" className="max-w-5xl mx-auto px-6 mb-20">
          <Card className="p-8">
            <div className="flex justify-center mb-6">
              <span className="text-xs font-semibold text-[#5bb6ff]/60 tracking-widest px-3 py-1 rounded-full"
                style={{ border: '1px solid rgba(91,182,255,0.14)', background: 'rgba(249,115,22,0.05)' }}>
                EL MERCADO IGNORA A LOS QUE NO SE VEN PROFESIONALES
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-10 leading-snug">
              Te dedicaste tanto a tu negocio, que otros que<br />
              invierten en su imagen digital...{' '}
              <em className="text-[#5bb6ff] not-italic">consiguen más clientes.</em>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {chats.map((msg, i) => (
                <div key={i} className="rounded-xl p-4"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <p className="text-sm text-white/58 leading-relaxed mb-2">{msg.text}</p>
                  {msg.hl && (
                    <span className="text-xs font-semibold text-[#5bb6ff]/70 px-2 py-0.5 rounded"
                      style={{ background: 'rgba(91,182,255,0.05)' }}>
                      {msg.hl}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </section>

        {/* ══════════════════════════════════
            BIG TESTIMONIAL
        ══════════════════════════════════ */}
        <section className="max-w-5xl mx-auto px-6 mb-20">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-2 leading-snug">
            Las decisiones inteligentes<br />generan resultados predecibles
          </h2>
          <p className="text-center text-sm text-white/30 mb-10">
            Auditoría de marca + Diseño + Plan de acción ={' '}
            <span className="text-[#5bb6ff]">resultados</span>
          </p>
          <Card accentBorder className="p-8 mb-8">
            <p className="text-white/68 leading-[1.85] text-[0.95rem]">
              Excelente trabajo, más allá del profesionalismo y conocimiento, quiero agradecerte por guiarme y aconsejarme en cada parte del proceso. Para mí hoy tener nuestro propio sitio funcional y convirtiendo es un sueño, sin dudas la auditoría nos ayudó a abrir los ojos y entender cuál era el problema todo este tiempo. De nuevo gracias por ponerle todo el corazón a este proyecto, nuestra mejor decisión este año sin dudas fue trabajar con vos.
            </p>
            <p className="text-xs text-white/20 mt-4">19:21 ✓✓</p>
          </Card>
          <div className="flex justify-center">
            <Btn href={AGENDAR}>
              AGENDA UNA LLAMADA <ArrowRight className="w-4 h-4" />
            </Btn>
          </div>
        </section>

        {/* ══════════════════════════════════
            QUIZ
        ══════════════════════════════════ */}
        <section className="max-w-5xl mx-auto px-6 mb-20">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-2 leading-snug">
            Descubrí en menos de 1 minuto<br />si tu presencia digital está trabajando por vos
          </h2>
          <div className="max-w-xl mx-auto mt-8">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs text-white/22">Pregunta 1 de 5</span>
              <span className="text-xs text-white/22">0% completado</span>
            </div>
            <div className="h-px w-full rounded-full"
              style={{ background: 'rgba(91,182,255,0.12)' }} />
          </div>
          <div className="max-w-xl mx-auto mt-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs font-semibold text-[#5bb6ff]/65 px-3 py-1 rounded-full tracking-wider"
                style={{ background: 'rgba(91,182,255,0.05)', border: '1px solid rgba(91,182,255,0.12)' }}>
                ✦ Presencia Digital
              </span>
            </div>
            <Card className="p-6">
              <p className="text-xs font-semibold text-white/22 uppercase tracking-widest mb-3">PREGUNTA 1 DE 5</p>
              <p className="font-bold text-lg leading-snug mb-6">
                ¿Tu sitio web actual comunica claramente qué hacés y cómo contactarte en menos de 7 palabras?
              </p>
              <div className="flex flex-col gap-3">
                {quiz.map((opt, i) => (
                  <button key={i} onClick={() => setAnswer(i)}
                    className="w-full text-left px-4 py-3 rounded-xl border transition-all"
                    style={answer === i
                      ? { border: '1px solid rgba(91,182,255,0.25)', background: 'rgba(91,182,255,0.05)', color: '#fff' }
                      : { border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.025)', color: 'rgba(255,255,255,0.50)' }
                    }>
                    <p className="text-sm font-medium">{opt.text}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.28)' }}>{opt.sub}</p>
                  </button>
                ))}
              </div>
              {answer !== null && (
                <div className="mt-5">
                  <Btn href={AGENDAR} className="w-full">
                    Siguiente <ArrowRight className="w-4 h-4" />
                  </Btn>
                </div>
              )}
            </Card>
          </div>
        </section>

        {/* ══════════════════════════════════
            FOOTER
        ══════════════════════════════════ */}
        <footer className="border-t py-10 text-center"
          style={{ borderColor: 'rgba(91,182,255,0.08)' }}>
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-full bg-[#5bb6ff] flex items-center justify-center shrink-0">
              <span className="text-white text-xs font-black">B</span>
            </div>
            <span className="text-sm text-white/30 font-medium tracking-widest">BRALTO | WEBSITES</span>
          </div>
          <p className="text-xs text-white/18 max-w-sm mx-auto leading-relaxed">
            Agencia especializada en diseño y desarrollo web con más de 5 años de experiencia en diseño, sistemas y estrategia digital.
          </p>
        </footer>

      </div>
    </div>
  )
}
