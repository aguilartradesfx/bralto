// Una fila de redes_pruebas (supabase/migrations/20261106_011_redes_pruebas.sql): el grupo de las 5 versiones de
// prueba de un reel y lo que se va haciendo con él hasta elegir la ganadora.

export type EstadoPrueba = 'programada' | 'corriendo' | 'decidiendo' | 'decidida' | 'error' | 'cancelada'

// Lo que dio una versión en Instagram. skip: % que la pasó en los primeros 3 segundos; promedioMs: tiempo
// promedio que la vieron
export type Metricas = {
  views: number
  reach: number | null
  skip: number | null
  promedioMs: number | null
  shares: number
  saved: number
  leidas_en: string
}

// Lo que ya se hizo, paso por paso (las claves son el id de la fila de cada versión): un reintento no repite
export type ResultadoPrueba = {
  metricas?: Record<string, Metricas | 'sin_datos' | 'no_existe'>
  ganadora?: string | null
  borradas?: Record<string, 'ok' | string> // 'ok' o el error
  facebook?: { postId: string | null; url: string | null; automatizacion?: string; error?: string }
  aviso?: string // cuándo salió el aviso por Telegram
}

export type Prueba = {
  grupo: string
  titulo: string
  origen: 'ia' | 'propio'
  estado: EstadoPrueba
  facebook: boolean
  decidir_en: string | null
  ganadora: string | null
  resultado: ResultadoPrueba
  intentos: number
  actualizado_en: string
}
