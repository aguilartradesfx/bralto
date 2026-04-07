import Link from 'next/link'
import { ArrowLeft, ArrowRight, Check, ChevronDown } from 'lucide-react'

const AGENDAR = '/agendar'

const features = [
  { n: '01', t: 'Diagnóstico de marca', d: 'Analizamos tu propuesta de valor, posicionamiento actual, competencia directa y audiencia objetivo. Identificamos brechas y oportunidades concretas.' },
  { n: '02', t: 'Plan de marketing a medida', d: 'Definimos canales prioritarios, mensajes clave, presupuesto recomendado y un cronograma de acciones para los próximos 90 días.' },
  { n: '03', t: 'Estrategia de crecimiento', d: 'Diseñamos el embudo de conversión, establecemos KPIs claros y construimos el roadmap para escalar desde donde estás hoy.' },
  { n: '04', t: 'Sesiones de seguimiento', d: 'Dos sesiones mensuales de una hora para revisar métricas, ajustar la estrategia y resolver dudas sobre la ejecución.' },
  { n: '05', t: 'Entregable documentado', d: 'Todo lo que trabajamos queda en un documento de estrategia y una presentación ejecutiva que podés compartir con tu equipo.' },
  { n: '06', t: 'Acceso directo al equipo', d: 'Canal de comunicación directa para consultas rápidas entre sesiones. Sin esperar a la próxima reunión para resolver algo urgente.' },
]

const steps = [
  { n: '01', t: 'Diagnóstico inicial', d: 'Completás un formulario de onboarding, tenemos una entrevista estratégica de 60 minutos y revisamos todos tus materiales existentes — sitio, redes, campañas anteriores.' },
  { n: '02', t: 'Construcción de la estrategia', d: 'Entregamos un documento de estrategia completo con posicionamiento, canales, mensajes, roadmap de 90 días y KPIs por fase. Incluye sesión de presentación.' },
  { n: '03', t: 'Acompañamiento y ajuste', d: 'Dos sesiones mensuales para revisar resultados, ajustar la estrategia según los datos y mantenerte enfocado en las acciones de mayor impacto.' },
]

const faqs = [
  { q: '¿La asesoría es puntual o continua?', a: 'Ambas. La modalidad puntual incluye diagnóstico + estrategia en un solo entregable. La modalidad retainer es mensual e incluye sesiones de seguimiento y ajuste continuo del plan.' },
  { q: '¿Implementan o solo asesoran?', a: 'Este servicio es de estrategia y asesoría. La ejecución es responsabilidad del cliente o de su equipo. Si necesitás ejecución, podemos complementarlo con otros servicios de Bralto como campañas, contenido o automatización.' },
  { q: '¿Para qué tipo de negocio es este servicio?', a: 'Ideal para negocios con 1-3 años de operación que quieren crecer con una estrategia clara, no solo tácticas sueltas. También para emprendedores que están lanzando y quieren evitar errores costosos desde el inicio.' },
  { q: '¿Cuánto cuesta?', a: 'La sesión estratégica puntual (diagnóstico + plan) tiene un precio de $800. El retainer mensual con seguimiento continuo está en $650/mes. Hablamos para definir qué formato se adapta mejor a tu momento.' },
]

