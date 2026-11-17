// «Guiones»: el guion que la tarea de la noche escribe para que Alejandro lo grabe a cámara (uno por tema del día) y
// los videos que él sube desde el teléfono. Sin dependencias: lo cargan el panel y el comando de la noche
// (scripts/guiones/cargar.ts), que corre con Node directo. Por eso los imports de lib/guiones son relativos con .ts.

// usted = solo él a pantalla completa; mitad = él abajo y motion arriba; motion = él no sale, se oye su voz
export type Vista = 'usted' | 'mitad' | 'motion'
export const VISTAS: Vista[] = ['usted', 'mitad', 'motion']

export type Linea = { vista: Vista; dice: string; pantalla: string }
export type Gancho = { tipo: string; dice: string }

// Lo que trae publicaciones/<AAAA-MM-DD>/guion/guion.json, ya revisado (esquema.ts)
export type Guion = {
  titulo: string
  tema: string
  comenta: string | null // la palabra del «Comenta», en mayúsculas
  guia: string | null // el slug de la guía
  duracion_s: number | null
  lineas: Linea[]
  ganchos: Gancho[]
}

// listo → subido → editando → programado, más error y descartado
export type EstadoGuion = 'listo' | 'subido' | 'editando' | 'programado' | 'error' | 'descartado'
export const ESTADOS: EstadoGuion[] = ['listo', 'subido', 'editando', 'programado', 'error', 'descartado']

// Un video en el bucket privado «crudos»: `ruta` es la de adentro del bucket (<id>/<único>-<nombre limpio>)
export type VideoGuion = { ruta: string; nombre: string; bytes: number; subido_en: string }

// Una fila de redes_guiones (supabase/migrations/20261116_018_guiones.sql)
export type GuionFila = Guion & {
  id: string
  dia: string // el día del tema, AAAA-MM-DD
  estado: EstadoGuion
  videos: VideoGuion[]
  carpeta: string | null // la carpeta del guion en el servidor
  detalle: string | null // por qué falló, o una nota
  grabado_en: string | null
  subido_en: string | null // cuándo llegó el último video
  editado_en: string | null
  creado_en: string
  actualizado_en: string
}

export const TABLA_GUIONES = 'redes_guiones'
export const BUCKET_CRUDOS = 'crudos'
export const COLUMNAS_GUION =
  'id, dia, titulo, tema, comenta, guia, duracion_s, lineas, ganchos, estado, videos, carpeta, detalle, grabado_en, subido_en, editado_en, creado_en, actualizado_en'

// Cada gancho se graba aparte y da una versión de prueba
export const GANCHOS_POR_GUION = 5
