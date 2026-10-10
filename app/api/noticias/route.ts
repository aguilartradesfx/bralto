import { NextResponse } from 'next/server'
import { hasNewsApiKey } from '@/lib/news/api-key'
import { composeCover } from '@/lib/news/cover'
import { signNewsToken } from '@/lib/news/links'
import { decodeImage, parsePublish } from '@/lib/news/payload'
import { publishDateProblems, validateArticle, validateDraft } from '@/lib/news/rules'
import { slugify, uniqueSlug } from '@/lib/news/slug'
import { insertNews, removeCover, sourceExists, takenSlugs, uploadCover } from '@/lib/news/store'

export const runtime = 'nodejs'
export const maxDuration = 60

// Publica la nota que arma n8n: valida, firma la portada, la sube y guarda la fila.
// Si algo falla no queda nada a medias (la portada se borra si la fila no se guarda).
export async function POST(req: Request) {
  if (!hasNewsApiKey(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }
  const parsed = parsePublish(body)
  if (!parsed.ok) return NextResponse.json({ error: 'Pedido incompleto', problemas: parsed.problems }, { status: 400 })
  const input = parsed.value

  // Noticias: con fuente y sin frases copiadas. Artículos de Bralto: sin fuente, con sus propias reglas
  const esNoticia = input.tipo === 'noticia'
  const source = { fuente_url: input.fuente_url ?? '', fuente_nombre: input.fuente_nombre ?? '', fuente_texto: input.fuente_texto ?? '' }
  const problemas = esNoticia
    ? [...validateDraft(input.es, 'es', source), ...validateDraft(input.en, 'en', source)]
    : [...validateArticle(input.es, 'es'), ...validateArticle(input.en, 'en')]
  if (input.publicada_en) problemas.push(...publishDateProblems(input.publicada_en))
  if (problemas.length) return NextResponse.json({ error: 'La nota no cumple las reglas', problemas }, { status: 422 })

  if (esNoticia && (await sourceExists(source.fuente_url)))
    return NextResponse.json({ error: 'Esa fuente ya tiene una nota' }, { status: 409 })

  let cover: Buffer
  try {
    cover = await composeCover(decodeImage(input.imagen_base64))
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: `La imagen no se pudo procesar: ${msg}` }, { status: 422 })
  }

  const base = slugify(input.es.titulo)
  const slug = uniqueSlug(base, await takenSlugs(base))
  const path = `${new Date().getUTCFullYear()}/${slug}.jpg`
  const imagen_url = await uploadCover(path, cover)

  let row
  try {
    row = await insertNews({
      slug,
      tipo: input.tipo,
      titulo_es: input.es.titulo.trim(),
      resumen_es: input.es.resumen.trim(),
      cuerpo_es: input.es.cuerpo.trim(),
      imagen_alt_es: input.es.imagen_alt.trim(),
      titulo_en: input.en.titulo.trim(),
      resumen_en: input.en.resumen.trim(),
      cuerpo_en: input.en.cuerpo.trim(),
      imagen_alt_en: input.en.imagen_alt.trim(),
      fuente_url: esNoticia ? source.fuente_url : null,
      fuente_nombre: esNoticia ? source.fuente_nombre.trim() : null,
      imagen_url,
      estado: input.estado,
      ...(input.publicada_en ? { publicada_en: input.publicada_en } : {}),
    })
  } catch (err) {
    await removeCover(path)
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }

  // Links del correo, hacia el mismo despliegue que publicó (producción o preview)
  const origin = new URL(req.url).origin
  const secret = process.env.NEWS_LINK_SECRET ?? ''
  const action = (a: 'publicar' | 'ocultar') =>
    `${origin}/api/noticias/estado?id=${row.id}&accion=${a}&t=${signNewsToken(secret, row.id, a)}`
  const hidden = row.estado === 'oculta'
  return NextResponse.json(
    {
      id: row.id,
      slug: row.slug,
      estado: row.estado,
      titulo_es: row.titulo_es,
      url_es: `${origin}/es/noticias/${row.slug}`,
      url_en: `${origin}/en/noticias/${row.slug}`,
      vista_previa: hidden ? `${origin}/es/noticias/${row.slug}?vista=${signNewsToken(secret, row.id, 'ver')}` : null,
      accion: hidden ? { publicar: action('publicar') } : { ocultar: action('ocultar') },
    },
    { status: 201 },
  )
}
