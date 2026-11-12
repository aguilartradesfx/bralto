// Una fila de redes_analisis (supabase/migrations/20261111_015_redes_analisis.sql): un reel con lo que predijo
// Higgsfield y lo que pasó de verdad en Instagram, más las lecciones que salen de compararlos.

// Higgsfield Virality Predictor sobre los primeros 15 s. Los puntajes van de 0 a 100. «gancho» mide los
// segundos 0 a 3; «atencion» y «divaga» son por segundo (0 a 1): divaga es la red por defecto del cerebro, la
// de cuando la mente se va a otra cosa (menos es mejor)
export type Prediccion = {
  general: number
  gancho: number
  cerebro: number
  viral: number
  sostiene: number
  atencion: number[]
  divaga: number[]
  job_id: string
  reporte_url: string | null
  analizado_en: string
}

// Instagram. salto: % que lo pasó en los primeros 3 segundos; promedio_s: segundos que lo vieron en promedio
export type Real = {
  vistas: number
  alcance: number | null
  salto: number | null
  promedio_s: number | null
  guardados: number | null
  me_gusta: number | null
  compartidos: number | null
  comentarios: number | null
  leido_en: string
  fuente: 'instagram' | 'prueba' // 'prueba': lo guardado al decidir, porque la versión ya se borró
}

// Lo que se ve al inicio, revisado cuadro por cuadro
export type Revision = {
  cuadro_cero?: string // qué se ve en el segundo 0
  algo_en_s?: number // cuándo aparece algo concreto (foto, mensaje, cifra)
  cara?: boolean // sale una cara (persona o Knox grande)
  texto_grande?: boolean // texto que se lee sin sonido en el primer segundo
  notas?: string
}

export type TipoAnalisis = 'normal' | 'prueba' | 'rehecho'

export type AnalisisFila = {
  id: string
  clave: string
  publicacion_id: string | null
  titulo: string
  tipo: TipoAnalisis
  rehecho_de: string | null
  grupo: string | null
  version: number | null
  gancho: string | null
  video_url: string | null
  primer_cuadro_url: string | null
  duracion_s: number | null
  prediccion: Prediccion | null
  real: Real | null
  revision: Revision | null
  publicado_en: string | null
  actualizado_en: string
}

export const COLUMNAS_ANALISIS =
  'id, clave, publicacion_id, titulo, tipo, rehecho_de, grupo, version, gancho, video_url, primer_cuadro_url, duracion_s, prediccion, real, revision, publicado_en, actualizado_en'

export type EstadoLeccion = 'probando' | 'confirmada' | 'descartada'

export type Leccion = {
  id: string
  regla: string
  por_que: string | null
  estado: EstadoLeccion
  evidencia: string[]
  actualizada_en: string
}

export const COLUMNAS_LECCION = 'id, regla, por_que, estado, evidencia, actualizada_en'
