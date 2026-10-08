import { getTranslations } from 'next-intl/server'
import { cn } from '@/lib/utils'
import type { Locale } from '@/components/home/primitives'
import { ServicePage, Showcase, type ServiceCopy } from '@/components/home/service'

// Panel de ejemplo (rotulado como tal): valores y nombres ilustrativos
const STATS = ['127', '43', '$42,800', '94%']
const ROWS = [
  { name: 'Ana García', val: '$1,200', status: '' },
  { name: 'Luis Torres', val: '$850', status: 'sv-status--ring' },
  { name: 'Café Moderno', val: '$2,400', status: 'sv-status--lead' },
  { name: 'Restaurante Sur', val: '$980', status: '' },
  { name: 'Clínica Norte', val: '$3,200', status: 'sv-status--dim' },
]

type Copy = ServiceCopy & {
  dashHeadline: string
  dashItalic: string
  appUrl: string
  appCaption: string
  sidebarItems: string[]
  myCompany: string
  statsLabels: string[]
  tableHeaders: string[]
  rowsStatus: string[]
  rowsDates: string[]
  stackLabel: string
  stack: { name: string; desc: string }[]
}

const CONTENT: Record<Locale, Copy> = {
  es: {
    badge: 'Sistemas internos',
    headline: 'Su operación,',
    headlineBold: 'hecha sistema.',
    sub: 'Herramientas internas construidas exactamente para su flujo de trabajo, no soluciones genéricas que obligan a su equipo a adaptarse.',
    stats: [
      ['4 a 12 sem.', 'Tiempo de entrega'],
      ['100%', 'Código suyo'],
      ['30 días', 'Soporte incluido'],
    ],
    dashHeadline: 'Su sistema, construido',
    dashItalic: 'para usted.',
    appUrl: 'crm.suempresa.io/panel',
    appCaption: 'Panel interno de ejemplo con clientes, pedidos e ingresos.',
    sidebarItems: ['Panel', 'Clientes', 'Pedidos', 'Mensajes', 'Reportes', 'Configuración'],
    myCompany: 'Mi empresa',
    statsLabels: ['Clientes activos', 'Pedidos hoy', 'MRR', 'Satisfacción'],
    tableHeaders: ['Cliente', 'Estado', 'Valor', 'Fecha'],
    rowsStatus: ['Activo', 'En proceso', 'Nuevo lead', 'Activo', 'Propuesta'],
    rowsDates: ['8 may', '7 may', '7 may', '6 may', '5 may'],
    stackLabel: 'Stack tecnológico',
    stack: [
      { name: 'Next.js', desc: 'Frontend y API' },
      { name: 'Supabase', desc: 'Base de datos' },
      { name: 'PostgreSQL', desc: 'SQL y consultas' },
      { name: 'Node.js', desc: 'Lógica de servidor' },
    ],
    features: [
      { t: 'Interfaz diseñada a su flujo', d: 'Dashboards, gestores de pedidos, portales de clientes o cualquier herramienta interna, construida exactamente para cómo opera su equipo.' },
      { t: 'Multi-usuario y permisos', d: 'Roles diferenciados por área, accesos controlados y login propio. Cada usuario ve y puede hacer solo lo que le corresponde.' },
      { t: 'Base de datos a medida', d: 'Modelamos la estructura de datos de su operación usando Supabase y PostgreSQL. Su información, organizada y disponible en tiempo real.' },
      { t: 'Integraciones con sistemas existentes', d: 'Conectamos con CRM, WhatsApp, Google Sheets, plataformas de facturación, ERP y cualquier sistema que ya use en el día a día.' },
      { t: 'Documentación técnica incluida', d: 'Entregamos manual de uso para su equipo y documentación técnica para que el sistema pueda ser mantenido o ampliado en el futuro.' },
      { t: 'Soporte post-entrega 30 días', d: 'Un mes de soporte incluido para ajustes, dudas y asegurarnos de que el sistema opera bien en producción con datos reales.' },
    ],
    steps: [
      { t: 'Análisis de requerimientos', d: 'Sesiones de levantamiento donde mapeamos sus flujos actuales, los puntos de dolor y lo que necesita el sistema para reemplazarlos. Salimos con un brief técnico claro.' },
      { t: 'Diseño y desarrollo', d: 'Construimos en iteraciones cortas con demos parciales para que pueda ver el avance y ajustar antes de que esté terminado. Stack: Next.js, Supabase, Node.' },
      { t: 'Entrega y capacitación', d: 'Entregamos el sistema funcionando, hacemos una sesión de capacitación con su equipo y dejamos toda la documentación lista para operar desde el primer día.' },
    ],
    faqs: [
      { q: '¿Qué tipo de sistemas construyen?', a: 'Gestores de pedidos, CRM propio, paneles de inventario, portales de clientes, sistemas de reservas internas, dashboards de operaciones, herramientas de seguimiento y cualquier sistema que hoy esté haciendo a mano o en hojas de cálculo.' },
      { q: '¿El código es mío después de la entrega?', a: 'Sí. El código fuente es propiedad del cliente desde el primer día. Lo entregamos completo, documentado y sin restricciones.' },
      { q: '¿Cuánto tiempo toma construir un sistema?', a: 'Entre 4 y 12 semanas según la complejidad. Un sistema básico (1-2 módulos, sin integraciones complejas) puede estar listo en un mes. Uno más complejo con múltiples módulos e integraciones puede tomar 2-3 meses.' },
      { q: '¿Cuánto cuesta un sistema?', a: 'Varía según el número de módulos, las integraciones requeridas y la complejidad funcional. Lo definimos con precisión después del diagnóstico, donde entendemos el alcance real.' },
    ],
    ctaHeadline: 'Cuéntenos',
    ctaBold: 'qué necesita.',
  },
  en: {
    badge: 'Internal systems',
    headline: 'Your operation,',
    headlineBold: 'built into a system.',
    sub: 'Internal tools built exactly for your workflow, not generic solutions that force your team to adapt.',
    stats: [
      ['4 to 12 wks', 'Delivery time'],
      ['100%', 'Your code'],
      ['30 days', 'Support included'],
    ],
    dashHeadline: 'Your system, built',
    dashItalic: 'for you.',
    appUrl: 'crm.yourcompany.io/dashboard',
    appCaption: 'Example internal dashboard with clients, orders, and revenue.',
    sidebarItems: ['Dashboard', 'Clients', 'Orders', 'Messages', 'Reports', 'Settings'],
    myCompany: 'My company',
    statsLabels: ['Active clients', 'Orders today', 'MRR', 'Satisfaction'],
    tableHeaders: ['Client', 'Status', 'Value', 'Date'],
    rowsStatus: ['Active', 'In progress', 'New lead', 'Active', 'Proposal'],
    rowsDates: ['May 8', 'May 7', 'May 7', 'May 6', 'May 5'],
    stackLabel: 'Tech stack',
    stack: [
      { name: 'Next.js', desc: 'Frontend & API' },
      { name: 'Supabase', desc: 'Database' },
      { name: 'PostgreSQL', desc: 'SQL & queries' },
      { name: 'Node.js', desc: 'Backend logic' },
    ],
    features: [
      { t: 'Interface built for your workflow', d: 'Dashboards, order managers, client portals, or any internal tool, built exactly for how your team operates.' },
      { t: 'Multi-user & permissions', d: 'Role-based access by department, controlled permissions, and individual logins. Each user sees and can do only what they need.' },
      { t: 'Custom database', d: "We model your operation's data structure using Supabase and PostgreSQL. Your information, organized and available in real time." },
      { t: 'Integrations with existing systems', d: 'We connect with CRMs, WhatsApp, Google Sheets, billing platforms, ERPs, and any system you already use day to day.' },
      { t: 'Technical documentation included', d: 'We deliver a user manual for your team and technical docs so the system can be maintained or expanded in the future.' },
      { t: '30-day post-launch support', d: 'One month of support included for tweaks, questions, and making sure the system runs smoothly in production with real data.' },
    ],
    steps: [
      { t: 'Requirements analysis', d: 'Discovery sessions where we map your current workflows, pain points, and what the system needs to replace. We leave with a clear technical brief.' },
      { t: 'Design & development', d: "We build in short iterations with partial demos so you can see progress and adjust before it's finished. Stack: Next.js, Supabase, Node." },
      { t: 'Delivery & training', d: 'We hand over the working system, run a training session with your team, and leave all documentation ready so you can operate from day one.' },
    ],
    faqs: [
      { q: 'What kind of systems do you build?', a: "Order managers, custom CRMs, inventory panels, client portals, internal booking systems, operations dashboards, tracking tools: anything you're currently doing by hand or in spreadsheets." },
      { q: 'Do I own the code after delivery?', a: 'Yes. The source code belongs to the client from day one. We deliver it complete, documented, and with no restrictions.' },
      { q: 'How long does it take to build a system?', a: 'Between 4 and 12 weeks depending on complexity. A basic system (1 or 2 modules, no complex integrations) can be ready in a month. A more complex one with multiple modules and integrations can take 2 to 3 months.' },
      { q: 'How much does a system cost?', a: 'It depends on the number of modules, the integrations required, and the functional complexity. We pin it down precisely after the diagnostic call, where we understand the actual scope.' },
    ],
    ctaHeadline: 'Tell us',
    ctaBold: 'what you need.',
  },
}

