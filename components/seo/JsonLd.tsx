export function OrganizationJsonLd() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Bralto',
    url: 'https://bralto.io',
    logo: 'https://bralto.io/logo.png',
    description:
      'Business automation and digital infrastructure platform. Full-service CRM, AI agents, WhatsApp integrations, and custom systems for established companies across the Americas and beyond.',
    founder: {
      '@type': 'Person',
      name: 'Alejandro Aguilar',
    },
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'US',
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
      'WhatsApp Automation',
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
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

export function WebSiteJsonLd() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Bralto',
    url: 'https://bralto.io',
    description:
      'Business automation and digital infrastructure for companies across the Americas and beyond.',
    inLanguage: ['es', 'en'],
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
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
      url: 'https://bralto.io',
    },
    areaServed: [
      { '@type': 'Continent', name: 'North America' },
      { '@type': 'Continent', name: 'South America' },
      { '@type': 'Continent', name: 'Europe' },
    ],
    availableChannel: {
      '@type': 'ServiceChannel',
      serviceUrl: 'https://bralto.io/agendar',
      serviceType: 'Free strategy call',
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
