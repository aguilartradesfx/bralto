import type { Seccion } from '@/lib/recursos/lista'

// Los textos de /es/recursos (solo en español, como las guías). Tratan de «usted», como el resto del sitio.
export const RECURSOS = {
  eyebrow: 'Recursos',
  tituloLigero: 'Lo que publicamos,',
  tituloFuerte: 'para que lo use en su negocio',
  lead: 'Guías paso a paso, noticias de IA y archivos para descargar. Escoja qué quiere ver.',
  pestanas: 'Qué quiere ver',
  mas: 'Más recientes',
  anteriores: 'Anteriores',
  secciones: {
    guias: {
      nombre: 'Guías',
      bajada: 'El paso a paso de lo que enseñamos en Instagram.',
      vacio: 'Todavía no hay guías. La primera sale pronto.',
      meta: {
        titulo: 'Guías de IA para negocios, paso a paso',
        descripcion: 'Guías gratis para usar la inteligencia artificial en su negocio: herramientas, tutoriales y trucos, paso a paso.',
      },
    },
    noticias: {
      nombre: 'Noticias',
      bajada: 'Lo que pasa en IA y por qué le importa a su negocio.',
      vacio: 'Todavía no hay noticias. La primera sale pronto.',
      meta: {
        titulo: 'Noticias de IA para negocios',
        descripcion: 'Noticias de inteligencia artificial explicadas para negocios: qué pasó, por qué importa y cómo aprovecharlo.',
      },
    },
    descargables: {
      nombre: 'Descargables',
      bajada: 'Plantillas y archivos listos para usar en su negocio.',
      vacio: 'Los primeros descargables salen pronto. Mientras tanto, vea las guías.',
      meta: {
        titulo: 'Descargables para su negocio: plantillas y archivos',
        descripcion: 'Plantillas y archivos gratis para usar la inteligencia artificial en su negocio.',
      },
    },
  } satisfies Record<Seccion, unknown>,
  verGuias: 'Ver las guías',
} as const
