import Link from 'next/link'
import { ArrowLeft, ArrowRight, ChevronDown } from 'lucide-react'

const AGENDAR = '/agendar'

const features = [
  { n: '01', t: 'Workflow end-to-end', d: 'Mapeamos y automatizamos el proceso completo — desde el trigger hasta el resultado final, sin pasos manuales.' },
  { n: '02', t: 'Agente de IA a medida', d: 'Configuramos un agente que atiende por WhatsApp, email o internamente según la necesidad del negocio.' },
  { n: '03', t: 'Integraciones con tus herramientas', d: 'Conectamos con CRM, WhatsApp, email, Google Workspace, calendarios, ERP y cualquier API con la que ya trabajés.' },
  { n: '04', t: 'Pruebas y validación', d: 'Antes de entregar, corremos el flujo con casos reales para asegurarnos de que funciona exactamente como diseñamos.' },
  { n: '05', t: 'Documentación y handoff', d: 'Entregamos documentación clara para que tu equipo entienda y pueda mantener lo que construimos sin depender de nosotros.' },
  { n: '06', t: 'Soporte post-entrega 30 días', d: 'Un mes de soporte incluido para resolver dudas, ajustes menores y garantizar que todo opere en producción.' },
]

const steps = [
  { n: '01', t: 'Diagnóstico del proceso', d: 'Entrevistamos a tu equipo, mapeamos el flujo actual y detectamos los cuellos de botella. Definimos el trigger, la lógica y el resultado esperado.' },
  { n: '02', t: 'Construcción e integración', d: 'Desarrollamos el flujo en Make, n8n o código propio según el caso. Integramos con tus herramientas existentes y configuramos los agentes de IA.' },
  { n: '03', t: 'Pruebas, entrega y documentación', d: 'Validamos con datos reales, ajustamos hasta que todo funcione, y entregamos con documentación completa y sesión de capacitación.' },
]

const faqs = [
  { q: '¿Qué procesos se pueden automatizar?', a: 'Seguimiento de leads, onboarding de clientes, notificaciones internas, recordatorios automáticos, reportes, respuestas a consultas frecuentes, reservas y agendamientos, entre muchos otros.' },
  { q: '¿Qué herramientas usan para automatizar?', a: 'Trabajamos con Make (ex-Integromat), n8n y código propio según la complejidad del caso. También usamos las APIs de OpenAI, WhatsApp Business y las herramientas específicas de cada cliente.' },
  { q: '¿Necesito conocimiento técnico para operar la automatización después?', a: 'No. El objetivo es que funcione sola. El soporte de 30 días incluido está para resolver cualquier duda y asegurarnos de que tu equipo se sienta cómodo con lo que construimos.' },
  { q: '¿Las licencias de plataformas como Make están incluidas?', a: 'No. Las licencias de terceros (Make, n8n cloud, APIs de IA) son un costo aparte que el cliente gestiona directamente. Te asesoramos para elegir el plan más eficiente según el volumen de tu operación.' },
]

export default function AutomatizacionPage() {
  return (
    <div className="min-h-screen bg-[#080808] text-white antialiased">

      {/* ═══════════════════════════════════════════
          HERO
      ═══════════════════════════════════════════ */}
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden text-center">

        {/* Atmosphere */}
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
            <span className="text-sm text-white/75">Automatización e IA</span>
          </div>

          <h1 className="font-bold tracking-tight leading-[0.92] text-white mb-7" style={{ fontSize: 'clamp(3.2rem, 8vw, 7.5rem)' }}>
            Tu operación,
            <br />
            <span style={{ color: 'rgba(255,255,255,0.3)' }}>sin intervención.</span>
          </h1>

          <p className="text-lg text-white/55 leading-relaxed max-w-xl mb-12">
            Automatizamos los procesos repetitivos de tu negocio para que tu equipo
            se enfoque en lo que realmente importa — y el trabajo siga fluyendo solo.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 mb-20">
            <Link href={AGENDAR} className="inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-full bg-[#F97316] hover:bg-[#ea6c0c] text-white font-semibold text-sm transition-all hover:shadow-[0_0_40px_rgba(249,115,22,0.5)] active:scale-[0.98]">
              Agendar llamada gratis
              <ArrowRight size={15} />
            </Link>
          </div>

          <div className="flex items-center gap-8 pb-12 w-full justify-center" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            {[['Make / n8n', 'Plataformas'], ['2–3 sem.', 'Tiempo de entrega'], ['30 días', 'Soporte incluido']].map(([v, l]) => (
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
            <span style={{ color: 'rgba(255,255,255,0.2)' }}>tu proceso.</span>
          </h2>
          <p className="text-base text-white/40 leading-relaxed mb-14 max-w-md mx-auto">
            30 minutos para mapear qué se puede automatizar hoy. Sin compromiso, sin tecnicismos.
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
