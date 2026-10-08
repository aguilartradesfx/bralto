import { cn } from '@/lib/utils'
import { SectionHead, type Locale } from '@/components/home/primitives'
import { ServicePage, type ServiceCopy } from '@/components/home/service'

// Calendario de ejemplo: un mes de 31 días que empieza en viernes (4 casillas vacías)
const POSTS: Record<number, string[]> = {
  1: ['IG'],
  5: ['TT'],
  8: ['IG', 'FB'],
  12: ['TT'],
  14: ['IG'],
  15: ['FB'],
  19: ['TT', 'IG'],
  22: ['IG'],
  26: ['TT'],
  28: ['FB'],
  29: ['IG'],
}
const CELLS: (number | null)[] = [...Array(4).fill(null), ...Array.from({ length: 31 }, (_, i) => i + 1)]

type Copy = ServiceCopy & {
  calHeadline: string
  calItalic: string
  calDesc: string
  weekdays: string[]
  monthLabel: string
  postsLabel: string
  calCaption: string
  platforms: { key: string; label: string; desc: string }[]
}

const CONTENT: Record<Locale, Copy> = {
  es: {
    badge: 'Producción de contenido',
    headline: 'Contenido que vende,',
    headlineBold: 'mes a mes.',
    sub: 'Producimos, editamos y publicamos contenido profesional para sus redes sociales, sin que tenga que preocuparse por nada.',
    stats: [
      ['6 a 12', 'Videos al mes'],
      ['Stories', 'Incluidas'],
      ['100%', 'Gestionado'],
    ],
    calHeadline: 'Siempre sabe',
    calItalic: 'qué se publica.',
    calDesc: 'Cada mes recibe el calendario completo con los posts programados por plataforma. Usted aprueba antes de publicar. Sin sorpresas, sin improvisación de último minuto.',
    weekdays: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
    monthLabel: 'Calendario de ejemplo',
    postsLabel: '11 posts planificados',
    calCaption: 'Calendario de ejemplo con 11 publicaciones repartidas en el mes entre Instagram, TikTok y Facebook.',
    platforms: [
      { key: 'IG', label: 'Instagram', desc: 'Reels, carruseles y stories' },
      { key: 'TT', label: 'TikTok', desc: 'Videos cortos con tendencias' },
      { key: 'FB', label: 'Facebook', desc: 'Posts, videos y alcance orgánico' },
    ],
    features: [
      { t: 'Videos cortos y Reels', d: 'Producción y edición de contenido vertical optimizado para Instagram, TikTok y Facebook. Entregamos listos para publicar.' },
      { t: 'Stories y contenido diario', d: 'Diseño y producción de stories que mantienen presencia activa y llevan tráfico a su perfil y sitio web.' },
      { t: 'Estrategia editorial', d: 'Definimos pilares de contenido, tono de voz y objetivos de marca. Todo lo que publicamos tiene un propósito claro.' },
      { t: 'Calendario de contenido', d: 'Planificación mensual anticipada para que siempre sepa qué se publica, cuándo y por qué. Sin improvisación.' },
      { t: 'Gestión y publicación', d: 'Publicamos en su nombre según el calendario acordado. Usted solo aprueba las piezas antes de que salgan.' },
      { t: 'Reporte mensual de resultados', d: 'Revisión de métricas clave: alcance, engagement, crecimiento de cuenta y ajustes para el siguiente mes.' },
    ],
    steps: [
      { t: 'Sesión de estrategia', d: 'Hacemos un briefing de marca, analizamos su cuenta y la competencia, y definimos los pilares de contenido, tono de voz y objetivos del primer mes.' },
      { t: 'Producción mensual', d: 'Grabamos y/o editamos las piezas del mes según el plan. Cada pieza pasa por revisión antes de ser publicada.' },
      { t: 'Publicación y optimización', d: 'Publicamos según el calendario, monitoreamos el rendimiento y ajustamos la estrategia del mes siguiente con base en los datos.' },
    ],
    faqs: [
      { q: '¿Ustedes graban o solo editan?', a: 'Depende del plan y la ubicación. En la mayoría de los casos trabajamos con material que el cliente graba o nos envía. Para clientes en zona de cobertura, la producción en sitio se puede incluir o cotizar aparte.' },
      { q: '¿El servicio incluye la gestión de redes?', a: 'Sí. Publicamos en su nombre según el calendario aprobado. Usted solo revisa y aprueba las piezas antes de que salgan. El resto lo manejamos nosotros.' },
      { q: '¿Qué plataformas cubren?', a: 'Instagram, TikTok, Facebook y YouTube Shorts. La estrategia se adapta según dónde está su audiencia y cuáles plataformas generan más resultado para su tipo de negocio.' },
      { q: '¿Puedo cambiar de plan?', a: 'Sí, con 15 días de anticipación antes del siguiente ciclo mensual. Sin penalidades.' },
    ],
    ctaHeadline: 'Hablemos de',
    ctaBold: 'su contenido.',
  },
  en: {
    badge: 'Content production',
    headline: 'Content that sells,',
    headlineBold: 'every month.',
    sub: "We produce, edit, and publish professional content for your social media, so you don't have to worry about a thing.",
    stats: [
      ['6 to 12', 'Videos per month'],
      ['Stories', 'Included'],
      ['100%', 'Managed'],
    ],
    calHeadline: 'You always know',
    calItalic: "what's going live.",
    calDesc: 'Every month you get the full content calendar with posts scheduled by platform. You approve before anything goes live. No surprises, no last-minute scrambling.',
    weekdays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    monthLabel: 'Sample calendar',
    postsLabel: '11 posts scheduled',
    calCaption: 'Sample calendar with 11 posts spread across the month on Instagram, TikTok, and Facebook.',
    platforms: [
      { key: 'IG', label: 'Instagram', desc: 'Reels, carousels and stories' },
      { key: 'TT', label: 'TikTok', desc: 'Short videos with trending sounds' },
      { key: 'FB', label: 'Facebook', desc: 'Posts, videos and organic reach' },
    ],
    features: [
      { t: 'Short videos & Reels', d: 'Production and editing of vertical content optimized for Instagram, TikTok, and Facebook. Delivered ready to post.' },
      { t: 'Stories & daily content', d: 'Design and production of stories that keep your brand top of mind and drive traffic to your profile and website.' },
      { t: 'Editorial strategy', d: 'We define content pillars, brand voice, and objectives. Everything we publish has a clear purpose.' },
      { t: 'Content calendar', d: 'Monthly planning done in advance so you always know what goes live, when, and why. No improvising.' },
      { t: 'Management & publishing', d: 'We publish on your behalf according to the agreed calendar. You just approve the pieces before they go out.' },
      { t: 'Monthly results report', d: 'Review of key metrics: reach, engagement, account growth, and adjustments for the following month.' },
    ],
    steps: [
      { t: 'Strategy session', d: 'We run a brand briefing, analyze your account and competitors, and define content pillars, brand voice, and goals for the first month.' },
      { t: 'Monthly production', d: "We shoot and/or edit the month's content according to the plan. Every piece goes through a review before publishing." },
      { t: 'Publishing & optimization', d: "We publish on schedule, monitor performance, and adjust next month's strategy based on the data." },
    ],
    faqs: [
      { q: 'Do you film or just edit?', a: 'It depends on the plan and location. In most cases we work with footage the client films or sends us. For clients in our coverage area, on-site production can be included or quoted separately.' },
      { q: 'Does the service include social media management?', a: 'Yes. We publish on your behalf according to the approved calendar. You just review and approve the pieces before they go live. We handle everything else.' },
      { q: 'Which platforms do you cover?', a: 'Instagram, TikTok, Facebook, and YouTube Shorts. The strategy adapts based on where your audience is and which platforms drive the most results for your type of business.' },
      { q: 'Can I change plans?', a: 'Yes, with 15 days notice before the next monthly cycle. No penalties.' },
    ],
    ctaHeadline: "Let's talk about",
    ctaBold: 'your content.',
  },
}

