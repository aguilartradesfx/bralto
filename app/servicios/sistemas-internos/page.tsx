import Link from 'next/link'
import { ArrowLeft, ArrowRight, ChevronDown } from 'lucide-react'

const AGENDAR = '/agendar'

const features = [
  { n: '01', t: 'Interfaz diseñada a tu flujo', d: 'Dashboards, gestores de pedidos, portales de clientes o cualquier herramienta interna — construida exactamente para cómo opera tu equipo.' },
  { n: '02', t: 'Multi-usuario y permisos', d: 'Roles diferenciados por área, accesos controlados y login propio. Cada usuario ve y puede hacer solo lo que le corresponde.' },
  { n: '03', t: 'Base de datos a medida', d: 'Modelamos la estructura de datos de tu operación usando Supabase y PostgreSQL. Tu información, organizada y disponible en tiempo real.' },
  { n: '04', t: 'Integraciones con sistemas existentes', d: 'Conectamos con CRM, WhatsApp, Google Sheets, plataformas de facturación, ERP y cualquier sistema que ya uses en el día a día.' },
  { n: '05', t: 'Documentación técnica incluida', d: 'Entregamos manual de uso para tu equipo y documentación técnica para que el sistema pueda ser mantenido o ampliado en el futuro.' },
  { n: '06', t: 'Soporte post-entrega 30 días', d: 'Un mes de soporte incluido para ajustes, dudas y asegurarnos de que el sistema opera bien en producción con datos reales.' },
]

const steps = [
  { n: '01', t: 'Análisis de requerimientos', d: 'Sesiones de levantamiento donde mapeamos tus flujos actuales, los puntos de dolor y lo que necesita el sistema para reemplazarlos. Salimos con un brief técnico claro.' },
  { n: '02', t: 'Diseño y desarrollo', d: 'Construimos en iteraciones cortas con demos parciales para que podás ver el avance y ajustar antes de que esté terminado. Stack: Next.js, Supabase, Node.' },
  { n: '03', t: 'Entrega y capacitación', d: 'Entregamos el sistema funcionando, hacemos una sesión de capacitación con tu equipo y dejamos toda la documentación lista para operar desde el primer día.' },
]

const faqs = [
  { q: '¿Qué tipo de sistemas construyen?', a: 'Gestores de pedidos, CRM propio, paneles de inventario, portales de clientes, sistemas de reservas internas, dashboards de operaciones, herramientas de seguimiento y cualquier sistema que hoy estés haciendo a mano o en hojas de cálculo.' },
  { q: '¿El código es mío después de la entrega?', a: 'Sí. El código fuente es propiedad del cliente desde el primer día. Lo entregamos completo, documentado y sin restricciones.' },
  { q: '¿Cuánto tiempo toma construir un sistema?', a: 'Entre 4 y 12 semanas según la complejidad. Un sistema básico (1-2 módulos, sin integraciones complejas) puede estar listo en un mes. Uno más complejo con múltiples módulos e integraciones puede tomar 2-3 meses.' },
  { q: '¿Por qué el precio es "desde $1,997"?', a: 'El precio varía según el número de módulos, integraciones requeridas y la complejidad funcional. Lo definimos con precisión después de la llamada de diagnóstico donde entendemos el alcance real.' },
]

export default function SistemasInternosPage() {
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
            <span className="text-sm text-white/75">Sistemas internos</span>
          </div>

          <h1 className="font-bold tracking-tight leading-[0.92] text-white mb-7" style={{ fontSize: 'clamp(3.2rem, 8vw, 7.5rem)' }}>
            Tu operación,
            <br />
            <span style={{ color: 'rgba(255,255,255,0.3)' }}>hecha sistema.</span>
          </h1>

          <p className="text-lg text-white/55 leading-relaxed max-w-xl mb-12">
            Herramientas internas construidas exactamente para tu flujo de trabajo —
            no soluciones genéricas que obligan a tu equipo a adaptarse.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 mb-20">
            <Link href={AGENDAR} className="inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-full bg-[#F97316] hover:bg-[#ea6c0c] text-white font-semibold text-sm transition-all hover:shadow-[0_0_40px_rgba(249,115,22,0.5)] active:scale-[0.98]">
              Agendar llamada gratis
              <ArrowRight size={15} />
            </Link>
          </div>

          <div className="flex items-center gap-8 pb-12 w-full justify-center" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            {[['4–12 sem.', 'Tiempo de entrega'], ['100%', 'Código tuyo'], ['30 días', 'Soporte incluido']].map(([v, l]) => (
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
            Contanos<br />
            <span style={{ color: 'rgba(255,255,255,0.2)' }}>qué necesitás.</span>
          </h2>
          <p className="text-base text-white/40 leading-relaxed mb-14 max-w-md mx-auto">
            30 minutos para entender tu operación y diseñar la solución correcta. Sin compromiso.
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
