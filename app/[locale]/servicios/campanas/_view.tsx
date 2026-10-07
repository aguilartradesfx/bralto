import { getTranslations } from 'next-intl/server'
import { vars, type Locale } from '@/components/home/primitives'
import { ServicePage, Showcase, type ServiceCopy } from '@/components/home/service'

// Reporte de ejemplo: cifras ilustrativas, rotuladas como tales en la página
const METRICS = ['4.2×', '234', '$1.80', '48.2k']
const BAR_VALS = [38, 54, 72, 91, 85, 100, 96, 100]
const AD_PLATFORMS = ['Meta Ads', 'Google Ads', 'Instagram']

type Copy = ServiceCopy & {
  metricsLabel: string
  metricsHeadline: string
  metricsItalic: string
  dash: { header: string; metricLabels: string[]; chartLabel: string; barLabels: string[] }
  adExamplesLabel: string
  adTypes: string[]
  adExamples: { headline: string; body: string; cta: string }[]
}

const CONTENT: Record<Locale, Copy> = {
  es: {
    badge: 'Campañas publicitarias',
    headline: 'Anuncios que',
    headlineBold: 'convierten.',
    sub: 'Gestionamos sus campañas en Meta y Google de principio a fin — desde la estrategia hasta la optimización diaria.',
    stats: [
      ['Meta + Google', 'Plataformas'],
      ['2×/semana', 'Optimización'],
      ['Semanal', 'Reporte'],
    ],
    metricsLabel: 'Reporte de ejemplo',
    metricsHeadline: 'Lo que ve cuando',
    metricsItalic: 'la campaña funciona.',
    dash: {
      header: 'Campaña activa — Mes 2',
      metricLabels: ['ROAS', 'Leads generados', 'CPC promedio', 'Alcance total'],
      chartLabel: 'Evolución de leads por semana',
      barLabels: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5', 'Sem 6', 'Sem 7', 'Sem 8'],
    },
    adExamplesLabel: 'Ejemplos de formatos',
    adTypes: ['Conversión', 'Búsqueda', 'Story'],
    adExamples: [
      { headline: '¿Cansado de perder clientes?', body: 'Automatizamos su negocio para que nunca más pierda un lead.', cta: 'Saber más →' },
      { headline: 'automatización negocios costa rica', body: 'Bralto • Automatizamos su operación completa\nSistemas IA, CRM y workflows a medida', cta: 'bralto.io ↗' },
      { headline: '12 horas semanales liberadas', body: 'Así trabaja un negocio automatizado. Vea cómo lo lograron.', cta: 'Ver caso real ↓' },
    ],
    features: [
      { t: 'Campañas en Meta Ads', d: 'Configuración, creativos, segmentación de audiencias y A/B testing. Gestionamos todo desde la cuenta de anuncios hasta la optimización continua.' },
      { t: 'Google Ads', d: 'Campañas de Search y Display con palabras clave seleccionadas, anuncios de texto y visuales. Capturamos demanda activa y generamos presencia de marca.' },
      { t: 'Creativos y copy para anuncios', d: 'Diseñamos las piezas visuales y escribimos el copy de cada anuncio. Nada se lanza sin estar optimizado para convertir.' },
      { t: 'Segmentación y audiencias', d: 'Definimos audiencias por comportamiento, intereses, ubicación y datos demográficos. También construimos audiencias similares desde su base de clientes.' },
      { t: 'Optimización continua', d: 'Revisamos el rendimiento mínimo dos veces por semana y ajustamos pujas, creativos y segmentaciones para maximizar el retorno.' },
      { t: 'Reportes de resultados', d: 'Reportes semanales con las métricas que importan: CPC, ROAS, leads generados, costo por conversión y evolución de la inversión.' },
    ],
    steps: [
      { t: 'Diagnóstico y estrategia', d: 'Analizamos su negocio, competencia y audiencia objetivo. Definimos los objetivos de campaña, el presupuesto inicial recomendado y la plataforma más efectiva para su caso.' },
      { t: 'Creación y lanzamiento', d: 'Producimos los creativos, configuramos el pixel/tags de seguimiento, estructuramos las campañas y las lanzamos con los primeros sets de anuncios.' },
      { t: 'Seguimiento y optimización', d: 'Monitoreamos el rendimiento diariamente, hacemos ajustes dos veces por semana y entregamos reporte semanal con los resultados y próximos pasos.' },
    ],
    faqs: [
      { q: '¿El presupuesto de pauta está incluido?', a: 'No. Bralto cobra un fee mensual de gestión y estrategia. El presupuesto de anuncios lo maneja usted directamente desde su cuenta de Meta o Google — así tiene control total sobre lo que gasta.' },
      { q: '¿Qué plataformas cubren?', a: 'Principalmente Meta (Facebook e Instagram) y Google (Search y Display). Para ciertos negocios también gestionamos TikTok Ads o LinkedIn Ads según donde esté la audiencia más relevante.' },
      { q: '¿Cuánto tiempo tarda en ver resultados?', a: 'Las primeras 2-3 semanas son de aprendizaje del algoritmo. Entre la semana 4 y 8 empezamos a ver los primeros resultados sólidos. Para resultados consistentes y escalables, lo ideal es evaluar con 3 meses de datos.' },
      { q: '¿Qué pasa si los resultados no son los esperados?', a: 'Ajustamos la estrategia con base en los datos. Revisamos creativos, audiencias y estructuras de campaña. Nuestro trabajo es optimizar continuamente — no hay garantía de ROAS específico porque depende de muchas variables del mercado, pero sí hay compromiso de mejora constante.' },
    ],
    ctaHeadline: 'Hablemos de',
    ctaBold: 'sus campañas.',
  },
  en: {
    badge: 'Paid Advertising',
    headline: 'Ads that',
    headlineBold: 'actually convert.',
    sub: 'We run your Meta and Google campaigns end to end — from strategy to daily optimization.',
    stats: [
      ['Meta + Google', 'Platforms'],
      ['2×/week', 'Optimization'],
      ['Weekly', 'Reporting'],
    ],
    metricsLabel: 'Sample report',
    metricsHeadline: 'What you see when',
    metricsItalic: 'the campaign works.',
    dash: {
      header: 'Active campaign — Month 2',
      metricLabels: ['ROAS', 'Leads generated', 'Avg CPC', 'Total reach'],
      chartLabel: 'Weekly lead growth',
      barLabels: ['Wk 1', 'Wk 2', 'Wk 3', 'Wk 4', 'Wk 5', 'Wk 6', 'Wk 7', 'Wk 8'],
    },
    adExamplesLabel: 'Ad format examples',
    adTypes: ['Conversion', 'Search', 'Story'],
    adExamples: [
      { headline: 'Tired of losing leads?', body: 'We automate your business so you never miss a lead again.', cta: 'Learn more →' },
      { headline: 'business automation services', body: 'Bralto • We automate your entire operation\nAI systems, CRM and custom workflows', cta: 'bralto.io ↗' },
      { headline: '12 hours freed up every week', body: 'This is how an automated business runs. See how they did it.', cta: 'See the story ↓' },
    ],
    features: [
      { t: 'Meta Ads campaigns', d: 'Setup, creatives, audience targeting, and A/B testing. We handle everything from the ad account to ongoing optimization.' },
      { t: 'Google Ads', d: 'Search and Display campaigns with curated keywords, text and visual ads. We capture active demand and build brand presence.' },
      { t: 'Ad creatives & copy', d: 'We design the visuals and write the copy for every ad. Nothing goes live without being optimized to convert.' },
      { t: 'Targeting & audiences', d: 'We define audiences by behavior, interests, location, and demographics. We also build lookalike audiences from your customer base.' },
      { t: 'Ongoing optimization', d: 'We review performance at least twice a week and adjust bids, creatives, and targeting to maximize your return.' },
      { t: 'Results reports', d: 'Weekly reports covering the metrics that matter: CPC, ROAS, leads generated, cost per conversion, and spend trends.' },
    ],
    steps: [
      { t: 'Diagnosis & strategy', d: 'We analyze your business, competitors, and target audience. We set campaign goals, a recommended starting budget, and the most effective platform for your case.' },
      { t: 'Creation & launch', d: 'We produce the creatives, set up tracking pixels and tags, build the campaign structure, and launch with the first set of ads.' },
      { t: 'Tracking & optimization', d: 'We monitor performance daily, make adjustments twice a week, and deliver a weekly report with results and next steps.' },
    ],
    faqs: [
      { q: 'Is ad spend included?', a: "No. Bralto charges a monthly management and strategy fee. You control the ad budget directly from your Meta or Google account — so you always know exactly what you're spending." },
      { q: 'Which platforms do you cover?', a: 'Mainly Meta (Facebook and Instagram) and Google (Search and Display). For certain businesses we also manage TikTok Ads or LinkedIn Ads depending on where the most relevant audience is.' },
      { q: 'How long before I see results?', a: 'The first 2–3 weeks are the algorithm learning phase. Between weeks 4 and 8 we start seeing solid early results. For consistent, scalable performance, 3 months of data is the ideal window to evaluate.' },
      { q: "What if results don't meet expectations?", a: "We adjust strategy based on the data — revisiting creatives, audiences, and campaign structure. Our job is to keep optimizing. There's no guarantee of a specific ROAS since it depends on many market variables, but there is a commitment to constant improvement." },
    ],
    ctaHeadline: "Let's talk about",
    ctaBold: 'your campaigns.',
  },
}

