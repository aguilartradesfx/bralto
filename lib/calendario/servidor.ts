// SERVER-ONLY — el Calendario contra redes_publicaciones, con service role (la tabla no tiene políticas de RLS).
// Quien llama revisa antes el permiso: la página o la ruta de la API. La lógica está en editar.ts, con pruebas.
import { createServiceClient } from '@/lib/supabase/service'
import type { Actualizar } from '@/lib/calendario/editar'
import type { Fila, Resumen } from '@/lib/calendario/vista'

const TABLA = 'redes_publicaciones'
const COLUMNAS =
  'id, titulo, tipo, estado, publicar_en, texto, laminas, video_url, portada_url, historias, colaborador, hecho_con_ia, facebook, comenta, resultado, intentos, ultimo_error'
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Lo que sale entre dos instantes (desde incluido, hasta no), en orden de hora
export async function leerEntre(desde: string, hasta: string): Promise<Resumen[]> {
  const { data, error } = await createServiceClient()
    .from(TABLA)
    .select('id, titulo, tipo, estado, publicar_en')
    .gte('publicar_en', desde)
    .lt('publicar_en', hasta)
    .order('publicar_en')
  if (error) throw new Error(`${TABLA}: ${error.message}`)
  return (data ?? []) as Resumen[]
}

// null si no existe, o si el id ni siquiera tiene la forma de uno (Postgres respondería con un error)
export async function leerFila(id: string): Promise<Fila | null> {
  if (!UUID.test(id)) return null
  const { data, error } = await createServiceClient().from(TABLA).select(COLUMNAS).eq('id', id).maybeSingle()
  if (error) throw new Error(`${TABLA}: ${error.message}`)
  return (data as Fila | null) ?? null
}

// Condicional: solo cambia la fila si sigue en uno de `estados`. Si el cron ya la tomó, no cambia nada
export const actualizarFila: Actualizar = async (id, cambio, estados) => {
  const { data, error } = await createServiceClient()
    .from(TABLA)
    .update(cambio)
    .eq('id', id)
    .in('estado', [...estados])
    .select('id')
  if (error) return { error: `${TABLA}: ${error.message}` }
  return { filas: data?.length ?? 0 }
}
