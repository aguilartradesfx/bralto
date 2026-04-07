import Link from 'next/link'
import { ArrowLeft, ArrowRight, ChevronDown } from 'lucide-react'
import { ServiciosRelacionados } from '@/components/servicios-relacionados'

const AGENDAR = '/agendar'

const features = [
  { n: '01', t: 'Videos cortos y Reels', d: 'Producción y edición de contenido vertical optimizado para Instagram, TikTok y Facebook. Entregamos listos para publicar.' },
  { n: '02', t: 'Stories y contenido diario', d: 'Diseño y producción de stories que mantienen presencia activa y llevan tráfico a tu perfil y sitio web.' },
  { n: '03', t: 'Estrategia editorial', d: 'Definimos pilares de contenido, tono de voz y objetivos de marca. Todo lo que publicamos tiene un propósito claro.' },
  { n: '04', t: 'Calendario de contenido', d: 'Planificación mensual anticipada para que siempre sepás qué se publica, cuándo y por qué. Sin improvisación.' },
  { n: '05', t: 'Gestión y publicación', d: 'Publicamos en tu nombre según el calendario acordado. Vos solo aprobás las piezas antes de que salgan.' },
  { n: '06', t: 'Reporte mensual de resultados', d: 'Revisión de métricas clave: alcance, engagement, crecimiento de cuenta y ajustes para el siguiente mes.' },
]

const steps = [
  { n: '01', t: 'Sesión de estrategia', d: 'Hacemos un briefing de marca, analizamos tu cuenta y la competencia, y definimos los pilares de contenido, tono de voz y objetivos del primer mes.' },
  { n: '02', t: 'Producción mensual', d: 'Grabamos y/o editamos las piezas del mes según el plan. Cada pieza pasa por revisión antes de ser publicada.' },
  { n: '03', t: 'Publicación y optimización', d: 'Publicamos según el calendario, monitoreamos el rendimiento y ajustamos la estrategia del mes siguiente con base en los datos.' },
]

const faqs = [
  { q: '¿Ustedes graban o solo editan?', a: 'Depende del plan y la ubicación. En la mayoría de los casos trabajamos con material que el cliente graba o nos envía. Para clientes en zona de cobertura, la producción en sitio se puede incluir o cotizar aparte.' },
  { q: '¿El servicio incluye la gestión de redes?', a: 'Sí. Publicamos en tu nombre según el calendario aprobado. Vos solo revisás y aprobás las piezas antes de que salgan — el resto lo manejamos nosotros.' },
  { q: '¿Qué plataformas cubren?', a: 'Instagram, TikTok, Facebook y YouTube Shorts. La estrategia se adapta según dónde está tu audiencia y cuáles plataformas generan más resultado para tu tipo de negocio.' },
  { q: '¿Puedo cambiar de plan?', a: 'Sí, con 15 días de anticipación antes del siguiente ciclo mensual. Sin penalidades.' },
]

export default function ProduccionContenidoPage() {
  return (
    <div className="min-h-screen bg-[#080808] text-white antialiased">

      {/* ═══════════════════════════════════════════
          HERO
      ═══════════════════════════════════════════ */}
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden text-center">

        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_40%,rgba(249,115,22,0.07),transparent)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#080808]" />

        <Link href="/precios" className="absolute top-20 left-6 md:left-12 inline-flex items-center gap-2 text-white/40 hover:text-white/70 transition-colors text-sm z-10">
          <ArrowLeft size={13} />
          Servicios
        </Link>

        <div className="relative z-10 max-w-4xl mx-auto px-6 md:px-12 py-32 flex flex-col items-center">
          <div
            className="inline-flex items-center gap-2.5 mb-10 px-4 py-2 rounded-full"
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(12px)' }}
          >
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#F97316] text-white">
              Servicio
            </span>
            <span className="text-sm text-white/75">Producción de contenido</span>
          </div>

          <h1 className="font-bold tracking-tight leading-[0.92] text-white mb-7" style={{ fontSize: 'clamp(3.2rem, 8vw, 7.5rem)' }}>
            Contenido que vende,
            <br />
            <span style={{ color: 'rgba(255,255,255,0.3)' }}>mes a mes.</span>
          </h1>

          <p className="text-lg text-white/55 leading-relaxed max-w-xl mb-12">
            Producimos, editamos y publicamos contenido profesional para tus redes sociales
            — sin que tengas que preocuparte por nada.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 mb-20">
            <Link href={AGENDAR} className="inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-full bg-[#F97316] hover:bg-[#ea6c0c] text-white font-semibold text-sm transition-all hover:shadow-[0_0_40px_rgba(249,115,22,0.5)] active:scale-[0.98]">
              Agendar llamada gratis
              <ArrowRight size={15} />
            </Link>
          </div>

          <div className="flex items-center gap-8 pb-12 w-full justify-center" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            {[['6–12', 'Videos al mes'], ['Stories', 'Incluidas'], ['100%', 'Gestionado']].map(([v, l]) => (
              <div key={l}>
                <p className="text-3xl font-bold text-white">{v}</p>
                <p className="text-xs text-white/30 mt-1 uppercase tracking-wider">{l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          QUÉ INCLUYE
      ═══════════════════════════════════════════ */}
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
              <div key={f.n} className="relative bg-[#080808] px-9 py-10 group hover:bg-[#0d0d0d] transition-colors cursor-default">
                <p className="text-xs font-mono text-[#F97316]/40 mb-7 tracking-widest">{f.n}</p>
                <h3 className="text-xl font-bold text-white mb-3">{f.t}</h3>
                <p className="text-sm text-white/40 leading-relaxed">{f.d}</p>
                <div className="absolute bottom-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'linear-gradient(to right, transparent, rgba(249,115,22,0.3), transparent)' }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          PROCESO
      ═══════════════════════════════════════════ */}
      <section className="py-32" style={{ background: '#0a0a0a', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="mb-20">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#F97316] mb-5">Cómo funciona</p>
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

      {/* ═══════════════════════════════════════════
          FAQ
      ═══════════════════════════════════════════ */}
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

      {/* ═══════════════════════════════════════════
          CTA FINAL
      ═══════════════════════════════════════════ */}
      <section className="relative py-40 overflow-hidden" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_80%_at_50%_50%,rgba(249,115,22,0.08),transparent)] pointer-events-none" />
        <div className="relative z-10 max-w-3xl mx-auto px-6 md:px-12 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#F97316] mb-6">¿Listo para empezar?</p>
          <h2 className="font-bold tracking-tight leading-[0.92] text-white mb-8" style={{ fontSize: 'clamp(2.8rem, 7vw, 6rem)' }}>
            Hablemos de<br />
            <span style={{ color: 'rgba(255,255,255,0.2)' }}>tu contenido.</span>
          </h2>
          <p className="text-base text-white/40 leading-relaxed mb-14 max-w-md mx-auto">
            30 minutos para entender tu marca y diseñar una estrategia que tenga sentido para tu negocio.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href={AGENDAR} className="inline-flex items-center justify-center gap-2.5 px-10 py-4 rounded-full bg-[#F97316] hover:bg-[#ea6c0c] text-white font-semibold transition-all hover:shadow-[0_0_48px_rgba(249,115,22,0.45)]">
              Agendar llamada gratis <ArrowRight size={16} />
            </Link>
            <Link href="/precios" className="inline-flex items-center justify-center gap-2.5 px-10 py-4 rounded-full font-semibold text-white/45 hover:text-white transition-all" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)' }}>
              Ver todos los servicios
            </Link>
          </div>
        </div>
      </section>

      <ServiciosRelacionados exclude="produccion-contenido" />

    </div>
  )
}
