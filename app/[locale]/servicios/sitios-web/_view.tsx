import { getTranslations } from 'next-intl/server'
import { clients } from '@/app/servicios/sitios-web/clients'
import { CaseRow } from '@/components/home/case-row'
import { Check } from '@/components/home/icons'
import { SectionHead, vars, type Locale } from '@/components/home/primitives'
import { ServicePage, type ServiceCopy } from '@/components/home/service'

const SCORES = [100, 98, 100]

type Copy = ServiceCopy & {
  projectsLabel: string
  projectsHeadline: string
  projectsItalic: string
  projectsDesc: string
  lighthouseLabel: string
  lighthouseHeadline: string
  lighthouseItalic: string
  lighthouseDesc: string
  lighthouseStats: { v: string; l: string }[]
  scoreLabels: string[]
  auditUrl: string
  auditLabel: string
  passText: string
}

const CONTENT: Record<Locale, Copy> = {
  es: {
    badge: 'Sitios web profesionales',
    headline: 'Su mejor vendedor,',
    headlineBold: 'online 24/7.',
    sub: 'Diseño a medida, SEO incluido y entrega en tiempo récord — para que su presencia online trabaje mientras usted descansa.',
    stats: [
      ['4+', 'Proyectos entregados'],
      ['SEO', 'Incluido'],
      ['≤10 días', 'Tiempo de entrega'],
    ],
    projectsLabel: 'Proyectos realizados',
    projectsHeadline: 'El trabajo',
    projectsItalic: 'habla solo.',
    projectsDesc: 'Haga clic en cualquier proyecto para ver la historia completa y la galería de imágenes.',
    lighthouseLabel: 'Rendimiento que se mide',
    lighthouseHeadline: 'Sitios que',
    lighthouseItalic: 'cargan rápido.',
    lighthouseDesc: 'Google prioriza los sitios veloces. Cada décima de segundo que su sitio tarda en cargar es tráfico que pierde. Entregamos sitios con Lighthouse 100 en rendimiento — medible, verificable, sin excusas.',
    lighthouseStats: [
      { v: '< 1s', l: 'Tiempo hasta interactivo' },
      { v: '100', l: 'Rendimiento' },
      { v: '98+', l: 'Puntaje SEO' },
    ],
    scoreLabels: ['Rendimiento', 'SEO', 'Prácticas recomendadas'],
    auditUrl: 'suempresa.com',
    auditLabel: 'Auditoría Lighthouse — suempresa.com',
    passText: 'Cumple los estándares de Google',
    features: [
      { t: 'Diseño a medida', d: 'Interfaz construida sobre su identidad de marca — nunca plantillas genéricas.' },
      { t: 'Hasta 8 páginas', d: 'Inicio, servicios, nosotros, contacto y más. Cada página pensada para convertir.' },
      { t: 'SEO técnico', d: 'Estructura semántica, velocidad, meta tags y sitemap para posicionar desde el día uno.' },
      { t: 'Captura de leads', d: 'Formularios directos a su correo, WhatsApp o CRM sin fricciones.' },
      { t: 'Integraciones', d: 'Conectamos con las herramientas que ya usa sin procesos intermedios.' },
      { t: 'Entrega rápida', d: 'La mayoría de proyectos listos en 5–10 días hábiles desde el briefing.' },
    ],
    steps: [
      { t: 'Diagnóstico', d: 'Entendemos su negocio, objetivos y mensaje. Definimos estructura y tono.' },
      { t: 'Construcción', d: 'Diseño + desarrollo + SEO + integraciones. Avances en tiempo real.' },
      { t: 'Entrega', d: 'Sitio funcionando. Correcciones incluidas hasta que esté conforme al 100%.' },
    ],
    faqs: [
      { q: '¿Hosting y dominio incluidos?', a: 'No. El sitio se entrega listo para publicar donde prefiera. Lo asesoramos sin costo adicional.' },
      { q: '¿Cuánto tarda la entrega?', a: '5 a 10 días hábiles según complejidad y velocidad de entrega del material de su parte.' },
      { q: '¿Puedo pedir cambios después?', a: 'Una ronda de correcciones incluida post-entrega. Cambios adicionales se cotizan por separado.' },
      { q: '¿Ya tengo sitio, solo quiero mejorarlo?', a: 'Hacemos una auditoría y le proponemos mejoras. Lo cotizamos según el alcance.' },
    ],
    ctaHeadline: 'Hablemos',
    ctaBold: 'de su proyecto.',
  },
  en: {
    badge: 'Professional websites',
    headline: 'Your best salesperson,',
    headlineBold: 'online 24/7.',
    sub: 'Custom design, SEO included, and delivered fast — so your online presence works while you sleep.',
    stats: [
      ['4+', 'Projects delivered'],
      ['SEO', 'Included'],
      ['≤10 days', 'Delivery time'],
    ],
    projectsLabel: "Work we've done",
    projectsHeadline: 'The work',
    projectsItalic: 'speaks for itself.',
    projectsDesc: 'Click any project to see the full story and image gallery.',
    lighthouseLabel: 'Performance you can measure',
    lighthouseHeadline: 'Sites that',
    lighthouseItalic: 'load fast.',
    lighthouseDesc: 'Google prioritizes fast sites. Every tenth of a second you take to load is traffic you lose. We deliver sites with Lighthouse 100 on Performance — measurable, verifiable, no excuses.',
    lighthouseStats: [
      { v: '< 1s', l: 'Time to interactive' },
      { v: '100', l: 'Performance' },
      { v: '98+', l: 'SEO score' },
    ],
    scoreLabels: ['Performance', 'SEO', 'Best Practices'],
    auditUrl: 'yourcompany.com',
    auditLabel: 'Lighthouse audit — yourcompany.com',
    passText: 'All criteria meet Google standards',
    features: [
      { t: 'Custom design', d: 'Interface built on your brand identity — never generic templates.' },
      { t: 'Up to 8 pages', d: 'Home, services, about, contact, and more. Every page designed to convert.' },
      { t: 'Technical SEO', d: 'Semantic structure, speed, meta tags, and sitemap so you rank from day one.' },
      { t: 'Lead capture', d: 'Forms that go straight to your email, WhatsApp, or CRM without friction.' },
      { t: 'Integrations', d: 'We connect with the tools you already use without extra steps in between.' },
      { t: 'Fast delivery', d: 'Most projects ready in 5–10 business days from the briefing.' },
    ],
    steps: [
      { t: 'Discovery', d: 'We understand your business, goals, and message. We define structure and tone.' },
      { t: 'Build', d: 'Design + development + SEO + integrations. Real-time progress updates.' },
      { t: 'Delivery', d: "Live site. Revisions included until you're 100% happy." },
    ],
    faqs: [
      { q: 'Are hosting and domain included?', a: 'No. The site is delivered ready to deploy wherever you prefer. We advise at no extra cost.' },
      { q: 'How long does delivery take?', a: '5 to 10 business days depending on complexity and how quickly you provide materials.' },
      { q: 'Can I request changes after delivery?', a: 'One round of revisions included post-delivery. Additional changes are quoted separately.' },
      { q: 'I already have a site, I just want to improve it.', a: 'We run an audit and propose improvements. We quote it based on the scope.' },
    ],
    ctaHeadline: "Let's talk about",
    ctaBold: 'your project.',
  },
}