export default function ProduccionContenidoView({ locale }: { locale: Locale }) {
  const c = CONTENT[locale]

  return (
    <ServicePage locale={locale} service="produccionContenido" copy={c}>
      <section className="hm-section" aria-labelledby="sv-cal-title">
        <div className="hm-wrap sv-split">
          <div>
            <SectionHead id="sv-cal-title" light={c.calHeadline} bold={c.calItalic} />
            <p className="hm-lead">{c.calDesc}</p>
            <ul className="sv-platforms">
              {c.platforms.map((p) => (
                <li key={p.key}>
                  <span className="sv-pf" aria-hidden="true">
                    {p.key}
                  </span>
                  <b>{p.label}</b>
                  <span>{p.desc}</span>
                </li>
              ))}
            </ul>
          </div>

          <figure className="sv-cal hm-glass hm-glass--thick hm-rv">
            <figcaption className="sr-only">{c.calCaption}</figcaption>
            <div className="sv-cal__head" aria-hidden="true">
              <span>{c.monthLabel}</span>
              <span className="sv-tag">{c.postsLabel}</span>
            </div>
            <div className="sv-cal__grid" aria-hidden="true">
              {c.weekdays.map((d) => (
                <span key={d} className="sv-cal__wd">
                  {d}
                </span>
              ))}
              {CELLS.map((day, idx) => {
                const posts = day ? POSTS[day] : undefined
                return (
                  <span key={idx} className={cn('sv-cal__day', posts && 'has-post')}>
                    {day && <b>{day}</b>}
                    {posts && (
                      <span className="sv-cal__pf">
                        {posts.map((p) => (
                          <i key={p}>{p}</i>
                        ))}
                      </span>
                    )}
                  </span>
                )
              })}
            </div>
            <p className="sv-cal__legend" aria-hidden="true">
              {c.platforms.map((p) => (
                <span key={p.key}>
                  <span className="sv-pf">{p.key}</span>
                  {p.label}
                </span>
              ))}
            </p>
          </figure>
        </div>
      </section>
    </ServicePage>
  )
}
