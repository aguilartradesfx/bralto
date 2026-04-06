import Link from 'next/link'
import { ArrowLeft, ArrowRight, LayoutDashboard, Users, Database, Code2, FileText, ChevronDown } from 'lucide-react'

const AGENDAR = '/agendar'

const includes = [
  { icon: LayoutDashboard, title: 'Interfaz diseñada a tu flujo', desc: '// TODO: detallar qué tipo de interfaces se construyen — dashboards, portales, gestores internos.' },
  { icon: Users, title: 'Multi-usuario y permisos', desc: '// TODO: detallar si incluye roles, permisos por área, login propio, etc.' },
  { icon: Database, title: 'Base de datos y lógica a medida', desc: '// TODO: describir la pila técnica — Supabase, PostgreSQL, etc. — y cómo se modela la data del cliente.' },
  { icon: Code2, title: 'Integraciones con sistemas existentes', desc: '// TODO: ejemplos de integraciones típicas — facturación, CRM, WhatsApp, ERP, Google Sheets, etc.' },
  { icon: FileText, title: 'Documentación técnica incluida', desc: 'Entregamos manual de uso y documentación técnica para que tu equipo pueda mantener el sistema.' },
]

const steps = [
  { num: '01', title: 'Análisis de requerimientos', desc: '// TODO: describir cómo se levanta el brief técnico — sesiones, cuestionario, mapeo de flujos.' },
  { num: '02', title: 'Diseño y desarrollo', desc: '// TODO: describir el proceso de construcción — iteraciones, demos parciales, stack tecnológico.' },
  { num: '03', title: 'Entrega y capacitación', desc: '// TODO: detallar la entrega, la capacitación del equipo del cliente y el período de soporte.' },
]

const faqs = [
  { q: '¿Qué tipo de sistemas construyen?', a: '// TODO: dar ejemplos concretos — CRM propio, panel de pedidos, gestor de inventario, portal de clientes, etc.' },
  { q: '¿Puedo modificar el sistema después de la entrega?', a: '// TODO: aclarar si el código es propiedad del cliente, si se entrega el fuente y qué mantenimiento se ofrece.' },
  { q: '¿Cuánto tiempo toma construir un sistema?', a: '// TODO: dar rangos típicos según complejidad — básico, intermedio, complejo.' },
  { q: '¿Por qué el precio es "desde $1,997"?', a: '// TODO: explicar que el precio varía según número de módulos, integraciones y complejidad funcional.' },
]

export default function SistemasInternosPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white px-4 py-10 md:py-16">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_80%_35%_at_50%_0%,rgba(249,115,22,0.05),transparent)] pointer-events-none" />

      <div className="relative z-10 max-w-3xl mx-auto">

        <Link href="/precios" className="inline-flex items-center gap-2 text-white/30 hover:text-white/55 transition-colors text-sm mb-10">
          <ArrowLeft size={14} />
          Volver a precios
        </Link>

        {/* Hero */}
        <div className="mb-14">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1.5 h-1.5 rounded-full bg-[#F97316]" />
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#F97316]">Automatización e IA</p>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-4">Sistemas internos a medida</h1>
          {/* TODO: personalizar subtitle — problema que resuelve para el cliente */}
          <p className="text-base text-white/45 max-w-xl leading-relaxed mb-8">
            Herramientas internas construidas exactamente para tu operación — no soluciones genéricas que no se adaptan.
          </p>
          <Link href={AGENDAR} className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-[#F97316] hover:bg-[#ea6c0c] text-white text-sm font-semibold transition-all hover:shadow-[0_0_24px_rgba(249,115,22,0.3)] active:scale-[0.99]">
            Agendar llamada
            <ArrowRight size={15} />
          </Link>
        </div>

        <Section label="Qué incluye">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {includes.map((item) => (
              <div key={item.title} className="flex items-start gap-3 rounded-2xl border border-white/8 bg-white/[0.025] p-4">
                <div className="shrink-0 flex h-8 w-8 items-center justify-center rounded-lg bg-[#F97316]/10 border border-[#F97316]/20">
                  <item.icon size={14} className="text-[#F97316]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white mb-0.5">{item.title}</p>
                  <p className="text-xs text-white/40 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section label="Cómo funciona">
          <div className="space-y-3">
            {steps.map((step) => (
              <div key={step.num} className="flex gap-4 rounded-2xl border border-white/8 bg-white/[0.025] p-5">
                <div className="shrink-0 text-2xl font-bold text-[#F97316]/20 w-8 tabular-nums">{step.num}</div>
                <div>
                  <p className="text-sm font-semibold text-white mb-1">{step.title}</p>
                  <p className="text-xs text-white/40 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section label="Precio">
          <div className="rounded-2xl border border-white/8 bg-white/[0.025] p-6 flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-3xl font-bold text-white">Desde $1,997</p>
              <p className="text-xs text-white/30 mt-1">precio según alcance</p>
              <p className="text-xs text-white/25 mt-0.5 italic">La cotización final se define tras la llamada de diagnóstico.</p>
            </div>
            <Link href={AGENDAR} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#F97316] hover:bg-[#ea6c0c] text-white text-sm font-semibold transition-all hover:shadow-[0_0_20px_rgba(249,115,22,0.3)]">
              Agendar llamada
              <ArrowRight size={14} />
            </Link>
          </div>
        </Section>

        <Section label="Preguntas frecuentes">
          <div className="space-y-2">
            {faqs.map((faq) => (
              <details key={faq.q} className="group rounded-2xl border border-white/8 bg-white/[0.025] overflow-hidden">
                <summary className="flex items-center justify-between gap-4 px-5 py-4 cursor-pointer list-none text-sm font-medium text-white/70 hover:text-white transition-colors">
                  {faq.q}
                  <ChevronDown size={14} className="shrink-0 text-white/25 group-open:rotate-180 transition-transform" />
                </summary>
                <p className="px-5 pb-4 text-xs text-white/40 leading-relaxed">{faq.a}</p>
              </details>
            ))}
          </div>
        </Section>

        <FinalCta />
      </div>
    </div>
  )
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-10">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/25 mb-4">{label}</p>
      {children}
    </div>
  )
}

function FinalCta() {
  return (
    <div className="rounded-2xl border border-[#F97316]/20 bg-[#F97316]/[0.04] p-8 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#F97316] mb-3">¿Listo para empezar?</p>
      <h2 className="text-2xl font-bold text-white mb-3">Contanos qué necesitás</h2>
      <p className="text-sm text-white/40 mb-7 max-w-sm mx-auto">30 minutos para entender tu operación y diseñar la solución correcta. Sin compromiso.</p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link href={AGENDAR} className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-[#F97316] hover:bg-[#ea6c0c] text-white text-sm font-semibold transition-all hover:shadow-[0_0_24px_rgba(249,115,22,0.3)]">
          Agendar llamada gratis
          <ArrowRight size={15} />
        </Link>
        <Link href="/precios" className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl border border-white/10 hover:border-white/20 text-white/55 hover:text-white text-sm font-semibold transition-all">
          Ver todos los servicios
        </Link>
      </div>
    </div>
  )
}
