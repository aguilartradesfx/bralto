import type { ReactNode } from 'react'
import { Check } from '@/components/home/icons'
import { vars, type Locale } from '@/components/home/primitives'
import { ServicePage, Showcase, type ServiceCopy } from '@/components/home/service'

// Íconos de trazo fino para las cuatro estaciones del flujo
const svg = (children: ReactNode) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
)

const FLOW_ICONS = [
  svg(<path d="M4 13.5h4.2l1.4 2.2h4.8l1.4-2.2H20M4 13.5 6.6 6h10.8L20 13.5V18a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18v-4.5Z" />),
  svg(<path d="M4.5 7A2.5 2.5 0 0 1 7 4.5h10A2.5 2.5 0 0 1 19.5 7v6.5A2.5 2.5 0 0 1 17 16h-6.5l-4 3.5V16h0A2.5 2.5 0 0 1 4.5 13.5V7ZM9 10.25h.01M12 10.25h.01M15 10.25h.01" />),
  svg(
    <>
      <rect x="4" y="5.5" width="16" height="14" rx="2.5" />
      <path d="M4 10h16M8.5 3.5v4M15.5 3.5v4" />
    </>,
  ),
  svg(
    <>
      <circle cx="12" cy="12" r="8.25" />
      <path d="m8.75 12.25 2.25 2.25 4.25-4.75" />
    </>,
  ),
]

type Copy = ServiceCopy & {
  wfLabel: string
  wfHeadline: string
  wfItalic: string
  flow: { tag: string; label: string; sub: string }[]
  beforeSide: string
  beforeItems: string[]
  afterSide: string
  afterItems: string[]
}

