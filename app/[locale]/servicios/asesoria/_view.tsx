import { SectionHead, type Locale } from '@/components/home/primitives'
import { ServicePage, type ServiceCopy } from '@/components/home/service'
import { ServiceChecklist } from '@/components/home/service-checklist'

type Copy = ServiceCopy & {
  roadmapHeadline: string
  roadmapItalic: string
  phases: { days: string; title: string; desc: string }[]
  checklistHeadline: string
  checklistItalic: string
  checklistDesc: string
  checklistItems: string[]
  triggerTitle: string
  triggerBody: string
  triggerBtn: string
}

const CONTENT: Record<Locale, Copy> = {
  es: {
    badge: 'Asesoría de marketing',
    headline: 'Estrategia clara,',
    headlineBold: 'acciones concretas.',
    sub: 'Para negocios que ya tienen algo construido y quieren crecer con intención, no con tácticas sueltas.',
    stats: [
      ['Diagnóstico', 'Incluido'],
      ['90 días', 'Roadmap'],
      ['2×/mes', 'Seguimiento'],
    ],
    roadmapHeadline: 'De la confusión',
    roadmapItalic: 'a la claridad.',
    phases: [
      { days: 'Días 1 a 30', title: 'Diagnóstico', desc: 'Auditoría completa del negocio, análisis competitivo y definición de la base estratégica.' },
      { days: 'Días 31 a 60', title: 'Estrategia', desc: 'Documento de posicionamiento, canales prioritarios, mensajes clave y KPIs por fase.' },
      { days: 'Días 61 a 90', title: 'Ejecución', desc: 'Primeras acciones en marcha, seguimiento semanal y ajuste según los primeros datos.' },
    ],
    checklistHeadline: '¿Cómo está su',
    checklistItalic: 'marketing hoy?',
    checklistDesc: 'Marque todo lo que le suene conocido. Si elige 3 o más, tenemos algo importante para hablar.',
    checklistItems: [
      'No tengo claro en qué me diferencio de la competencia',
      'No mido el resultado de mis acciones de marketing',
      'No tengo un embudo de conversión definido',
      'Mi mensaje no es consistente en todos los canales',
      'No sé en qué canales debo invertir',
      'No tengo una estrategia de contenido clara',
    ],
    triggerTitle: 'La asesoría es exactamente para esto.',
    triggerBody: 'Si reconoce {n} de estos puntos, ya tenemos por dónde empezar. Una sesión de 30 minutos puede cambiar completamente la dirección.',
    triggerBtn: 'Agendar diagnóstico',
    features: [
      { t: 'Diagnóstico de marca', d: 'Analizamos su propuesta de valor, posicionamiento actual, competencia directa y audiencia objetivo. Identificamos brechas y oportunidades concretas.' },
      { t: 'Plan de marketing a medida', d: 'Definimos canales prioritarios, mensajes clave, presupuesto recomendado y un cronograma de acciones para los próximos 90 días.' },
      { t: 'Estrategia de crecimiento', d: 'Diseñamos el embudo de conversión, establecemos KPIs claros y construimos el roadmap para escalar desde donde está hoy.' },
      { t: 'Sesiones de seguimiento', d: 'Dos sesiones mensuales de una hora para revisar métricas, ajustar la estrategia y resolver dudas sobre la ejecución.' },
      { t: 'Entregable documentado', d: 'Todo lo que trabajamos queda en un documento de estrategia y una presentación ejecutiva que puede compartir con su equipo.' },
      { t: 'Acceso directo al equipo', d: 'Canal de comunicación directa para consultas rápidas entre sesiones. Sin esperar a la próxima reunión para resolver algo urgente.' },
    ],
    steps: [
      { t: 'Diagnóstico inicial', d: 'Usted completa un formulario de onboarding, tenemos una entrevista estratégica de 60 minutos y revisamos todos sus materiales existentes: sitio, redes y campañas anteriores.' },
      { t: 'Construcción de la estrategia', d: 'Entregamos un documento de estrategia completo con posicionamiento, canales, mensajes, roadmap de 90 días y KPIs por fase. Incluye sesión de presentación.' },
      { t: 'Acompañamiento y ajuste', d: 'Dos sesiones mensuales para revisar resultados, ajustar la estrategia según los datos y mantenerlo enfocado en las acciones de mayor impacto.' },
    ],
    faqs: [
      { q: '¿La asesoría es puntual o continua?', a: 'Ambas. La modalidad puntual incluye diagnóstico + estrategia en un solo entregable. La modalidad retainer es mensual e incluye sesiones de seguimiento y ajuste continuo del plan.' },
      { q: '¿Implementan o solo asesoran?', a: 'Este servicio es de estrategia y asesoría. La ejecución es responsabilidad del cliente o de su equipo. Si necesita ejecución, podemos complementarlo con otros servicios de Bralto como campañas, contenido o automatización.' },
      { q: '¿Para qué tipo de negocio es este servicio?', a: 'Ideal para negocios con 1-3 años de operación que quieren crecer con una estrategia clara, no solo tácticas sueltas. También para emprendedores que están lanzando y quieren evitar errores costosos desde el inicio.' },
      { q: '¿Cuánto cuesta?', a: 'Depende del formato: sesión puntual o retainer mensual. Hablamos para definir qué se adapta mejor a su momento y objetivo, y le damos el detalle completo en la llamada.' },
    ],
    ctaHeadline: 'Hablemos de',
    ctaBold: 'su estrategia.',
  },
  en: {
    badge: 'Marketing advisory',
    headline: 'Clear strategy,',
    headlineBold: 'concrete action.',
    sub: 'For businesses that already have something built and want to grow with intention, not scattered tactics.',
    stats: [
      ['Diagnosis', 'Included'],
      ['90 days', 'Roadmap'],
      ['2×/mo', 'Check-ins'],
    ],
    roadmapHeadline: 'From confusion',
    roadmapItalic: 'to clarity.',
    phases: [
      { days: 'Days 1 to 30', title: 'Diagnosis', desc: 'Full business audit, competitive analysis, and definition of the strategic foundation.' },
      { days: 'Days 31 to 60', title: 'Strategy', desc: 'Positioning document, priority channels, key messages, and KPIs by phase.' },
      { days: 'Days 61 to 90', title: 'Execution', desc: 'First actions in motion, weekly check-ins, and adjustments based on early data.' },
    ],
    checklistHeadline: "How's your",
    checklistItalic: 'marketing today?',
    checklistDesc: 'Check everything that sounds familiar. If you pick 3 or more, we have something important to talk about.',
    checklistItems: [
      "I'm not clear on what sets me apart from competitors",
      "I don't measure the results of my marketing efforts",
      "I don't have a defined conversion funnel",
      "My message isn't consistent across all channels",
      "I don't know which channels to invest in",
      "I don't have a clear content strategy",
    ],
    triggerTitle: 'This is exactly what the advisory is for.',
    triggerBody: 'If you checked {n} of these, we already know where to start. One 30-minute session can completely change your direction.',
    triggerBtn: 'Book a diagnostic call',
    features: [
      { t: 'Brand diagnosis', d: 'We analyze your value proposition, current positioning, direct competitors, and target audience. We identify gaps and concrete opportunities.' },
      { t: 'Custom marketing plan', d: 'We define priority channels, key messages, recommended budget, and an action timeline for the next 90 days.' },
      { t: 'Growth strategy', d: 'We design your conversion funnel, set clear KPIs, and build the roadmap to scale from where you are today.' },
      { t: 'Follow-up sessions', d: 'Two monthly one-hour sessions to review metrics, adjust strategy, and work through execution questions.' },
      { t: 'Documented deliverable', d: 'Everything we work on is captured in a strategy document and an executive presentation you can share with your team.' },
      { t: 'Direct team access', d: 'A direct communication channel for quick questions between sessions. No waiting for the next meeting to resolve something urgent.' },
    ],
    steps: [
      { t: 'Initial diagnosis', d: 'You fill out an onboarding form, we run a 60-minute strategy interview, and review all your existing materials: website, social, and past campaigns.' },
      { t: 'Strategy build', d: 'We deliver a complete strategy document with positioning, channels, messages, a 90-day roadmap, and KPIs by phase. Includes a presentation session.' },
      { t: 'Ongoing support', d: 'Two monthly sessions to review results, adjust strategy based on data, and keep you focused on the highest-impact actions.' },
    ],
    faqs: [
      { q: 'Is this a one-time or ongoing engagement?', a: 'Both. The one-time format includes diagnosis + strategy in a single deliverable. The retainer format is monthly and includes follow-up sessions and continuous plan adjustment.' },
      { q: 'Do you implement or just advise?', a: "This service is strategy and advisory. Execution is the client's responsibility or their team's. If you need execution, we can complement it with other Bralto services like campaigns, content, or automation." },
      { q: 'What type of business is this for?', a: 'Ideal for businesses with 1 to 3 years of operation that want to grow with a clear strategy, not just scattered tactics. Also great for founders launching something new who want to avoid costly mistakes from the start.' },
      { q: 'How much does it cost?', a: 'It depends on the format: a one-time session or a monthly retainer. We talk to figure out what fits your stage and goals best, and we give you the full breakdown on the call.' },
    ],
    ctaHeadline: "Let's talk about",
    ctaBold: 'your strategy.',
  },
}

