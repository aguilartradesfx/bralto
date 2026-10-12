// Video del héroe de cada página de servicio (claves de Home.nav.groups). Están en Supabase
// Storage, bucket público "videos": 1440×1080 para escritorio, 960×720 para teléfonos y la
// portada en WebP (-p2: un cuadro con contenido, no el arranque oscuro). El sufijo -vN cambia cuando se reemplaza un video (se cachean un año).
export const VIDEO_BASE = 'https://pjwmfllnyauobityaile.supabase.co/storage/v1/object/public/videos/servicios'

// Archivo y duración en segundos (medida con ffprobe sobre el archivo publicado)
const VIDEOS: Record<string, { name: string; seconds: number }> = {
  sitiosWeb: { name: 'sitios-web-v1', seconds: 51.4 },
  produccionContenido: { name: 'produccion-contenido-v1', seconds: 49.8 },
  campanas: { name: 'campanas-v1', seconds: 56.3 },
  asesoria: { name: 'asesoria-v1', seconds: 52.4 },
  automatizacion: { name: 'automatizacion-v1', seconds: 49 },
  agentesIa: { name: 'agentes-ia-v1', seconds: 50.6 },
  sistemasInternos: { name: 'sistemas-internos-v1', seconds: 48.1 },
}

export type ServiceVideo = { src: string; srcMobile: string; poster: string; duration: string }

export function serviceVideo(key: string): ServiceVideo | null {
  const video = VIDEOS[key]
  if (!video) return null
  const { name } = video
  const total = Math.round(video.seconds)
  return {
    src: `${VIDEO_BASE}/${name}.mp4`,
    srcMobile: `${VIDEO_BASE}/${name}-movil.mp4`,
    // Un cuadro con contenido (se muestra desenfocado hasta que aprietan play)
    poster: `${VIDEO_BASE}/${name}-p2.webp`,
    duration: `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`,
  }
}