const CONTENT: Record<Locale, Copy> = {
  es: {
    badge: 'Automatización e IA',
    headline: 'Su operación,',
    headlineBold: 'sin intervención.',
    sub: 'Automatizamos los procesos repetitivos de su negocio para que su equipo se enfoque en lo que realmente importa — y el trabajo siga fluyendo solo.',
    stats: [
      ['Make / n8n', 'Plataformas'],
      ['2–3 sem.', 'Tiempo de entrega'],
      ['30 días', 'Soporte incluido'],
    ],
    wfLabel: 'En acción',
    wfHeadline: 'De un lead a una venta,',
    wfItalic: 'sin tocar nada.',
    flow: [
      { tag: 'Trigger', label: 'Lead nuevo detectado', sub: 'Formulario · WhatsApp · Email' },
      { tag: 'Procesa', label: 'IA evalúa y responde', sub: 'Mensaje personalizado al instante' },
      { tag: 'Ejecuta', label: 'Cita agendada', sub: 'Sync automático con Calendar' },
      { tag: 'Resultado', label: 'CRM actualizado', sub: 'Equipo notificado · Todo listo' },
    ],
    beforeSide: 'Sin automatizar',
    beforeItems: ['Responder cada lead manualmente', 'Copiar datos entre herramientas', 'Olvidar dar seguimiento', 'Equipo frustrado con tareas repetitivas'],
    afterSide: 'Con Bralto',
    afterItems: ['Lead responde solo en segundos', 'Datos fluyen entre sistemas solos', 'Seguimientos automáticos en el momento justo', 'Equipo enfocado en lo que importa'],
    features: [
      { t: 'Workflow end-to-end', d: 'Mapeamos y automatizamos el proceso completo — desde el trigger hasta el resultado final, sin pasos manuales.' },
      { t: 'Agente de IA a medida', d: 'Configuramos un agente que atiende por WhatsApp, email o internamente según la necesidad del negocio.' },
      { t: 'Integraciones con sus herramientas', d: 'Conectamos con CRM, WhatsApp, email, Google Workspace, calendarios, ERP y cualquier API con la que ya trabaje.' },
      { t: 'Pruebas y validación', d: 'Antes de entregar, corremos el flujo con casos reales para asegurarnos de que funciona exactamente como diseñamos.' },
      { t: 'Documentación y handoff', d: 'Entregamos documentación clara para que su equipo entienda y pueda mantener lo que construimos sin depender de nosotros.' },
      { t: 'Soporte post-entrega 30 días', d: 'Un mes de soporte incluido para resolver dudas, ajustes menores y garantizar que todo opere en producción.' },
    ],
    steps: [
      { t: 'Diagnóstico del proceso', d: 'Entrevistamos a su equipo, mapeamos el flujo actual y detectamos los cuellos de botella. Definimos el trigger, la lógica y el resultado esperado.' },
      { t: 'Construcción e integración', d: 'Desarrollamos el flujo en Make, n8n o código propio según el caso. Integramos con sus herramientas existentes y configuramos los agentes de IA.' },
      { t: 'Pruebas, entrega y documentación', d: 'Validamos con datos reales, ajustamos hasta que todo funcione, y entregamos con documentación completa y sesión de capacitación.' },
    ],
    faqs: [
      { q: '¿Qué procesos se pueden automatizar?', a: 'Seguimiento de leads, onboarding de clientes, notificaciones internas, recordatorios automáticos, reportes, respuestas a consultas frecuentes, reservas y agendamientos, entre muchos otros.' },
      { q: '¿Qué herramientas usan para automatizar?', a: 'Trabajamos con Make (ex-Integromat), n8n y código propio según la complejidad del caso. También usamos las APIs de OpenAI, WhatsApp Business y las herramientas específicas de cada cliente.' },
      { q: '¿Necesito conocimiento técnico para operar la automatización después?', a: 'No. El objetivo es que funcione sola. El soporte de 30 días incluido está para resolver cualquier duda y asegurarnos de que su equipo se sienta cómodo con lo que construimos.' },
      { q: '¿Las licencias de plataformas como Make están incluidas?', a: 'No. Las licencias de terceros (Make, n8n cloud, APIs de IA) son un costo aparte que el cliente gestiona directamente. Lo asesoramos para elegir el plan más eficiente según el volumen de su operación.' },
    ],
    ctaHeadline: 'Hablemos de',
    ctaBold: 'su proceso.',
  },
  en: {
    badge: 'Automation & AI',
    headline: 'Your business,',
    headlineBold: 'on autopilot.',
    sub: 'We automate the repetitive work so your team can focus on what actually moves the needle — and everything keeps running on its own.',
    stats: [
      ['Make / n8n', 'Platforms'],
      ['2–3 wks', 'Delivery time'],
      ['30 days', 'Support included'],
    ],
    wfLabel: 'In action',
    wfHeadline: 'From a new lead to a closed deal,',
    wfItalic: 'zero manual work.',
    flow: [
      { tag: 'Trigger', label: 'New lead detected', sub: 'Form · WhatsApp · Email' },
      { tag: 'Process', label: 'AI evaluates & replies', sub: 'Personalized message in seconds' },
      { tag: 'Execute', label: 'Meeting booked', sub: 'Auto-synced with Calendar' },
      { tag: 'Result', label: 'CRM updated', sub: 'Team notified · Ready to go' },
    ],
    beforeSide: 'Without automation',
    beforeItems: ['Responding to every lead by hand', 'Copy-pasting data between tools', 'Dropping the ball on follow-ups', 'Team burned out on busywork'],
    afterSide: 'With Bralto',
    afterItems: ['Leads get a response in seconds', 'Data flows between systems automatically', 'Follow-ups go out at exactly the right time', 'Team focused on the work that matters'],
    features: [
      { t: 'End-to-end workflow', d: 'We map and automate the entire process — from trigger to final result, with no manual steps in between.' },
      { t: 'Custom AI agent', d: 'We build an agent that handles conversations via WhatsApp, email, or internally — however your business needs it.' },
      { t: 'Integrations with your stack', d: 'We connect with your CRM, WhatsApp, email, Google Workspace, calendars, ERP, and any API you already use.' },
      { t: 'Testing & validation', d: 'Before we ship, we run the workflow with real data to make sure everything works exactly as designed.' },
      { t: 'Documentation & handoff', d: 'We deliver clear documentation so your team can understand and maintain what we built — no ongoing dependency on us.' },
      { t: '30-day post-launch support', d: 'A full month of support included to answer questions, handle minor tweaks, and make sure everything runs smoothly in production.' },
    ],
    steps: [
      { t: 'Process diagnosis', d: 'We interview your team, map the current workflow, and identify the bottlenecks. We define the trigger, the logic, and the expected outcome.' },
      { t: 'Build & integrate', d: 'We develop the workflow in Make, n8n, or custom code depending on the case. We integrate with your existing tools and configure the AI agents.' },
      { t: 'Test, launch & document', d: 'We validate with real data, iterate until everything works, and deliver with complete documentation and a training session.' },
    ],
    faqs: [
      { q: 'What kinds of processes can be automated?', a: 'Lead follow-up, client onboarding, internal notifications, automatic reminders, reports, responses to common inquiries, bookings and scheduling — and a lot more.' },
      { q: 'What tools do you use?', a: 'We work with Make (formerly Integromat), n8n, and custom code depending on complexity. We also use the OpenAI API, WhatsApp Business, and whatever tools each client already uses.' },
      { q: 'Do I need technical knowledge to run the automation afterward?', a: 'No. The goal is that it runs itself. The included 30-day support is there to answer questions and make sure your team feels comfortable with what we built.' },
      { q: 'Are platform licenses like Make included?', a: "No. Third-party licenses (Make, n8n cloud, AI APIs) are a separate cost that clients manage directly. We'll help you choose the most cost-effective plan for your volume." },
    ],
    ctaHeadline: "Let's talk about",
    ctaBold: 'your process.',
  },
}

export default function AutomatizacionView({ locale }: { locale: Locale }) {
  const c = CONTENT[locale]

  return (
    <ServicePage locale={locale} service="automatizacion" copy={c}>
      <Showcase id="sv-flow-title" eyebrow={c.wfLabel} light={c.wfHeadline} bold={c.wfItalic}>
        <div className="sv-flow hm-glass hm-glass--thick hm-rv">
          <ol className="sv-flow__steps">
            {c.flow.map((step, i) => (
              <li key={step.tag} className="sv-flow__step" style={vars({ i })}>
                <span className="sv-tag">{step.tag}</span>
                <span className="sv-flow__icon">{FLOW_ICONS[i]}</span>
                <span className="sv-flow__label">{step.label}</span>
                <span className="sv-flow__sub">{step.sub}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="sv-ba">
          <div className="sv-ba__col hm-glass hm-rv">
            <p className="sv-tag">{c.beforeSide}</p>
            <ul>
              {c.beforeItems.map((item) => (
                <li key={item}>
                  <span className="sv-ba__x" aria-hidden="true" />
                  <span className="sv-ba__no">{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="sv-ba__col hm-glass hm-glass--thick hm-rv">
            <p className="sv-tag">{c.afterSide}</p>
            <ul>
              {c.afterItems.map((item) => (
                <li key={item}>
                  <Check />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Showcase>
    </ServicePage>
  )
}
