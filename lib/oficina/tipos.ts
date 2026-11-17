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
  lugar: string | null
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
  agentes: (Agente & { estado: EstadoAgente; numeros: Numeros; semana: DiaSemana[] })[]
  marcas: Marca[]
  paraTi: Marca[]
  proximos: Proximo[]
  chat: LineaTertulia[] // la tertulia de hoy que ya salió (las líneas de una visita, con rincon null y su «donde»)
  escribiendo: string | null // quién dice la próxima línea, si sale en 3 min o menos
  pubs: Pub[] // las 10 próximas publicaciones programadas
  // las líneas de las visitas de hoy, también las que salen más tarde, sin su texto: la maqueta lleva al visitante a la
  // oficina del otro desde un minuto antes de que hable (repartirVisitas)
  visitas: LineaVisita[]
}

export type AgenteSnap = Snapshot['agentes'][number]

export type Pub = { id: string, titulo: string, publicar_en: string, prueba: boolean }

export type Rincon = 'cafe' | 'platica' | 'siesta'

// Dónde se dijo una línea: en el café o en la plática de la sala, o de visita en la oficina de otro (null: desde su escritorio)
export type RinconChat = 'cafe' | 'platica' | 'visita'

export type LineaTertulia = {
  id: string
  de: string
  para: string | null
  texto: string
  rincon: RinconChat | null
  // en una visita, el anfitrión (a quien visitan); si no, null
  donde: string | null
  // las líneas de una misma charla llevan el mismo hilo; una línea suelta, null
  hilo: string | null
  idea_id: string | null
  mostrar_desde: string
}

// Una línea de una visita sin su texto (lo que la maqueta necesita para saber quién está de visita y dónde)
export type LineaVisita = Pick<LineaTertulia, 'id' | 'de' | 'para' | 'rincon' | 'donde' | 'hilo' | 'mostrar_desde'>

// Los tres turnos de la tertulia (turnos.ts)
export type Turno = 'manana' | 'mediodia' | 'tarde'

// dia = AAAA-MM-DD de Costa Rica
export type FilaSemana = { agente: string, dia: string, tareas: number, falla: boolean }
export type DiaSemana = { dia: string, etiqueta: string, tareas: number, falla: boolean }

export type Comentario = {
  id: string
  post_id: string
  de: string
  texto: string
  en_respuesta_a: string | null
  idea_id: string | null
  mostrar_desde: string
}

export type Post = {
  id: string
  de: string
  tipo: 'nota' | 'foto' | 'debate' | 'idea'
  titulo: string
  texto: string
  foto_id: string | null
  likes: number
  te_gusta: boolean
  idea_id: string | null
  mostrar_desde: string
  comentarios: Comentario[]
}

export type EstadoIdea = 'nueva' | 'sirve' | 'no_va'

export type Idea = {
  id: string
  texto: string
  por_que: string
  de: string
  post_id: string | null
  estado: EstadoIdea
  mostrar_desde: string
  decidida_en: string | null
}

export type Foto = { id: string, tipo: 'retrato' | 'grupo', agentes: string[], url: string, pie: string | null }

// Una por turno de cada día
export type Ronda = { fecha: string, turno: Turno, resultado: 'ok' | 'falla' | 'saltada', detalle: string }

export type FilaTeToca = {
  clave: 'mensajes' | 'tareas' | 'grabar' | 'guiones' | 'ideas'
  n: number
  texto: string
  sub: string
  boton: string
  href: string
}

// El foro, las ideas, las fotos (con su enlace firmado) y la última ronda de hoy: viajan solo cuando cambian
export type Social = { foro: Post[], proxima: string | null, ideas: Idea[], fotos: Foto[], ronda: Ronda | null }

// GET /api/oficina: `social` es null cuando la firma no cambió (la página se queda con el que tiene)
export type RespuestaOficina = Snapshot & { teToca: FilaTeToca[], firmaSocial: string, social: Social | null }