export default function AsesoriaPage() {
  return (
    <div className="min-h-screen bg-[#080808] text-white antialiased">

      {/* ═══════════════════════════════════════════
          HERO
      ═══════════════════════════════════════════ */}
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden text-center">

        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_40%,rgba(249,115,22,0.07),transparent)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#080808]" />

        <Link href="/precios" className="absolute top-8 left-6 md:left-12 inline-flex items-center gap-2 text-white/40 hover:text-white/70 transition-colors text-sm z-10">
          <ArrowLeft size={13} />
          Precios
        </Link>

        <div className="relative z-10 max-w-4xl mx-auto px-6 md:px-12 py-32 flex flex-col items-center">
          <div
            className="inline-flex items-center gap-2.5 mb-10 px-4 py-2 rounded-full"
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(12px)' }}
          >
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#F97316] text-white">
              Servicio
            </span>
            <span className="text-sm text-white/75">Asesoría de marketing</span>
          </div>

          <h1 className="font-bold tracking-tight leading-[0.92] text-white mb-7" style={{ fontSize: 'clamp(3.2rem, 8vw, 7.5rem)' }}>
            Estrategia clara,
            <br />
            <span style={{ color: 'rgba(255,255,255,0.3)' }}>acciones concretas.</span>
          </h1>

          <p className="text-lg text-white/55 leading-relaxed max-w-xl mb-12">
            Para negocios que ya tienen algo construido y quieren crecer con intención —
            no con tácticas sueltas que no van a ningún lado.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 mb-20">
            <Link href={AGENDAR} className="inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-full bg-[#F97316] hover:bg-[#ea6c0c] text-white font-semibold text-sm transition-all hover:shadow-[0_0_40px_rgba(249,115,22,0.5)] active:scale-[0.98]">
              Agendar llamada gratis
              <ArrowRight size={15} />
            </Link>
          </div>

          <div className="flex items-center gap-8 pb-12 w-full justify-center" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            {[['$800', 'Sesión puntual'], ['$650/mes', 'Retainer mensual'], ['90 días', 'Roadmap incluido']].map(([v, l]) => (
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

      {/* ═══════════════════════════════════════════
          PRECIO
      ═══════════════════════════════════════════ */}
      <section className="py-32" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-start">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#F97316] mb-5">Inversión</p>
              <h2 className="font-bold tracking-tight leading-[0.92] mb-8" style={{ fontSize: 'clamp(2.8rem, 6vw, 5.5rem)' }}>
                Dos formatos.<br />
                <span style={{ color: 'rgba(255,255,255,0.2)' }}>Un solo objetivo.</span>
              </h2>
              <p className="text-base text-white/40 leading-relaxed max-w-sm">
                Elegís según tu momento: una sesión puntual para definir la estrategia, o acompañamiento mensual para ejecutarla con soporte continuo.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {[
                {
                  label: 'Sesión puntual',
                  price: '$800',
                  suffix: 'única vez',
                  items: ['Diagnóstico completo', 'Plan de marketing 90 días', 'Roadmap de acciones', 'Presentación ejecutiva', 'Sesión de presentación incluida'],
                },
                {
                  label: 'Retainer mensual',
                  price: '$650',
                  suffix: '/mes',
                  highlight: true,
                  items: ['Todo lo del plan puntual', '2 sesiones mensuales de 1hr', 'Ajuste continuo del plan', 'Canal directo de consultas', 'Revisión mensual de métricas'],
                },
              ].map(plan => (
                <div
                  key={plan.label}
                  className="rounded-3xl p-8 flex flex-col"
                  style={{
                    background: plan.highlight ? 'rgba(249,115,22,0.05)' : 'rgba(255,255,255,0.03)',
                    border: plan.highlight ? '1px solid rgba(249,115,22,0.25)' : '1px solid rgba(255,255,255,0.07)',
                  }}
                >
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/30 mb-3">{plan.label}</p>
                  <div className="flex items-end gap-1 mb-6">
                    <p className="text-5xl font-bold text-white leading-none">{plan.price}</p>
                    <p className="text-white/30 mb-1 text-sm">{plan.suffix}</p>
                  </div>
                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.items.map(item => (
                      <li key={item} className="flex items-center gap-2.5 text-sm text-white/60">
                        <Check size={12} className="text-[#F97316] shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={AGENDAR}
                    className={`inline-flex items-center justify-center gap-2 py-3.5 rounded-full font-semibold text-sm transition-all ${plan.highlight ? 'bg-[#F97316] hover:bg-[#ea6c0c] text-white' : 'text-white/55 hover:text-white'}`}
                    style={plan.highlight ? undefined : { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)' }}
                  >
                    Empezar <ArrowRight size={14} />
                  </Link>
                </div>
              ))}
            </div>
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
            <span style={{ color: 'rgba(255,255,255,0.2)' }}>tu estrategia.</span>
          </h2>
          <p className="text-base text-white/40 leading-relaxed mb-14 max-w-md mx-auto">
            30 minutos para entender dónde estás y hacia dónde querés ir. Sin compromiso.
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

    </div>
  )
}