export default async function CampanasView({ locale }: { locale: Locale }) {
  const c = CONTENT[locale]
  const t = await getTranslations({ locale, namespace: 'Home.servicePage' })

  return (
    <ServicePage locale={locale} service="campanas" copy={c}>
      <Showcase id="sv-show-title" eyebrow={c.metricsLabel} light={c.metricsHeadline} bold={c.metricsItalic}>
        <div className="sv-dash hm-glass hm-glass--thick hm-rv">
          <div className="sv-dash__head">
            <p className="sv-dash__title">
              <span className="sv-live" aria-hidden="true" />
              {c.dash.header}
            </p>
            <p className="sv-tag">{t('illustrative')}</p>
          </div>
          <dl className="sv-dash__tiles">
            {METRICS.map((value, i) => (
              <div key={c.dash.metricLabels[i]} className="sv-tile">
                <dt>{c.dash.metricLabels[i]}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <figure className="sv-chart">
            <figcaption className="sv-tag">{c.dash.chartLabel}</figcaption>
            <ol className="sv-chart__bars" aria-hidden="true">
              {BAR_VALS.map((h, i) => (
                <li
                  key={c.dash.barLabels[i]}
                  className={i === BAR_VALS.length - 1 ? 'is-now' : undefined}
                  style={vars({ h: `${h}%`, i })}
                >
                  <span className="sv-chart__bar" />
                  <span className="sv-chart__label">{c.dash.barLabels[i]}</span>
                </li>
              ))}
            </ol>
          </figure>
        </div>

        <p className="sv-caption">{c.adExamplesLabel}</p>
        <ul className="sv-ads">
          {c.adExamples.map((ad, i) => (
            <li key={ad.headline} className="sv-ad hm-glass hm-rv">
              <p className="sv-tag">
                {AD_PLATFORMS[i]} · {c.adTypes[i]}
              </p>
              <p className="sv-ad__title">{ad.headline}</p>
              <p className="sv-ad__body">{ad.body}</p>
              <p className="sv-ad__cta">{ad.cta}</p>
            </li>
          ))}
        </ul>
      </Showcase>
    </ServicePage>
  )
}
