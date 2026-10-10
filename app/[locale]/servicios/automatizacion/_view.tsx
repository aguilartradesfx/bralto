import { Check } from '@/components/home/icons'
import { vars, type Locale } from '@/components/home/primitives'
import { ServicePage, Showcase, type ServiceCopy } from '@/components/home/service'

// Automatizaciones: procesos completos que avanzan solos entre sistemas, clientes y equipo. No es un
// agente que conversa (eso es /servicios/agentes-ia): la IA, si está, es un paso más del proceso.
// Los flujos son ejemplos, no casos de clientes: así lo presenta la página.

type Who = 'trigger' | 'system' | 'client' | 'team'

type Copy = ServiceCopy & {
  pipeHeadline: string
  pipeBold: string
  actors: Record<Who, string>
  pipe: { who: Who; label: string; sub: string }[]
  pipeNote: string
  beforeSide: string
  beforeItems: string[]
  afterSide: string
  afterItems: string[]
  exHeadline: string
  exBold: string
  examples: { tag: string; t: string; d: string }[]
}

const CONTENT: Record<Locale, Copy> = {
  es: {
    badge: 'Automatizaciones',
    headline: 'Procesos que avanzan',
    headlineBold: 'solos, de punta a punta.',
    sub: 'Conectamos sus sistemas, su equipo y sus clientes para que cada paso dispare el siguiente: solicitudes, cotizaciones, contratos, accesos y tareas, sin trabajo manual.',
    stats: [
      ['Make · n8n · código', 'Plataformas'],
      ['2 a 3 sem.', 'Tiempo de entrega'],
      ['30 días', 'Soporte incluido'],
    ],
    pipeHeadline: 'De la solicitud a la producción,',
    pipeBold: 'sin que nadie empuje.',
    actors: { trigger: 'Disparador', system: 'Sistema', client: 'Cliente', team: 'Equipo' },
    pipe: [
      { who: 'trigger', label: 'Llega una solicitud', sub: 'Formulario, WhatsApp o correo' },
      { who: 'system', label: 'Se agenda con un asesor', sub: 'Con un resumen de lo que busca' },
      { who: 'system', label: 'Sale la cotización', sub: 'Sola, con sus precios' },
      { who: 'client', label: 'El cliente la acepta', sub: 'En línea, desde el enlace' },
      { who: 'system', label: 'Llega el contrato', sub: 'Listo para firmar en línea' },
      { who: 'system', label: 'Se crean sus accesos', sub: 'A la plataforma y al sistema' },
      { who: 'team', label: 'Arranca el onboarding', sub: 'Asignado a la persona a cargo' },
      { who: 'team', label: 'Empieza la producción', sub: 'La siguiente persona recibe la tarea' },
    ],
    pipeNote: 'Ejemplo de un proceso de punta a punta. Cada negocio tiene el suyo: en el diagnóstico mapeamos el de usted.',
    beforeSide: 'Sin automatizar',
    beforeItems: [
      'Datos copiados a mano de un sistema a otro',
      'Cotizaciones y contratos armados uno por uno',
      'Clientes esperando a que alguien cree sus accesos',
      'Cada traspaso entre personas depende de un mensaje',
    ],
    afterSide: 'Con Bralto',
    afterItems: [
      'Los datos pasan solos entre sus sistemas',
      'Cotizaciones y contratos que salen al momento',
      'Accesos creados en cuanto el cliente firma',
      'Cada persona recibe su tarea con todo el contexto',
    ],
    exHeadline: 'Más procesos que',
    exBold: 'avanzan solos.',
    examples: [
      { tag: 'Contenido', t: 'Un blog nuevo todos los días', d: 'Artículos sobre su nicho que se escriben, se revisan y se publican solos cada día, y llegan a su comunidad.' },
      { tag: 'Aprobaciones', t: 'Sin perseguir a nadie', d: 'Cada solicitud llega al responsable correcto, se aprueba desde el celular y el paso siguiente arranca solo.' },
      { tag: 'Reportes', t: 'Números que se arman solos', d: 'El resumen de ventas y de la operación llega a su panel y a su correo, sin que nadie junte datos a mano.' },
      { tag: 'Postventa', t: 'Seguimiento en el momento justo', d: 'Recordatorios, encuestas y renovaciones que salen según lo que pasó con cada cliente.' },
    ],
    features: [
      { t: 'Mapeo del proceso completo', d: 'Dibujamos con su equipo cada paso, quién lo hace y qué lo dispara, y quitamos los pasos que sobran.' },
      { t: 'Integraciones con sus herramientas', d: 'Conectamos con CRM, WhatsApp, correo, Google Workspace, calendarios, ERP y cualquier API con la que ya trabaje.' },
      { t: 'Documentos que se generan solos', d: 'Cotizaciones, contratos y documentos con los datos de cada cliente, listos para enviar o firmar.' },
      { t: 'Tareas, asignaciones y aprobaciones', d: 'Cada paso le llega a la persona correcta, con responsable, fecha y todo el contexto.' },
      { t: 'Pruebas y documentación', d: 'Corremos el flujo con casos reales antes de entregarlo y le dejamos documentación clara para que su equipo lo entienda.' },
      { t: 'Soporte post-entrega 30 días', d: 'Un mes de soporte incluido para resolver dudas, ajustes menores y garantizar que todo opere en producción.' },
    ],
    steps: [
      { t: 'Diagnóstico del proceso', d: 'Entrevistamos a su equipo, mapeamos el flujo actual y detectamos los cuellos de botella. Definimos el disparador, la lógica y el resultado esperado.' },
      { t: 'Construcción e integración', d: 'Desarrollamos el flujo en Make, n8n o código propio según el caso, lo integramos con sus herramientas y sumamos IA solo en los pasos que la necesitan.' },
      { t: 'Pruebas, entrega y documentación', d: 'Validamos con datos reales, ajustamos hasta que todo funcione, y entregamos con documentación completa y sesión de capacitación.' },
    ],
    faqs: [
      { q: '¿Qué procesos se pueden automatizar?', a: 'Los que hoy dependen de que alguien se acuerde o copie datos: solicitudes, cotizaciones, contratos, accesos, onboarding, tareas del equipo, aprobaciones, reportes y publicaciones, entre muchos otros.' },
      { q: '¿En qué se diferencia de un agente de IA?', a: 'El agente de IA conversa con sus clientes. La automatización mueve el proceso completo entre sus sistemas y su equipo, de un paso al siguiente. Pueden ir juntos: el agente atiende y la automatización se encarga del resto.' },
      { q: '¿Qué herramientas usan para automatizar?', a: 'Trabajamos con Make (ex-Integromat), n8n y código propio según la complejidad del caso. También usamos las APIs de OpenAI, WhatsApp Business y las herramientas específicas de cada cliente.' },
      { q: '¿Necesito conocimiento técnico para operar la automatización después?', a: 'No. El objetivo es que funcione sola. El soporte de 30 días incluido está para resolver cualquier duda y asegurarnos de que su equipo se sienta cómodo con lo que construimos.' },
      { q: '¿Las licencias de plataformas como Make están incluidas?', a: 'No. Las licencias de terceros (Make, n8n cloud, APIs de IA) son un costo aparte que el cliente gestiona directamente. Lo asesoramos para elegir el plan más eficiente según el volumen de su operación.' },
    ],
    ctaHeadline: 'Hablemos de',
    ctaBold: 'su proceso.',
  },
  en: {
    badge: 'Automations',
    headline: 'Processes that move',
    headlineBold: 'on their own, end to end.',
    sub: 'We connect your systems, your team, and your customers so each step triggers the next: requests, quotes, contracts, access, and tasks, with no manual work.',
    stats: [
      ['Make · n8n · code', 'Platforms'],
      ['2 to 3 wks', 'Delivery time'],
      ['30 days', 'Support included'],
    ],
    pipeHeadline: 'From request to production,',
    pipeBold: 'without anyone pushing.',
    actors: { trigger: 'Trigger', system: 'System', client: 'Client', team: 'Team' },
    pipe: [
      { who: 'trigger', label: 'A request comes in', sub: 'Form, WhatsApp, or email' },
      { who: 'system', label: 'Booked with an advisor', sub: 'With a summary of what they need' },
      { who: 'system', label: 'The quote goes out', sub: 'On its own, with your prices' },
      { who: 'client', label: 'The client accepts', sub: 'Online, from the link' },
      { who: 'system', label: 'The contract arrives', sub: 'Ready to sign online' },
      { who: 'system', label: 'Access is created', sub: 'To the platform and the system' },
      { who: 'team', label: 'Onboarding starts', sub: 'Assigned to the person in charge' },
      { who: 'team', label: 'Production begins', sub: 'The next person gets the task' },
    ],
    pipeNote: 'An example of an end-to-end process. Every business has its own: in the diagnosis we map yours.',
    beforeSide: 'Without automation',
    beforeItems: [
      'Data copied by hand from one system to another',
      'Quotes and contracts put together one by one',
      'Clients waiting for someone to create their access',
      'Every handoff between people depends on a message',
    ],
    afterSide: 'With Bralto',
    afterItems: [
      'Data flows between your systems on its own',
      'Quotes and contracts that go out instantly',
      'Access created the moment the client signs',
      'Everyone gets their task with full context',
    ],
    exHeadline: 'More processes that',
    exBold: 'run themselves.',
    examples: [
      { tag: 'Content', t: 'A new blog post every day', d: 'Articles about your niche that get written, reviewed, and published every day on their own, and reach your community.' },
      { tag: 'Approvals', t: 'No chasing anyone', d: 'Every request reaches the right person, gets approved from a phone, and the next step starts on its own.' },
      { tag: 'Reports', t: 'Numbers that build themselves', d: 'Your sales and operations summary lands in your dashboard and inbox, with no one pulling data by hand.' },
      { tag: 'After the sale', t: 'Follow-up at the right moment', d: 'Reminders, surveys, and renewals that go out based on what happened with each customer.' },
    ],
    features: [
      { t: 'Full process mapping', d: 'We map every step with your team, who does it and what triggers it, and remove the steps you no longer need.' },
      { t: 'Integrations with your stack', d: 'We connect with your CRM, WhatsApp, email, Google Workspace, calendars, ERP, and any API you already use.' },
      { t: 'Documents that generate themselves', d: 'Quotes, contracts, and documents filled with each client’s data, ready to send or sign.' },
      { t: 'Tasks, assignments, and approvals', d: 'Each step reaches the right person, with an owner, a due date, and full context.' },
      { t: 'Testing & documentation', d: 'We run the workflow with real cases before handing it over and leave clear documentation so your team understands it.' },
      { t: '30-day post-launch support', d: 'A full month of support included to answer questions, handle minor tweaks, and make sure everything runs smoothly in production.' },
    ],
    steps: [
      { t: 'Process diagnosis', d: 'We interview your team, map the current workflow, and identify the bottlenecks. We define the trigger, the logic, and the expected outcome.' },
      { t: 'Build & integrate', d: 'We build the workflow in Make, n8n, or custom code depending on the case, integrate it with your tools, and add AI only to the steps that need it.' },
      { t: 'Test, launch & document', d: 'We validate with real data, iterate until everything works, and deliver with complete documentation and a training session.' },
    ],
    faqs: [
      { q: 'What kinds of processes can be automated?', a: 'The ones that depend on someone remembering or copying data today: requests, quotes, contracts, access, onboarding, team tasks, approvals, reports, and publishing, and a lot more.' },
      { q: 'How is this different from an AI agent?', a: 'An AI agent talks with your customers. An automation moves the whole process across your systems and your team, from one step to the next. They can work together: the agent handles the conversation and the automation takes care of the rest.' },
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
      <Showcase id="sv-pipe-title" light={c.pipeHeadline} bold={c.pipeBold}>
        {/* Los ocho pasos se encienden en orden, como una solicitud avanzando sola */}
        <div className="sv-pipe hm-glass hm-glass--thick hm-rv">
          <ol className="sv-pipe__steps">
            {c.pipe.map((step, i) => (
              <li key={step.label} className="sv-pipe__step" style={vars({ i })}>
                <div className="sv-pipe__top">
                  <span className="sv-pipe__n">{String(i + 1).padStart(2, '0')}</span>
                  <span className={`sv-pipe__who sv-pipe__who--${step.who}`}>{c.actors[step.who]}</span>
                </div>
                <span className="sv-pipe__label">{step.label}</span>
                <span className="sv-pipe__sub">{step.sub}</span>
              </li>
            ))}
          </ol>
          <p className="sv-pipe__note">{c.pipeNote}</p>
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

      <Showcase id="sv-examples-title" light={c.exHeadline} bold={c.exBold}>
        <ul className="sv-examples">
          {c.examples.map((e) => (
            <li key={e.tag} className="sv-example hm-glass hm-rv">
              <p className="sv-tag">{e.tag}</p>
              <h3>{e.t}</h3>
              <p>{e.d}</p>
            </li>
          ))}
        </ul>
      </Showcase>
    </ServicePage>
  )
}