export default async function SitiosWebView({ locale }: { locale: Locale }) {
  const c = CONTENT[locale]
  const t = await getTranslations({ locale, namespace: 'Home.cases' })

  return (
    <ServicePage locale={locale} service="sitiosWeb" copy={c}>
      <section className="hm-section" aria-labelledby="sv-work-title">
        <div className="hm-wrap">
          <div className="hm-cases__head">
            <SectionHead id="sv-work-title" eyebrow={c.projectsLabel} light={c.projectsHeadline} bold={c.projectsItalic} />
            <p className="hm-lead sv-aside">{c.projectsDesc}</p>
          </div>
          <ul className="hm-cases">
            {clients.map((client) => (
              <li key={client.id}>
                <CaseRow client={client} locale={locale} viewLabel={t('view')} />
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="hm-section" aria-labelledby="sv-lh-title">
        <div className="hm-wrap sv-split">
          <div>
            <SectionHead id="sv-lh-title" eyebrow={c.lighthouseLabel} light={c.lighthouseHeadline} bold={c.lighthouseItalic} />
            <p className="hm-lead">{c.lighthouseDesc}</p>
            <dl className="sv-minis">
              {c.lighthouseStats.map((s) => (
                <div key={s.l}>
                  <dt>{s.l}</dt>
                  <dd>{s.v}</dd>
                </div>
              ))}
            </dl>
          </div>

          <figure className="sv-browser hm-glass hm-glass--thick hm-rv">
            <div className="sv-browser__bar">
              <span className="sv-dots" aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
              <span className="sv-browser__url">{c.auditUrl}</span>
            </div>
            <figcaption className="sv-tag">{c.auditLabel}</figcaption>
            <ul className="sv-rings">
              {SCORES.map((score, i) => (
                <li key={c.scoreLabels[i]}>
                  <div className="sv-ring" style={vars({ v: score })}>
                    <svg viewBox="0 0 100 100" aria-hidden="true">
                      <circle className="sv-ring__track" cx="50" cy="50" r="40" />
                      <circle className="sv-ring__fill" cx="50" cy="50" r="40" pathLength={100} />
                    </svg>
                    <span className="sv-ring__value">{score}</span>
                  </div>
                  <span className="sv-ring__label">{c.scoreLabels[i]}</span>
                </li>
              ))}
            </ul>
            <p className="sv-pass">
              <Check />
              {c.passText}
            </p>
          </figure>
        </div>
      </section>
    </ServicePage>
  )
}
