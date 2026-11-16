// Tipos compartidos de la Oficina de Knox (catálogo, marcas, estado y la foto que ve la página).

export type Aspecto = {
  tela: string
  ropa: string
  pantalon?: string
  orejas?: string
  cabeza?: string
  gorro?: string
  extra?: string
  glifo: string
}

export type Agente = {
  id: string
  nombre: string
  oficio: string
  area: string
  puesto: number
  aspecto: Aspecto
  personalidad: string
  frase: string
  horario: string | null
  cada_minutos: number | null
  ruta: string | null
  donde: 'servidor' | 'sitio' | 'zernio' | 'asistente' | 'mano'
  estado_fijo: 'pendiente' | 'pedido' | null
  despierto_siempre: boolean
  dura_min: number
  ultima_revision: string | null
}

export type TipoMarca = 'empieza' | 'termina' | 'falla' | 'pasa' | 'entrega' | 'publica' | 'saltada'

export type Marca = {
  id: string
  agente: string
  tipo: TipoMarca
  para: string | null
  texto: string
  enlace: string | null
  ref_tabla: string | null
  ref_id: string | null
  dura_seg: number | null
  extra: Record<string, unknown> | null
  visto_en: string | null
  creado_en: string
}

export type NuevaMarca = {
  agente: string
  tipo: TipoMarca
  para?: string | null
  texto: string
  enlace?: string | null
  ref_tabla?: string | null
  ref_id?: string | null
  dura_seg?: number | null
  extra?: Record<string, unknown> | null
}

export type EstadoOficina = {
  dormida: boolean
  desde: string | null
  por: string | null
}

export type EstadoAgente =
  | 'trabajando'
  | 'publicando'
  | 'listo'
  | 'fallo'
  | 'descansando'
  | 'pedido'
  | 'pendiente'
  | 'a-medias'
  | 'durmiendo'

export type Numeros = {
  tareas: number
  horas: number
  diasSinFallar: number
}

export type Proximo = {
  cuando: string
  agente: string
  texto: string
}

export type Snapshot = {
  ahora: string
  oficina: EstadoOficina
  agentes: (Agente & { estado: EstadoAgente; numeros: Numeros })[]
  marcas: Marca[]
  paraTi: Marca[]
  proximos: Proximo[]
}
