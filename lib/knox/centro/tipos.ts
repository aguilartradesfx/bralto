// El Centro de mando de Knox (/knox): lo que el servidor junta para la pantalla completa. Cada parte viene de una
// fuente; si esa fuente no respondió, la parte llega en null y la pantalla muestra «—».
import type { CanalKnox, ModoKnox } from '../conversar/tipos.ts'

export type CanalCliente = 'Instagram' | 'WhatsApp' | 'Messenger' | 'Sitio web'

// Grados (0 arriba, en el sentido del reloj) y distancia al centro (0 a 1)
export type PuntoRadar = { angulo: number; radio: number }

export type Clientes = {
  hoy: number
  ayer: number
  porCanal: { canal: CanalCliente; total: number }[] // los 3 con más, de mayor a menor
  puntos: PuntoRadar[] // uno por persona de hoy; el último es el más nuevo
}

export type Insignia = 'QUIERE LLAMADA' | 'LEAD'

export type Esperandote = {
  id: string // la conversación
  nombre: string
  iniciales: string
  canal: CanalKnox
  insignia: Insignia | null
  texto: string
  en: string | null // el último mensaje
}

export type Esperando = {
  total: number
  conversaciones: Esperandote[] // las 3 más nuevas
  borradores: string[] // las respuestas de Knox listas para mandar (ids de crm_knox_decisiones)
}

export type Embudo = { llegaron: number; conversando: number; propuesta: number; ganados: number }

export type Instagram = {
  usuario: string
  seguidores: number
  semana: number | null // seguidores nuevos de los últimos 7 días
  serie: number[] | null // seguidores de cada día, el último es hoy
  desde: string | null // el día del primer punto de la serie (AAAA-MM-DD)
  vistas: number | null // de los últimos 30 días
  guardados: number | null
  compartidos: number | null
}

export type TipoPost = 'reel' | 'carrusel' | 'foto'

export type PostIg = {
  titulo: string
  tipo: TipoPost
  en: string
  imagen: string | null
  enlace: string | null
  vistas: number | null
  alcance: number | null
}

export type Mejor = {
  titulo: string
  tipo: TipoPost
  en: string
  imagen: string | null
  enlace: string | null
  vistas: number
  alcance: number | null
  promedioOtros: number | null // alcance promedio de los otros posts de esos días
  otros: number // cuántos posts más hubo esos días
  veces: number | null // cuántas veces más lejos llegó que los demás
  dias: 7 | 30
}

export type ItemDia = {
  tipo: 'cita' | 'post' | 'tarea'
  en: string
  titulo: string
  detalle: string | null
  hecho: boolean // el post ya salió o la tarea está hecha (las citas se ven por la hora)
  fallo: boolean // el post no salió
}

export type Dia = { items: ItemDia[]; faltan: string[] } // faltan: lo que no se pudo leer ('citas', 'posts', 'tareas')

export type MarcaPulso = { tipo: 'post' | 'cita' | 'propuesta'; en: string; etiqueta: string }

export type Pulso = {
  hoy: number[] // mensajes y personas nuevas de hoy, por tramo de 30 min de 6:00 a 23:00
  habitual: number[] // lo mismo, en promedio de los 7 días anteriores (la parte punteada)
  clientes: string[] // cuándo llegó cada persona nueva de hoy
  marcas: MarcaPulso[]
}

// conectado · caido (no respondió) · por-conectar · null (no se pudo revisar)
export type Conexion = 'conectado' | 'caido' | 'por-conectar' | null

export type Conexiones = { instagram: Conexion; whatsapp: Conexion; sitio: Conexion; correo: Conexion }

export type Centro = {
  generadoEn: string
  temperatura: number | null
  dolar: number | null // la venta
  clientes: Clientes | null
  esperando: Esperando | null
  embudo: Embudo | null
  instagram: Instagram | null
  mejor: Mejor | false | null // false: no hubo posts en 30 días
  dia: Dia | null
  pulso: Pulso | null
  conexiones: Conexiones
  modo: ModoKnox | null
}
