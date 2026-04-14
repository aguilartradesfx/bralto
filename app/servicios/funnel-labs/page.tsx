import Link from 'next/link'
import { ArrowLeft, ArrowRight, ChevronDown, ExternalLink } from 'lucide-react'
import { ServiciosRelacionados } from '@/components/servicios-relacionados'

const FUNNEL_URL = 'https://funnellabs.bralto.io'

const features = [
  { n: '01', t: 'Simulá antes de gastar', d: 'Ingresá tu presupuesto, canales y tasas de conversión estimadas. FunnelLab te dice cuántos leads y clientes podés esperar — antes de invertir un peso.' },
  { n: '02', t: 'Identificá cuellos de botella', d: 'El simulador detecta en qué etapa de tu funnel estás perdiendo más clientes y qué ajuste tendría el mayor impacto en tus resultados.' },
  { n: '03', t: 'Compará escenarios', d: '¿Webinar o VSL? ¿Facebook Ads o Google Ads? Corrés ambos escenarios en paralelo y elegís el más rentable con números reales, no intuición.' },
  { n: '04', t: 'Proyecciones de ROI', d: 'Generá reportes con proyecciones de retorno sobre inversión para cada estrategia. Ideal para presentar a clientes o justificar presupuestos internamente.' },
  { n: '05', t: 'Análisis con IA', d: 'Nuestro agente de IA lee tu funnel completo y te da recomendaciones específicas sobre dónde mejorar y qué palancas mover primero.' },
  { n: '06', t: 'Gratis para empezar', d: 'Podés usar FunnelLab sin costo. Creá tu cuenta, ingresá tu funnel y obtené tu primera simulación hoy mismo.' },
]

const steps = [
  { n: '01', t: 'Construí tu funnel', d: 'Definí las etapas de tu embudo: tráfico, leads, prospectos calificados, clientes. Ingresás las tasas de conversión entre etapa y etapa y el costo por click o por lead.' },
  { n: '02', t: 'Corrés la simulación', d: 'FunnelLab calcula automáticamente cuántos leads y ventas podés esperar con esos números, cuánto cuesta cada cliente y cuál es tu ROI proyectado.' },
  { n: '03', t: 'Optimizás y decidís', d: 'Modificás una variable (mejor landing, más presupuesto, mejor seguimiento) y ves en tiempo real cómo cambia el resultado. Después ejecutás la estrategia ganadora.' },
]

const examples = [
  {
    label: 'Restaurante',
    text: 'Simuló su funnel de reservas con Google Ads y descubrió que agregar un agente de WhatsApp duplicaba sus reservas sin aumentar el presupuesto.',
  },
  {
    label: 'Agencia',
    text: 'Presentó a su cliente tres escenarios con proyecciones de ROI y cerró un contrato de $5,000/mes. Los números hacían el trabajo de venta.',
  },
  {
    label: 'Coach',
    text: 'Simuló su funnel de webinar y detectó que su tasa de asistencia estaba 15% debajo del promedio. Lo corrigió y triplicó sus ventas.',
  },
]

const faqs = [
  { q: '¿FunnelLab es gratuito?', a: 'Sí, podés crear tu cuenta y correr simulaciones sin costo. Hay un plan avanzado con funciones adicionales como análisis de IA y comparación ilimitada de escenarios.' },
  { q: '¿Necesito conocimiento técnico para usarlo?', a: 'No. Si sabés cuánto invertís en publicidad y cuántos clientes conseguís, podés usar FunnelLab. La interfaz es visual e intuitiva.' },
  { q: '¿FunnelLab reemplaza a un estratega de marketing?', a: 'No, lo potencia. Un estratega interpreta los números y define la dirección. FunnelLab da los números con los que tomar esas decisiones — más rápido y con más precisión.' },
  { q: '¿Puedo exportar los resultados para presentar a un cliente?', a: 'Sí. FunnelLab genera reportes descargables con las proyecciones y el análisis del funnel, listos para presentar en cualquier reunión.' },
]

