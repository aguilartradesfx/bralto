import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, ArrowRight, ChevronDown, ArrowUpRight } from 'lucide-react'
import { clients } from './clients'

const AGENDAR = '/agendar'

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
          </div>

          {/* Stats row */}
          <div
            className="flex items-center gap-8 mb-12 pb-12 w-full justify-center"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}
          >
            {[['4+', 'Proyectos entregados'], ['SEO', 'Incluido'], ['≤10 días', 'Tiempo de entrega']].map(([v, l]) => (
              <div key={l}>
                <p className="text-3xl font-bold text-white">{v}</p>
                <p className="text-xs text-white/30 mt-1 uppercase tracking-wider">{l}</p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          PROYECTOS — grid, todos visibles
      ═══════════════════════════════════════════════ */}
      <section className="py-32">
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
              Hacé clic en cualquier proyecto para ver la historia completa y la galería de imágenes.
            </p>
          </div>

          {/* Cards grid — all visible, no scroll */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {clients.map(client => (
              <Link
                key={client.id}
                href={`/servicios/sitios-web/${client.id}`}
                className="group relative rounded-2xl overflow-hidden flex flex-col"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
                }}
              >
                {/* Cover image */}
                <div className="relative h-[200px] overflow-hidden bg-[#0a0a0a] shrink-0">
                  <Image
                    src={client.coverImage}
                    alt={client.name}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  {/* Arrow indicator */}
                  <div
                    className="absolute top-3 right-3 h-8 w-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300"
                    style={{ background: 'rgba(249,115,22,0.9)', backdropFilter: 'blur(8px)' }}
                  >
                    <ArrowUpRight size={13} className="text-white" />
                  </div>
                </div>

                {/* Info */}
                <div className="px-5 py-4 flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#F97316]/70 mb-1.5">{client.industry}</p>
                  <h3 className="text-base font-bold text-white mb-1.5">{client.name}</h3>
                  <p className="text-xs text-white/35 leading-relaxed line-clamp-2">{client.tagline}</p>
                </div>

                {/* Bottom shimmer on hover */}
                <div
                  className="absolute bottom-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: 'linear-gradient(to right, transparent, rgba(249,115,22,0.4), transparent)' }}
                />
              </Link>
            ))}
          </div>
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
