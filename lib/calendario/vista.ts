import type { Publicacion } from '../redes/publicacion/tipos.ts'
import type { EstadoPrueba, Prueba } from '../redes/pruebas/tipos.ts'

// Una fila completa de redes_publicaciones, como la lee el panel
export type Fila = Publicacion & { ultimo_error: string | null }

// Lo que muestra el mes de cada publicación
export type Resumen = Pick<Publicacion, 'id' | 'titulo' | 'tipo' | 'estado' | 'publicar_en' | 'prueba' | 'grupo' | 'version'>

// Lo que necesita la página de una publicación. Campo por campo: lo interno (los mensajes del «Comenta»,
// los pasos de la publicación) no viaja al navegador
export type Vista = Pick<
  Fila,
  | 'id'
  | 'titulo'
  | 'tipo'
  | 'estado'
  | 'publicar_en'
  | 'texto'
  | 'laminas'
  | 'video_url'
  | 'portada_url'
  | 'historias'
  | 'colaborador'
  | 'hecho_con_ia'
  | 'facebook'
  | 'ultimo_error'
> & {
  palabra: string | null // la del «Comenta PALABRA»
  instagram: string | null // enlace al post, si ya salió
  facebookUrl: string | null
  // Si es una versión de un reel de prueba: cuál es, cómo va el grupo y, cuando se decide, qué pasó con ella
  prueba: { version: number; total: 5; estado: EstadoPrueba; decidir_en: string | null; final: FinalPrueba | null } | null
}

export type FinalPrueba = 'gano' | 'borrada' | 'sin_borrar' | 'ya_no_estaba' | 'sin_ganadora' | 'no_salio'

// Qué pasó de verdad con esta versión cuando se decidió el grupo
function finalDe(f: Fila, p: Prueba): FinalPrueba | null {
  if (p.estado !== 'decidida') return null
  if (p.ganadora === f.id) return 'gano'
  if (!p.ganadora) return 'sin_ganadora'
  if (!f.resultado?.instagram) return 'no_salio'
  if (p.resultado.metricas?.[f.id] === 'no_existe') return 'ya_no_estaba'
  return p.resultado.borradas?.[f.id] === 'ok' ? 'borrada' : 'sin_borrar'
}

export function aVista(f: Fila, p?: Prueba | null): Vista {
  const prueba =
    f.prueba && f.version
      ? {
          version: f.version,
          total: 5 as const,
          estado: p?.estado ?? 'programada',
          decidir_en: p?.decidir_en ?? null,
          final: p ? finalDe(f, p) : null,
        }
      : null
  return {
    prueba,
    id: f.id,
    titulo: f.titulo,
    tipo: f.tipo,
    estado: f.estado,
    publicar_en: f.publicar_en,
    texto: f.texto,
    laminas: f.laminas,
    video_url: f.video_url,
    portada_url: f.portada_url,
    historias: f.historias,
    colaborador: f.colaborador,
    hecho_con_ia: f.hecho_con_ia,
    facebook: f.facebook,
    ultimo_error: f.ultimo_error,
    palabra: f.comenta?.palabras?.[0] ?? null,
    instagram: f.resultado?.instagram?.permalink ?? null,
    facebookUrl: f.resultado?.facebook?.url ?? null,
  }
}
