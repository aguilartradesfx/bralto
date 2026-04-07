import Link from 'next/link'
import { ArrowLeft, ArrowRight, Check, ChevronDown } from 'lucide-react'

const AGENDAR = '/agendar'

const features = [
  { n: '01', t: 'Campañas en Meta Ads', d: 'Configuración, creativos, segmentación de audiencias y A/B testing. Gestionamos todo desde la cuenta de anuncios hasta la optimización continua.' },
  { n: '02', t: 'Google Ads', d: 'Campañas de Search y Display con palabras clave seleccionadas, anuncios de texto y visuales. Capturamos demanda activa y generamos presencia de marca.' },
  { n: '03', t: 'Creativos y copy para anuncios', d: 'Diseñamos las piezas visuales y escribimos el copy de cada anuncio. Nada se lanza sin estar optimizado para convertir.' },
  { n: '04', t: 'Segmentación y audiencias', d: 'Definimos audiencias por comportamiento, intereses, ubicación y datos demográficos. También construimos audiencias similares desde tu base de clientes.' },
  { n: '05', t: 'Optimización continua', d: 'Revisamos el rendimiento mínimo dos veces por semana y ajustamos pujas, creativos y segmentaciones para maximizar el retorno.' },
  { n: '06', t: 'Reportes de resultados', d: 'Reportes semanales con las métricas que importan: CPC, ROAS, leads generados, costo por conversión y evolución de la inversión.' },
]

const steps = [
  { n: '01', t: 'Diagnóstico y estrategia', d: 'Analizamos tu negocio, competencia y audiencia objetivo. Definimos los objetivos de campaña, el presupuesto inicial recomendado y la plataforma más efectiva para tu caso.' },
  { n: '02', t: 'Creación y lanzamiento', d: 'Producimos los creativos, configuramos el pixel/tags de seguimiento, estructuramos las campañas y las lanzamos con los primeros sets de anuncios.' },
  { n: '03', t: 'Seguimiento y optimización', d: 'Monitoreamos el rendimiento diariamente, hacemos ajustes dos veces por semana y entregamos reporte semanal con los resultados y próximos pasos.' },
]

const faqs = [
  { q: '¿El presupuesto de pauta está incluido?', a: 'No. Bralto cobra un fee mensual de gestión y estrategia. El presupuesto de anuncios lo manejás vos directamente desde tu cuenta de Meta o Google — así tenés control total sobre lo que gastás.' },
  { q: '¿Qué plataformas cubren?', a: 'Principalmente Meta (Facebook e Instagram) y Google (Search y Display). Para ciertos negocios también gestionamos TikTok Ads o LinkedIn Ads según donde esté la audiencia más relevante.' },
  { q: '¿Cuánto tiempo tarda en ver resultados?', a: 'Las primeras 2-3 semanas son de aprendizaje del algoritmo. Entre la semana 4 y 8 empezamos a ver los primeros resultados sólidos. Para resultados consistentes y escalables, lo ideal es evaluar con 3 meses de datos.' },
  { q: '¿Qué pasa si los resultados no son los esperados?', a: 'Ajustamos la estrategia con base en los datos. Revisamos creativos, audiencias y estructuras de campaña. Nuestro trabajo es optimizar continuamente — no hay garantía de ROAS específico porque depende de muchas variables del mercado, pero sí hay compromiso de mejora constante.' },
]

export default function CampanasPage() {
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
            <span className="text-sm text-white/75">Campañas publicitarias</span>
          </div>

          <h1 className="font-bold tracking-tight leading-[0.92] text-white mb-7" style={{ fontSize: 'clamp(3.2rem, 8vw, 7.5rem)' }}>
            Anuncios que<br />
            <span style={{ color: 'rgba(255,255,255,0.3)' }}>convierten.</span>
          </h1>

          <p className="text-lg text-white/55 leading-relaxed max-w-xl mb-12">
            Gestionamos tus campañas en Meta y Google de principio a fin —
            desde la estrategia hasta la optimización diaria — para que cada peso invertido trabaje.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 mb-20">
            <Link href={AGENDAR} className="inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-full bg-[#F97316] hover:bg-[#ea6c0c] text-white font-semibold text-sm transition-all hover:shadow-[0_0_40px_rgba(249,115,22,0.5)] active:scale-[0.98]">
              Agendar llamada gratis
              <ArrowRight size={15} />
            </Link>
          </div>

          <div className="flex items-center gap-8 pb-12 w-full justify-center" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            {[['Meta + Google', 'Plataformas'], ['2×/semana', 'Optimización'], ['Semanal', 'Reporte']].map(([v, l]) => (
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
          PRECIO
      ═══════════════════════════════════════════ */}
      <section className="py-32" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#F97316] mb-5">Inversión</p>
              <h2 className="font-bold tracking-tight leading-[0.92] mb-8" style={{ fontSize: 'clamp(2.8rem, 6vw, 5.5rem)' }}>
                Fee de gestión.<br />
                <span style={{ color: 'rgba(255,255,255,0.2)' }}>Vos controlás la pauta.</span>
              </h2>
              <p className="text-base text-white/40 leading-relaxed max-w-sm">
                Cobramos un fee mensual por estrategia, gestión y optimización. El presupuesto de anuncios lo manejás directamente desde tu cuenta — sin intermediarios.
              </p>
            </div>
            <div>
              <div className="mb-10">
                <p className="text-[4rem] font-bold text-white leading-none mb-2">A convenir</p>
                <p className="text-sm text-white/30">Según plataformas, presupuesto de pauta y alcance del servicio</p>
              </div>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3.5 mb-12">
                {['Estrategia inicial de campañas', 'Configuración técnica completa', 'Creativos y copy para anuncios', 'Segmentación de audiencias', 'Optimización 2× por semana', 'Reporte de resultados semanal', 'Pixel y tags de seguimiento', 'Reunión mensual de revisión'].map(item => (
                  <li key={item} className="flex items-center gap-2.5 text-sm text-white/55">
                    <Check size={13} className="text-[#F97316] shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link href={AGENDAR} className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-[#F97316] hover:bg-[#ea6c0c] text-white font-semibold text-sm transition-all hover:shadow-[0_0_40px_rgba(249,115,22,0.4)]">
                Hablar sobre mi presupuesto
                <ArrowRight size={15} />
              </Link>
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
            <span style={{ color: 'rgba(255,255,255,0.2)' }}>tus campañas.</span>
          </h2>
          <p className="text-base text-white/40 leading-relaxed mb-14 max-w-md mx-auto">
            30 minutos para entender tus objetivos y proponerte una estrategia concreta. Sin compromiso.
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
