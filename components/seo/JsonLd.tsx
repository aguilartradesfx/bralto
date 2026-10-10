import { toJsonLd } from '@/lib/json-ld'
import { SITE_URL } from '@/lib/seo'

export function OrganizationJsonLd() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Bralto',
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    description:
      'Custom automated systems for established businesses: website, CRM, AI agents, process automation, payments, and reporting, connected in one platform.',
    founder: {
      '@type': 'Person',
      name: 'Alejandro Aguilar',
    },
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'CR',
    },
    areaServed: [
      { '@type': 'Continent', name: 'North America' },
      { '@type': 'Continent', name: 'South America' },
      { '@type': 'Continent', name: 'Europe' },
    ],
    serviceType: [
      'Business Automation',
      'Digital Marketing',
      'CRM',
      'AI Agents',
      'Web Development',
      'Process Automation',
    ],
    sameAs: [],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'sales',
      availableLanguage: ['Spanish', 'English'],
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: toJsonLd(schema) }}
    />
  )
}

export function WebSiteJsonLd() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Bralto',
    url: SITE_URL,
    description:
      'Business automation and digital infrastructure for companies across the Americas and beyond.',
    inLanguage: ['es', 'en'],
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: toJsonLd(schema) }}
    />
  )
}

export function ServiceJsonLd({
  name,
  description,
  url,
}: {
  name: string
  description: string
  url: string
}) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name,
    description,
    url,
    provider: {
      '@type': 'Organization',
      name: 'Bralto',
      url: SITE_URL,
    },
    areaServed: [
      { '@type': 'Continent', name: 'North America' },
      { '@type': 'Continent', name: 'South America' },
      { '@type': 'Continent', name: 'Europe' },
    ],
    availableChannel: {
      '@type': 'ServiceChannel',
      serviceUrl: `${SITE_URL}/es/agendar`,
      serviceType: 'Diagnostic session',
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: toJsonLd(schema) }}
    />
  )
}

// Cada nota de /noticias: firmada por Alejandro y basada en la fuente que cita
export function NewsArticleJsonLd(props: {
  url: string
  headline: string
  description: string
  image: string
  datePublished: string
  dateModified: string
  inLanguage: 'es' | 'en'
  sourceUrl: string
}) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    mainEntityOfPage: props.url,
    headline: props.headline,
    description: props.description,
    image: [props.image],
    datePublished: props.datePublished,
    dateModified: props.dateModified,
    inLanguage: props.inLanguage,
    isBasedOn: props.sourceUrl,
    author: {
      '@type': 'Person',
      name: 'Alejandro Aguilar',
      jobTitle: 'CEO',
      url: `${SITE_URL}/${props.inLanguage}/sobre-nosotros`,
      worksFor: { '@type': 'Organization', name: 'Bralto', url: SITE_URL },
    },
    publisher: {
      '@type': 'Organization',
      name: 'Bralto',
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo.png` },
    },
  }

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toJsonLd(schema) }} />
}