export default async function SistemasInternosView({ locale }: { locale: Locale }) {
  const c = CONTENT[locale]
  const t = await getTranslations({ locale, namespace: 'Home.servicePage' })

  return (
    <ServicePage locale={locale} service="sistemasInternos" copy={c}>
      <Showcase id="sv-app-title" light={c.dashHeadline} bold={c.dashItalic}>
        <figure className="sv-app hm-glass hm-glass--thick hm-rv">
          <figcaption className="sr-only">{c.appCaption}</figcaption>
          <div className="sv-browser__bar">
            <span className="sv-dots" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            <span className="sv-browser__url">{c.appUrl}</span>
            <span className="sv-tag">{t('example')}</span>
          </div>
          <div className="sv-app__body" aria-hidden="true">
            <div className="sv-app__side">
              <p className="sv-tag">{c.myCompany}</p>
              <ul>
                {c.sidebarItems.map((item, i) => (
                  <li key={item} className={i === 0 ? 'is-on' : undefined}>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="sv-app__main">
              <div className="sv-app__tiles">
                {STATS.map((value, i) => (
                  <div key={c.statsLabels[i]}>
                    <b>{value}</b>
                    <span>{c.statsLabels[i]}</span>
                  </div>
                ))}
              </div>
              <table className="sv-app__table">
                <thead>
                  <tr>
                    <th>{c.tableHeaders[0]}</th>
                    <th className="sv-col-status">{c.tableHeaders[1]}</th>
                    <th className="num">{c.tableHeaders[2]}</th>
                    <th className="sv-col-date num">{c.tableHeaders[3]}</th>
                  </tr>
                </thead>
                <tbody>
                  {ROWS.map((row, ri) => (
                    <tr key={row.name}>
                      <td>{row.name}</td>
                      <td className="sv-col-status">
                        <span className={cn('sv-status', row.status)} />
                        {c.rowsStatus[ri]}
                      </td>
                      <td className="num">{row.val}</td>
                      <td className="sv-col-date num">{c.rowsDates[ri]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </figure>

        <p className="sv-caption">{c.stackLabel}</p>
        <ul className="sv-chips">
          {c.stack.map((s) => (
            <li key={s.name} className="sv-chip">
              <b>{s.name}</b>
              <span>{s.desc}</span>
            </li>
          ))}
        </ul>
      </Showcase>
    </ServicePage>
  )
}
