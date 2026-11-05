import { listAllForIndex } from '@/lib/news/store'
import { createServiceClient } from '@/lib/supabase/service'
import { armar, type FilaGuia, type Recurso, type Seccion } from './lista'

// Las guías se leen con la service role (la tabla no tiene políticas para anon), pero solo las
// columnas de la tarjeta: la parte bloqueada nunca sale de aquí. La fecha de cada guía es la de su
// post (redes_publicaciones, por la guía de su «Comenta»). Todo se consulta en cada visita, así lo
// que se oculta desaparece enseguida. Son pocas filas: se reparten y se paginan en memoria.
export async function cargarRecursos(): Promise<Record<Seccion, Recurso[]>> {
  const db = createServiceClient()
  const [notas, guias, posts] = await Promise.all([
    listAllForIndex(),
    db
      .from('guias')
      .select('slug, titulo, resumen, etiqueta, imagen_url, tipo, pide_datos, creada_en')
      .eq('publicada', true)
      .then(({ data, error }) => {
        if (error) throw new Error(`recursos: guías: ${error.message}`)
        return (data ?? []) as Omit<FilaGuia, 'publicar_en'>[]
      }),
    db
      .from('redes_publicaciones')
      .select('publicar_en, guia:comenta->>guia')
      .not('comenta', 'is', null)
      .then(({ data, error }) => {
        if (error) throw new Error(`recursos: posts: ${error.message}`)
        return (data ?? []) as { publicar_en: string | null; guia: string | null }[]
      }),
  ])

  // Si una guía salió en más de un post, cuenta el primero
  const salida = new Map<string, string>()
  for (const p of posts) {
    if (!p.guia || !p.publicar_en) continue
    const antes = salida.get(p.guia)
    if (!antes || Date.parse(p.publicar_en) < Date.parse(antes)) salida.set(p.guia, p.publicar_en)
  }
  return armar(
    notas,
    guias.map((g) => ({ ...g, publicar_en: salida.get(g.slug) ?? null })),
  )
}