export default function FunnelLabsPage() {
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
              Herramienta
            </span>
            <span className="text-sm text-white/75">FunnelLab by Bralto</span>
          </div>

          <h1 className="font-bold tracking-tight leading-[0.92] text-white mb-7" style={{ fontSize: 'clamp(3.2rem, 8vw, 7.5rem)' }}>
            Predecí tu funnel
            <br />
            <span style={{ color: 'rgba(255,255,255,0.3)' }}>antes de gastar.</span>
          </h1>

          <p className="text-lg text-white/55 leading-relaxed max-w-xl mb-12">
            Simulá tu embudo de ventas completo, identificá los cuellos de botella
            y elegí la estrategia más rentable — antes de invertir un peso en publicidad.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 mb-20">
            <a
              href={FUNNEL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-full bg-[#F97316] hover:bg-[#ea6c0c] text-white font-semibold text-sm transition-all hover:shadow-[0_0_40px_rgba(249,115,22,0.5)] active:scale-[0.98]"
            >
              Usar FunnelLab gratis
              <ExternalLink size={15} />
            </a>
            <Link href="/agendar" className="inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-full font-semibold text-sm text-white/50 hover:text-white transition-all" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)' }}>
              Hablar con el equipo
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-4 pb-12 w-full justify-center" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            {[['Gratis', 'Para empezar'], ['IA', 'Análisis incluido'], ['Ilimitado', 'Simulaciones']].map(([v, l]) => (
              <div key={l} className="text-center">
                <p className="text-2xl md:text-3xl font-bold text-white">{v}</p>
                <p className="text-xs text-white/30 mt-1 uppercase tracking-wider">{l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          QUÉ PODÉS LOGRAR
      ═══════════════════════════════════════════ */}
      <section className="py-32" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="mb-20">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#F97316] mb-5">Lo que obtenés</p>
            <h2 className="font-bold tracking-tight leading-[0.92]" style={{ fontSize: 'clamp(2.8rem, 6vw, 5.5rem)' }}>
              Decisiones de marketing<br />
              <span style={{ color: 'rgba(255,255,255,0.2)' }}>con datos, no fe.</span>
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
          CÓMO FUNCIONA
      ═══════════════════════════════════════════ */}
      <section className="py-32" style={{ background: '#0a0a0a', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="mb-20">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#F97316] mb-5">El proceso</p>
            <h2 className="font-bold tracking-tight leading-[0.92]" style={{ fontSize: 'clamp(2.8rem, 6vw, 5.5rem)' }}>
              Tres pasos.<br />
              <span style={{ color: 'rgba(255,255,255,0.2)' }}>Una decisión clara.</span>
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
          EJEMPLOS REALES
      ═══════════════════════════════════════════ */}
      <section className="py-32" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="mb-20">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#F97316] mb-5">Casos reales</p>
            <h2 className="font-bold tracking-tight leading-[0.92]" style={{ fontSize: 'clamp(2.8rem, 6vw, 5.5rem)' }}>
              Resultados que<br />
              <span style={{ color: 'rgba(255,255,255,0.2)' }}>cambian negocios.</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {examples.map(ex => (
              <div
                key={ex.label}
                className="rounded-2xl p-8 flex flex-col gap-5"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <span
                  className="self-start px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
                  style={{ background: 'rgba(249,115,22,0.1)', color: '#F97316', border: '1px solid rgba(249,115,22,0.2)' }}
                >
                  {ex.label}
                </span>
                <p className="text-base text-white/60 leading-relaxed">{ex.text}</p>
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
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#F97316] mb-6">Empezá hoy</p>
          <h2 className="font-bold tracking-tight leading-[0.92] text-white mb-8" style={{ fontSize: 'clamp(2.8rem, 7vw, 6rem)' }}>
            Simulá tu funnel.<br />
            <span style={{ color: 'rgba(255,255,255,0.2)' }}>Es gratis.</span>
          </h2>
          <p className="text-base text-white/40 leading-relaxed mb-14 max-w-md mx-auto">
            Sin tarjeta de crédito. Sin instalación. Creá tu cuenta en 30 segundos
            y corré tu primera simulación hoy.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href={FUNNEL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2.5 px-10 py-4 rounded-full bg-[#F97316] hover:bg-[#ea6c0c] text-white font-semibold transition-all hover:shadow-[0_0_48px_rgba(249,115,22,0.45)]"
            >
              Ir a FunnelLab <ExternalLink size={16} />
            </a>
            <Link href="/precios" className="inline-flex items-center justify-center gap-2.5 px-10 py-4 rounded-full font-semibold text-white/45 hover:text-white transition-all" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)' }}>
              Ver todos los servicios
            </Link>
          </div>
        </div>
      </section>

      <ServiciosRelacionados exclude="funnel-labs" />

    </div>
  )
}
