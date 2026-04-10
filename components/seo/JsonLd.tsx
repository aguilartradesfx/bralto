export function OrganizationJsonLd() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Bralto',
    url: 'https://bralto.io',
    logo: 'https://bralto.io/logo.png',
    description:
      'Empresa de automatización e infraestructura digital para negocios en Latinoamérica y España. Servicio integral de CRM, IA, WhatsApp y más.',
    founder: {
      '@type': 'Person',
      name: 'Alejandro Aguilar',
    },
    foundingLocation: {
      '@type': 'Place',
      name: 'Costa Rica',
    },
    areaServed: [
      { '@type': 'Place', name: 'Latinoamérica' },
      { '@type': 'Place', name: 'España' },
      { '@type': 'Place', name: 'Costa Rica' },
      { '@type': 'Country', name: 'Estados Unidos' },
    ],
    serviceType: [
      'Automatización de negocios',
      'Marketing digital',
      'CRM',
      'Agentes de inteligencia artificial',
      'Desarrollo web',
      'Automatización de WhatsApp',
    ],
    sameAs: [],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'sales',
      availableLanguage: ['Spanish'],
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
      'Automatización e infraestructura digital para negocios en el mundo hispanohablante.',
    inLanguage: 'es',
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

export function LocalBusinessJsonLd() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    name: 'Bralto',
    url: 'https://bralto.io',
    description:
      'Agencia de automatización digital e infraestructura tecnológica para negocios. Especialistas en CRM, IA, WhatsApp Business y marketing digital en Costa Rica, Latinoamérica y España.',
    image: 'https://bralto.io/og-image.jpg',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'CR',
      addressRegion: 'Alajuela',
      addressLocality: 'Ciudad Quesada',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 10.3257,
      longitude: -84.4284,
    },
    areaServed: [
      { '@type': 'Country', name: 'Costa Rica' },
      { '@type': 'Country', name: 'México' },
      { '@type': 'Country', name: 'Colombia' },
      { '@type': 'Country', name: 'España' },
      { '@type': 'Country', name: 'Argentina' },
      { '@type': 'Country', name: 'Chile' },
      { '@type': 'Country', name: 'Perú' },
      { '@type': 'Country', name: 'Ecuador' },
      { '@type': 'Country', name: 'República Dominicana' },
      { '@type': 'Country', name: 'Guatemala' },
      { '@type': 'Country', name: 'Panamá' },
      { '@type': 'Country', name: 'Estados Unidos' },
    ],
    priceRange: '$$',
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      opens: '08:00',
      closes: '18:00',
    },
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Servicios Bralto',
      itemListElement: [
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Plataforma Bralto',
            description:
              'Plataforma todo-en-uno con CRM, automatización, pipeline de ventas, reportes y más.',
            offers: {
              '@type': 'Offer',
              price: '87',
              priceCurrency: 'USD',
              priceSpecification: {
                '@type': 'UnitPriceSpecification',
                price: '87',
                priceCurrency: 'USD',
                billingDuration: 'P1M',
              },
            },
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Servicio Integral Bralto',
            description:
              'Diagnóstico, diseño de solución, desarrollo web, agentes de IA, automatizaciones y entrega completa.',
            offers: {
              '@type': 'Offer',
              price: '849',
              priceCurrency: 'USD',
            },
          },
        },
      ],
    },
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
    areaServed: {
      '@type': 'Place',
      name: 'Latinoamérica y España',
    },
    availableChannel: {
      '@type': 'ServiceChannel',
      serviceUrl: 'https://bralto.io/agendar',
      serviceType: 'Consulta estratégica gratuita',
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
