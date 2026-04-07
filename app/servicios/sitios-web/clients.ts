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
}

export const clients: ClientProject[] = [
  {
    id: 'nanku',
    name: 'Nanku',
    industry: 'Restaurante & Reservas',
    tagline: 'Plataforma completa de reservas, agente de IA 24/7 y producción audiovisual mensual.',
    url: 'https://www.restaurantenanku.net/',
    story: 'Nanku tenía presencia digital, pero no la operación que un restaurante de su nivel necesita. Llegamos a reestructurarlo todo — nuevo sitio construido desde cero, flujos automatizados y atención al cliente centralizada — para que el negocio funcionara solo sin depender del equipo para cada detalle. Hoy reciben reservas en automático, atienden por múltiples canales y tienen contenido nuevo cada mes.',
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
    industry: 'Turismo & Viajes',
    tagline: 'Portal 4 en 1 con motor de agenda para tours, flujos automatizados y rutas por tipo de cliente.',
    url: 'https://www.mytravelcore.com/',
    story: 'TravelCore quería una plataforma que pudiera manejar tanto clientes corporativos como vacacionales, con reservas en tiempo real y sin gestión manual. Construimos un ecosistema digital completo que separa, enruta y atiende a cada tipo de cliente de forma diferente — todo automatizado por debajo.',
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
    industry: 'Comercio Mayorista',
    tagline: 'Sitio web y sistema digital para el principal distribuidor de liquidaciones de Costa Rica.',
    url: 'https://www.aoliquidationwarehouse.com/',
    story: 'AO Liquidation Warehouse es el proveedor oficial de mercancía de liquidación de retailers estadounidenses en Costa Rica — Amazon, Target, Walmart, Home Depot. Tenían presencia física y años de experiencia, pero no una plataforma digital que estuviera a la altura de la operación. Les construimos una presencia online que transmite autoridad y confianza, y que genera leads de clientes B2B calificados de forma constante.',
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
