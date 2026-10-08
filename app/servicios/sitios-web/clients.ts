export interface ClientProject {
  id: string
  name: string
  industry: string
  tagline: string
  story: string
  deliverables: string[]
  coverImage: string
  images: string[]
  url?: string
  // Versión en inglés (home, /casos y la página de cada caso en /en)
  en?: { industry: string; tagline: string; story?: string; deliverables?: string[] }
}

export const clients: ClientProject[] = [
  {
    id: 'nanku',
    name: 'Nanku',
    en: {
      industry: 'Restaurant & reservations',
      tagline: 'A complete reservation platform, a 24/7 AI agent, and monthly video production.',
      story: "Nanku had a digital presence, but not the operation a restaurant of its caliber needs. We came in to restructure everything (a new website built from scratch, automated flows, and centralized customer service) so the business could run on its own without depending on the team for every detail. Today they receive reservations automatically, serve customers across multiple channels, and have new content every month.",
      deliverables: [
        "Website designed from scratch, mobile-first and SEO-optimized",
        "Reservation system built right into the site",
        "All-in-one platform to manage customers, orders, and communications",
        "Multichannel connection: WhatsApp, Instagram, Messenger, and the website from one place",
        "An AI agent specialized in the business that answers, guides, and closes reservations 24/7",
        "Monthly video production: videos, reels, and social media content",
        "Post-reservation follow-up automations and automatic reminders",
      ],
    },
    industry: 'Restaurante & Reservas',
    tagline: 'Plataforma completa de reservas, agente de IA 24/7 y producción audiovisual mensual.',
    url: 'https://www.restaurantenanku.net/',
    story: 'Nanku tenía presencia digital, pero no la operación que un restaurante de su nivel necesita. Llegamos a reestructurarlo todo (nuevo sitio construido desde cero, flujos automatizados y atención al cliente centralizada) para que el negocio funcionara solo sin depender del equipo para cada detalle. Hoy reciben reservas en automático, atienden por múltiples canales y tienen contenido nuevo cada mes.',
    deliverables: [
      'Sitio web diseñado desde cero, mobile-first y optimizado para SEO',
      'Sistema de reservas integrado directamente en el sitio',
      'Plataforma all-in-one para gestionar clientes, pedidos y comunicaciones',
      'Conexión multicanal: WhatsApp, Instagram, Messenger y página web desde un solo lugar',
      'Agente de IA especializado en el negocio que atiende, guía y cierra reservas 24/7',
      'Producción audiovisual mensual: videos, reels y contenido para redes sociales',
      'Automatizaciones de seguimiento post-reserva y recordatorios automáticos',
    ],
    coverImage: 'https://assets.cdn.filesafe.space/hdVpvshZP3RGJQbxx8GA/media/69d5723c6584e0c530f51dff.jpg',
    images: [
      'https://assets.cdn.filesafe.space/hdVpvshZP3RGJQbxx8GA/media/69d4b1a6a7dcb4cff00335af.png',
      'https://assets.cdn.filesafe.space/hdVpvshZP3RGJQbxx8GA/media/69d4b1a6c5a58912fbcef5fe.png',
      'https://assets.cdn.filesafe.space/hdVpvshZP3RGJQbxx8GA/media/69d4b1a684c045c274b6e799.png',
      'https://assets.cdn.filesafe.space/hdVpvshZP3RGJQbxx8GA/media/69d4b1a6b892c092ea71c73a.png',
      'https://assets.cdn.filesafe.space/hdVpvshZP3RGJQbxx8GA/media/69d4b1a6a7dcb4cff00335ae.png',
      'https://assets.cdn.filesafe.space/hdVpvshZP3RGJQbxx8GA/media/69d4b1a6d9088c065c3baa62.png',
      'https://assets.cdn.filesafe.space/hdVpvshZP3RGJQbxx8GA/media/69d4b1a6d9088c065c3baa63.png',
    ],
  },
  {
    id: 'ecoviva',
    name: 'Ecoviva',
    en: {
      industry: 'Real estate',
      tagline: 'A high-impact digital presence with an AI agent that advises visitors and books property tours in real time.',
      story: "Ecoviva came to us with a clear challenge: convey trust and professionalism in the real estate market without a digital presence that lived up to it. We built a site that communicates with strength and credibility, and backed it with artificial intelligence that works 7 days a week to turn visits into appointments.",
      deliverables: [
        "High-impact website with premium design and a focus on conversion",
        "AI agent with access to the full database of available properties",
        "Automated guidance for visitors: features, prices, locations, and availability",
        "In-person tour scheduling straight from the chat",
        "Automatic notifications to the internal team when a tour is booked",
        "Property catalog with downloadable spec sheets",
        "Integration with digital channels to centralize every inquiry",
      ],
    },
    industry: 'Inmobiliaria',
    tagline: 'Presencia digital de alto impacto con agente de IA que asesora y agenda visitas en tiempo real.',
    url: 'https://www.ecovivadesarrollos.com/',
    story: 'Ecoviva llegó con un desafío claro: transmitir confianza y profesionalismo en el mercado inmobiliario, sin una presencia digital que estuviera a la altura. Construimos un sitio que comunica con fuerza y credibilidad, y lo respaldamos con inteligencia artificial que trabaja los 7 días de la semana para convertir visitas en citas.',
    deliverables: [
      'Sitio web de alto impacto con diseño premium y enfoque en conversión',
      'Agente de IA con acceso a toda la base de propiedades disponibles',
      'Asesoría automatizada a visitantes: características, precios, ubicaciones y disponibilidad',
      'Sistema de agendamiento de visitas presenciales directo desde el chat',
      'Notificaciones automáticas al equipo interno cuando se agenda una visita',
      'Catálogo de propiedades con opción de descarga de fichas técnicas',
      'Integración con canales digitales para centralizar todas las consultas',
    ],
    coverImage: 'https://assets.cdn.filesafe.space/hdVpvshZP3RGJQbxx8GA/media/69d5723cf5ebf27de325201b.jpg',
    images: [
      'https://assets.cdn.filesafe.space/hdVpvshZP3RGJQbxx8GA/media/69d4b1b73d829c73b2948285.png',
      'https://assets.cdn.filesafe.space/hdVpvshZP3RGJQbxx8GA/media/69d4b1b7a7dcb4cff00336b4.png',
      'https://assets.cdn.filesafe.space/hdVpvshZP3RGJQbxx8GA/media/69d4b1b7fbeab4c06decff73.png',
      'https://assets.cdn.filesafe.space/hdVpvshZP3RGJQbxx8GA/media/69d4b1b784c045c274b6e89a.png',
      'https://assets.cdn.filesafe.space/hdVpvshZP3RGJQbxx8GA/media/69d4b1b7b892c092ea71c838.png',
      'https://assets.cdn.filesafe.space/hdVpvshZP3RGJQbxx8GA/media/69d4b1b78a63585a16a61691.png',
      'https://assets.cdn.filesafe.space/hdVpvshZP3RGJQbxx8GA/media/69d4b1b784c045c274b6e899.png',
    ],
  },
  {
    id: 'travelcore',
    name: 'TravelCore',
    en: {
      industry: 'Tourism & travel',
      tagline: 'A 4-in-1 portal with a tour booking engine, automated flows, and routes by client type.',
      story: "TravelCore wanted a platform that could handle both corporate and vacation clients, with real-time bookings and no manual management. We built a complete digital ecosystem that separates, routes, and serves each type of client differently, all automated under the hood.",
      deliverables: [
        "4-in-1 web portal with a landing page and three distinct paths: corporate, vacation, and bookings",
        "Tour booking engine with real-time availability",
        "100% automated corporate flow: every client lands exactly where they need to, without friction",
        "Vacation flow with direct booking or a scheduled call with the team",
        "Confirmation, reminder, and post-booking follow-up automations",
        "Integrations with communication and internal management tools",
        "Automatic record of every client, booked tour, and contact details",
      ],
    },
    industry: 'Turismo & Viajes',
    tagline: 'Portal 4 en 1 con motor de agenda para tours, flujos automatizados y rutas por tipo de cliente.',
    url: 'https://www.mytravelcore.com/',
    story: 'TravelCore quería una plataforma que pudiera manejar tanto clientes corporativos como vacacionales, con reservas en tiempo real y sin gestión manual. Construimos un ecosistema digital completo que separa, enruta y atiende a cada tipo de cliente de forma diferente, todo automatizado por debajo.',
    deliverables: [
      'Portal web 4 en 1 con página de entrada y tres rutas diferenciadas: corporativo, vacacional y reservas',
      'Motor de agenda para tours con disponibilidad en tiempo real',
      'Flujo corporativo 100% automatizado: cada cliente llega exactamente donde necesita sin fricción',
      'Flujo vacacional con opción de reserva directa o agendamiento de llamada con el equipo',
      'Automatizaciones de confirmación, recordatorios y seguimiento post-reserva',
      'Integraciones con herramientas de comunicación y gestión interna',
      'Registro automático de cada cliente, tour reservado y datos de contacto',
    ],
    coverImage: 'https://assets.cdn.filesafe.space/hdVpvshZP3RGJQbxx8GA/media/69d5723cbeaa70357710eec8.jpg',
    images: [
      'https://assets.cdn.filesafe.space/hdVpvshZP3RGJQbxx8GA/media/69d4b1d558216e2b1626ef81.png',
      'https://assets.cdn.filesafe.space/hdVpvshZP3RGJQbxx8GA/media/69d4b1d5a7dcb4cff003393e.png',
      'https://assets.cdn.filesafe.space/hdVpvshZP3RGJQbxx8GA/media/69d4b1d584c045c274b6eb6d.png',
      'https://assets.cdn.filesafe.space/hdVpvshZP3RGJQbxx8GA/media/69d4b1d558216e2b1626ef80.png',
      'https://assets.cdn.filesafe.space/hdVpvshZP3RGJQbxx8GA/media/69d4b1d5bec7abdef1301c5f.png',
      'https://assets.cdn.filesafe.space/hdVpvshZP3RGJQbxx8GA/media/69d4b1d5fbeab4c06ded022b.png',
      'https://assets.cdn.filesafe.space/hdVpvshZP3RGJQbxx8GA/media/69d4b1d5739146c47c8fa704.png',
    ],
  },
  {
    id: 'ao',
    name: 'AO Liquidation Warehouse',
    en: {
      industry: 'Wholesale',
      tagline: "Website and digital system for Costa Rica's leading liquidation distributor.",
      story: "AO Liquidation Warehouse is the official supplier of liquidation merchandise from U.S. retailers in Costa Rica: Amazon, Target, Walmart, and Home Depot. They had a physical presence and years of experience, but no digital platform that matched the operation. We built them an online presence that conveys authority and trust, and that consistently generates qualified B2B leads.",
      deliverables: [
        "Professional website with a design that conveys authority in the liquidation market",
        "Product and lot catalog organized by category (pallets, lots, containers)",
        "An \"About Us\" section that highlights 15+ years of experience and relationships with premium retailers",
        "Contact and quote request system that goes straight to the sales team",
        "Social media integration to capture leads from multiple channels",
        "Local SEO optimization for wholesale distributor searches in Costa Rica",
        "Structure built for B2B operations: language, value proposition, and CTAs for entrepreneurs and businesses",
      ],
    },
    industry: 'Comercio Mayorista',
    tagline: 'Sitio web y sistema digital para el principal distribuidor de liquidaciones de Costa Rica.',
    url: 'https://www.aoliquidationwarehouse.com/',
    story: 'AO Liquidation Warehouse es el proveedor oficial de mercancía de liquidación de retailers estadounidenses en Costa Rica: Amazon, Target, Walmart y Home Depot. Tenían presencia física y años de experiencia, pero no una plataforma digital que estuviera a la altura de la operación. Les construimos una presencia online que transmite autoridad y confianza, y que genera leads de clientes B2B calificados de forma constante.',
    deliverables: [
      'Sitio web profesional con diseño que comunica autoridad en el mercado de liquidaciones',
      'Catálogo de productos y lotes organizado por categorías (pallets, lotes, contenedores)',
      'Sección de "About Us" que posiciona los 15+ años de experiencia y la relación con retailers premium',
      'Sistema de contacto y solicitud de cotización directo al equipo de ventas',
      'Integración con redes sociales para captura de leads desde múltiples canales',
      'Optimización SEO local para búsquedas de distribuidores mayoristas en Costa Rica',
      'Estructura pensada para operaciones B2B: lenguaje, propuesta de valor y CTAs para emprendedores y empresas',
    ],
    coverImage: 'https://assets.cdn.filesafe.space/hdVpvshZP3RGJQbxx8GA/media/69d5723cebf1a608431006fb.jpg',
    images: [
      'https://assets.cdn.filesafe.space/hdVpvshZP3RGJQbxx8GA/media/69d5723cebf1a608431006fb.jpg',
      'https://assets.cdn.filesafe.space/hdVpvshZP3RGJQbxx8GA/media/69d5782ea7dcb4cff025ae06.png',
      'https://assets.cdn.filesafe.space/hdVpvshZP3RGJQbxx8GA/media/69d5782f200ae21bdf8235a5.png',
    ],
  },
]
