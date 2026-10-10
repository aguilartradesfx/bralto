export type NewsLocale = 'es' | 'en'
export type NewsStatus = 'publicada' | 'oculta'
export type NewsAction = 'ver' | 'publicar' | 'ocultar'

// Lo que escribe Gemini en un idioma
export type NewsDraft = {
  titulo: string
  resumen: string
  cuerpo: string
  imagen_alt: string
}

// La fuente de la nota; fuente_texto solo sirve para revisar que nada esté copiado
export type SourceContext = {
  fuente_url: string
  fuente_nombre: string
  fuente_texto: string
}

export type NewsRow = {
  id: string
  slug: string
  titulo_es: string
  resumen_es: string
  cuerpo_es: string
  imagen_alt_es: string
  titulo_en: string
  resumen_en: string
  cuerpo_en: string
  imagen_alt_en: string
  fuente_url: string
  fuente_nombre: string
  imagen_url: string
  publicada_en: string
  estado: NewsStatus
  actualizada_en: string
}
