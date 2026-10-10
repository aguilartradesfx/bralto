import Link from 'next/link'
import type { ReactNode } from 'react'
import { Arrow, Check } from '@/components/home/icons'
import { vars, type Locale } from '@/components/home/primitives'
import { ServicePage, Showcase, type ServiceCopy } from '@/components/home/service'

// Agentes de IA: atienden, califican y agendan. Antes esta página se llamaba "Automatización", pero
// un agente que conversa no es una automatización (esa tiene su propia página, /servicios/automatizacion).

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
  wfHeadline: string
  wfItalic: string
  flow: { tag: string; label: string; sub: string }[]
  beforeSide: string
  beforeItems: string[]
  afterSide: string
  afterItems: string[]
  proofLabel: string
  // Agentes funcionando en casos reales (lo que dice cada caso en clients.ts)
  proof: { id: string; name: string; d: string }[]
  viewCase: string
}

const CONTENT: Record<Locale, Copy> = {
  es: {
    badge: 'Agentes de IA',
    headline: 'Cada mensaje,',
    headlineBold: 'respondido en segundos.',
    sub: 'Agentes de IA entrenados con la información de su negocio que atienden por WhatsApp, Instagram, web y correo, califican a cada contacto y agendan, a cualquier hora.',
    stats: [
      ['En segundos', 'Respuesta'],
      ['24/7', 'Atención'],
      ['30 días', 'Soporte incluido'],
    ],
    wfHeadline: 'De un mensaje a una cita,',
    wfItalic: 'sin esperar a nadie.',
    flow: [
      { tag: 'Entra', label: 'Llega un mensaje', sub: 'WhatsApp, Instagram, web o correo' },
      { tag: 'Responde', label: 'El agente entiende y responde', sub: 'Con sus precios, horarios y servicios' },
      { tag: 'Agenda', label: 'Califica y agenda', sub: 'La cita queda en su calendario' },
      { tag: 'Registra', label: 'Todo queda en el CRM', sub: 'Su equipo ve la conversación completa' },
    ],
    beforeSide: 'Sin agente',
    beforeItems: [
      'Mensajes que esperan horas por respuesta',
      'Las mismas preguntas, respondidas a mano',
      'Contactos que se enfrían fuera de horario',
      'Citas coordinadas mensaje por mensaje',
    ],
    afterSide: 'Con un agente de IA',
    afterItems: [
      'Respuesta en segundos, a cualquier hora',
      'Preguntas frecuentes resueltas solas',
      'Cada contacto calificado y con seguimiento',
      'Citas agendadas directo en el calendario',
    ],
    proofLabel: 'Ya funcionan en',
    proof: [
      { id: 'nanku', name: 'Nanku', d: 'Atiende, guía y cierra reservas las 24 horas.' },
      { id: 'ecoviva', name: 'Ecoviva', d: 'Asesora y agenda visitas a los proyectos en tiempo real.' },
    ],
    viewCase: 'Ver caso',
    features: [
      { t: 'Entrenado con su negocio', d: 'Aprende sus servicios, precios, horarios y preguntas frecuentes para responder como lo haría su equipo.' },
      { t: 'Todos sus canales', d: 'WhatsApp, Instagram, Messenger, el chat de su sitio web y el correo, desde un solo lugar.' },
      { t: 'Califica y agenda', d: 'Hace las preguntas correctas, separa a los interesados y agenda la cita directo en su calendario.' },
      { t: 'Pasa a una persona cuando hace falta', d: 'Si algo se sale de lo que sabe, le pasa la conversación a alguien de su equipo con todo el contexto.' },
      { t: 'Todo queda en el CRM', d: 'Cada conversación y cada dato del contacto quedan registrados para dar seguimiento.' },
      { t: 'Soporte post-entrega 30 días', d: 'Un mes de soporte incluido para resolver dudas, ajustes menores y garantizar que todo opere en producción.' },
    ],
    steps: [
      { t: 'Diagnóstico de la atención', d: 'Revisamos qué le preguntan sus clientes, qué responde su equipo y en qué momento una conversación tiene que pasar a una persona.' },
      { t: 'Entrenamiento e integración', d: 'Entrenamos al agente con la información de su negocio y lo conectamos con sus canales, su CRM y su calendario.' },
      { t: 'Pruebas, entrega y capacitación', d: 'Lo probamos con conversaciones reales, ajustamos hasta que responda como debe y le enseñamos a su equipo a supervisarlo.' },
    ],
    faqs: [
      { q: '¿La IA va a responder bien a mis clientes?', a: 'El agente se entrena con la información de su negocio: servicios, precios, horarios y preguntas frecuentes. Cuando algo se sale de lo que sabe, pasa la conversación a una persona de su equipo.' },
      { q: '¿En qué canales funciona?', a: 'WhatsApp, Instagram, Messenger, el chat de su sitio web y el correo. Todas las conversaciones llegan a un mismo lugar.' },
      { q: '¿Un agente de IA es lo mismo que una automatización?', a: 'No. El agente conversa: responde, califica y agenda. Una automatización mueve el proceso completo entre sus sistemas y su equipo, como cotizaciones, contratos, accesos y tareas. Muchas veces van juntos.' },
      { q: '¿Las licencias de IA están incluidas?', a: 'No. Las licencias de terceros (APIs de IA, plataformas de automatización) son un costo aparte que el cliente gestiona directamente. Lo asesoramos para elegir el plan más eficiente según el volumen de su operación.' },
    ],
    ctaHeadline: 'Hablemos de',
    ctaBold: 'su atención.',
  },
  en: {
    badge: 'AI agents',
    headline: 'Every message,',
    headlineBold: 'answered in seconds.',
    sub: 'AI agents trained on your business information that handle WhatsApp, Instagram, web, and email, qualify every lead, and book appointments, at any hour.',
    stats: [
      ['In seconds', 'Response'],
      ['24/7', 'Availability'],
      ['30 days', 'Support included'],
    ],
    wfHeadline: 'From a message to a meeting,',
    wfItalic: 'without waiting on anyone.',
    flow: [
      { tag: 'In', label: 'A message comes in', sub: 'WhatsApp, Instagram, web, or email' },
      { tag: 'Reply', label: 'The agent understands and replies', sub: 'With your prices, hours, and services' },
      { tag: 'Book', label: 'Qualifies and books', sub: 'The meeting lands on your calendar' },
      { tag: 'Log', label: 'Everything goes into the CRM', sub: 'Your team sees the full conversation' },
    ],
    beforeSide: 'Without an agent',
    beforeItems: [
      'Messages waiting hours for a reply',
      'The same questions, answered by hand',
      'Leads going cold after hours',
      'Meetings arranged message by message',
    ],
    afterSide: 'With an AI agent',
    afterItems: [
      'Replies in seconds, at any hour',
      'Common questions answered on their own',
      'Every lead qualified and followed up',
      'Meetings booked straight onto the calendar',
    ],
    proofLabel: 'Already running at',
    proof: [
      { id: 'nanku', name: 'Nanku', d: 'Answers, guides, and closes reservations around the clock.' },
      { id: 'ecoviva', name: 'Ecoviva', d: 'Advises visitors and books property tours in real time.' },
    ],
    viewCase: 'View case',
    features: [
      { t: 'Trained on your business', d: 'It learns your services, prices, hours, and FAQs so it answers the way your team would.' },
      { t: 'All your channels', d: 'WhatsApp, Instagram, Messenger, your website chat, and email, all in one place.' },
      { t: 'Qualifies and books', d: 'It asks the right questions, sorts out the real prospects, and books the meeting straight onto your calendar.' },
      { t: 'Hands off to a person when needed', d: 'When something falls outside what it knows, it passes the conversation to someone on your team with full context.' },
      { t: 'Everything in the CRM', d: 'Every conversation and every contact detail is logged so you can follow up.' },
      { t: '30-day post-launch support', d: 'A full month of support included to answer questions, handle minor tweaks, and make sure everything runs smoothly in production.' },
    ],
    steps: [
      { t: 'Customer service diagnosis', d: 'We review what your customers ask, how your team answers, and when a conversation needs to go to a person.' },
      { t: 'Training & integration', d: 'We train the agent on your business information and connect it to your channels, your CRM, and your calendar.' },
      { t: 'Test, launch & training', d: 'We test it with real conversations, adjust until it answers the way it should, and show your team how to supervise it.' },
    ],
    faqs: [
      { q: 'Will the AI respond well to my customers?', a: 'The agent is trained on your business information: services, prices, hours, and frequently asked questions. When something falls outside what it knows, it hands the conversation to someone on your team.' },
      { q: 'Which channels does it work on?', a: 'WhatsApp, Instagram, Messenger, your website chat, and email. All conversations land in one place.' },
      { q: 'Is an AI agent the same as an automation?', a: 'No. The agent talks: it replies, qualifies, and books. An automation moves the whole process across your systems and your team, like quotes, contracts, access, and tasks. They often work together.' },
      { q: 'Are AI licenses included?', a: "No. Third-party licenses (AI APIs, automation platforms) are a separate cost that clients manage directly. We'll help you choose the most cost-effective plan for your volume." },
    ],
    ctaHeadline: "Let's talk about",
    ctaBold: 'your customer service.',
  },
}

export default function AgentesIaView({ locale }: { locale: Locale }) {
  const c = CONTENT[locale]

  return (
    <ServicePage locale={locale} service="agentesIa" copy={c}>
      <Showcase id="sv-flow-title" light={c.wfHeadline} bold={c.wfItalic}>
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

        {/* Prueba: agentes que ya atienden en proyectos reales, con el link a cada caso */}
        <div className="sv-proof hm-rv">
          <p className="sv-tag">{c.proofLabel}</p>
          <ul>
            {c.proof.map((p) => (
              <li key={p.id}>
                <Link href={`/${locale}/servicios/sitios-web/${p.id}`} className="sv-proof__row hm-glass">
                  <b>{p.name}</b>
                  <span>{p.d}</span>
                  <span className="sv-proof__go">
                    {c.viewCase}
                    <Arrow />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </Showcase>
    </ServicePage>
  )
}
