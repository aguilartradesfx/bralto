// Video del héroe de cada página de servicio (claves de Home.nav.groups). Están en Supabase
// Storage, bucket público "videos": 1440×1080 para escritorio, 960×720 para teléfonos y la
// portada en WebP (-p2: un cuadro con contenido, no el arranque oscuro). El sufijo -vN cambia cuando se reemplaza un video (se cachean un año).
export const VIDEO_BASE = 'https://pjwmfllnyauobityaile.supabase.co/storage/v1/object/public/videos/servicios'

const VIDEOS: Record<string, string> = {
  sitiosWeb: 'sitios-web-v1',
  produccionContenido: 'produccion-contenido-v1',
  campanas: 'campanas-v1',
  asesoria: 'asesoria-v1',
  automatizacion: 'automatizacion-v1',
  agentesIa: 'agentes-ia-v1',
  sistemasInternos: 'sistemas-internos-v1',
}

export type ServiceVideo = { src: string; srcMobile: string; poster: string }

export function serviceVideo(key: string): ServiceVideo | null {
  const name = VIDEOS[key]
  if (!name) return null
  return {
    src: `${VIDEO_BASE}/${name}.mp4`,
    srcMobile: `${VIDEO_BASE}/${name}-movil.mp4`,
    // Un cuadro con contenido (se muestra desenfocado hasta que aprietan play)
    poster: `${VIDEO_BASE}/${name}-p2.webp`,
  }
}