export default function AsesoriaView({ locale }: { locale: Locale }) {
  const c = CONTENT[locale]

  return (
    <ServicePage locale={locale} service="asesoria" copy={c}>
      <section className="hm-section" aria-labelledby="sv-road-title">
        <div className="hm-wrap">
          <SectionHead id="sv-road-title" light={c.roadmapHeadline} bold={c.roadmapItalic} />
          <ol className="sv-road">
            {c.phases.map((phase, i) => (
              <li key={phase.title} className="sv-road__phase hm-rv">
                <span className="sv-road__node" aria-hidden="true">
                  {i + 1}
                </span>
                <span className="sv-tag">{phase.days}</span>
                <h3>{phase.title}</h3>
                <p>{phase.desc}</p>
              </li>
            ))}
          </ol>

          <div className="sv-split sv-check-wrap">
            <div>
              <h3>
                {c.checklistHeadline} <span className="b">{c.checklistItalic}</span>
              </h3>
              <p className="hm-lead">{c.checklistDesc}</p>
            </div>
            <ServiceChecklist
              items={c.checklistItems}
              title={c.triggerTitle}
              body={c.triggerBody}
              cta={c.triggerBtn}
              href={`/${locale}/agendar`}
            />
          </div>
        </div>
      </section>
    </ServicePage>
  )
}
