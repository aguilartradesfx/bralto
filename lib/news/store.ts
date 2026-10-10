import { createClient } from '@supabase/supabase-js'
import { createServiceClient } from '@/lib/supabase/service'
import type { NewsRow, NewsStatus } from './types'

// Lecturas públicas con la clave anónima (RLS: solo lo publicado); escrituras y vista
// previa con la service role. Todo se consulta en cada visita: ocultar es inmediato.
const TABLE = 'noticias'
export const BUCKET = 'noticias'
export const PAGE_SIZE = 24
const COLUMNS =
  'id, slug, titulo_es, resumen_es, cuerpo_es, imagen_alt_es, titulo_en, resumen_en, cuerpo_en, imagen_alt_en, fuente_url, fuente_nombre, imagen_url, publicada_en, estado, actualizada_en'

function publicClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

function fail(what: string, error: { message: string } | null): never {
  throw new Error(`noticias: ${what}: ${error?.message ?? 'sin respuesta'}`)
}

export async function listPublished(page: number): Promise<{ items: NewsRow[]; hasMore: boolean }> {
  const from = (Math.max(1, page) - 1) * PAGE_SIZE
  const { data, error } = await publicClient()
    .from(TABLE)
    .select(COLUMNS)
    .eq('estado', 'publicada')
    .order('publicada_en', { ascending: false })
    .range(from, from + PAGE_SIZE) // uno de más para saber si hay otra página
  if (error) fail('listado', error)
  const rows = (data ?? []) as NewsRow[]
  return { items: rows.slice(0, PAGE_SIZE), hasMore: rows.length > PAGE_SIZE }
}

export async function getPublished(slug: string): Promise<NewsRow | null> {
  const { data, error } = await publicClient()
    .from(TABLE)
    .select(COLUMNS)
    .eq('slug', slug)
    .eq('estado', 'publicada')
    .maybeSingle()
  if (error) fail('nota', error)
  return data as NewsRow | null
}

export async function getAnyBySlug(slug: string): Promise<NewsRow | null> {
  const { data, error } = await createServiceClient().from(TABLE).select(COLUMNS).eq('slug', slug).maybeSingle()
  if (error) fail('vista previa', error)
  return data as NewsRow | null
}

export async function getById(id: string): Promise<NewsRow | null> {
  const { data, error } = await createServiceClient().from(TABLE).select(COLUMNS).eq('id', id).maybeSingle()
  if (error) fail('nota por id', error)
  return data as NewsRow | null
}

export async function listForSitemap(): Promise<{ slug: string; actualizada_en: string }[]> {
  const { data, error } = await publicClient().from(TABLE).select('slug, actualizada_en').eq('estado', 'publicada')
  if (error) fail('sitemap', error)
  return data ?? []
}

// Todo lo ya guardado (también lo oculto) y los títulos de las últimas 2 semanas
export async function recentForDedup(): Promise<{ fuentes: string[]; titulos: string[] }> {
  const db = createServiceClient()
  const since = new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString()
  const [all, recent] = await Promise.all([
    db.from(TABLE).select('fuente_url'),
    db.from(TABLE).select('titulo_es').gte('creada_en', since).order('creada_en', { ascending: false }),
  ])
  if (all.error) fail('fuentes usadas', all.error)
  if (recent.error) fail('títulos recientes', recent.error)
  return {
    fuentes: (all.data ?? []).map((r) => r.fuente_url as string),
    titulos: (recent.data ?? []).map((r) => r.titulo_es as string),
  }
}

export async function sourceExists(url: string): Promise<boolean> {
  const { count, error } = await createServiceClient()
    .from(TABLE)
    .select('id', { count: 'exact', head: true })
    .eq('fuente_url', url)
  if (error) fail('fuente repetida', error)
  return (count ?? 0) > 0
}

export async function takenSlugs(base: string): Promise<string[]> {
  const { data, error } = await createServiceClient().from(TABLE).select('slug').like('slug', `${base}%`)
  if (error) fail('slugs', error)
  return (data ?? []).map((r) => r.slug as string)
}

export async function uploadCover(path: string, jpeg: Buffer): Promise<string> {
  const storage = createServiceClient().storage.from(BUCKET)
  const { error } = await storage.upload(path, jpeg, { contentType: 'image/jpeg', upsert: false, cacheControl: '31536000' })
  if (error) fail('subir portada', error)
  return storage.getPublicUrl(path).data.publicUrl
}

export async function removeCover(path: string): Promise<void> {
  await createServiceClient().storage.from(BUCKET).remove([path])
}

export async function insertNews(row: Omit<NewsRow, 'id' | 'publicada_en' | 'actualizada_en'>): Promise<NewsRow> {
  const { data, error } = await createServiceClient().from(TABLE).insert(row).select(COLUMNS).single()
  if (error) fail('guardar', error)
  return data as NewsRow
}

// Publicar desde el correo pone la fecha de hoy: es cuando sale al sitio
export async function setStatus(id: string, estado: NewsStatus): Promise<NewsRow | null> {
  const patch = estado === 'publicada' ? { estado, publicada_en: new Date().toISOString() } : { estado }
  const { data, error } = await createServiceClient()
    .from(TABLE)
    .update(patch)
    .eq('id', id)
    .select(COLUMNS)
    .maybeSingle()
  if (error) fail('cambiar estado', error)
  return data as NewsRow | null
}
