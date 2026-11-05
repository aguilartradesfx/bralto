import type { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'
import { Recursos } from '@/components/recursos/recursos'
import { RECURSOS } from '@/components/recursos/textos'
import { leerSeccion, pagina as paginar, rutaDeSeccion } from '@/lib/recursos/lista'
import { cargarRecursos } from '@/lib/recursos/servidor'
import { SITE_URL, buildPageMetadata } from '@/lib/seo'

// Se arma en cada visita: lo que se oculta o se publica se ve enseguida
export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ locale: string; seccion?: string[] }>; searchParams: Promise<{ p?: string }> }

const toPage = (p?: string) => Math.max(1, Number.parseInt(p ?? '1', 10) || 1)

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const seccion = leerSeccion((await params).seccion)
  if (!seccion) return {}
  const ruta = rutaDeSeccion(seccion).replace(/^\/es/, '')
  const { titulo, descripcion } = RECURSOS.secciones[seccion].meta
  const base = buildPageMetadata({
    locale: 'es',
    pathByLocale: { es: ruta, en: ruta },
    titles: { es: titulo, en: titulo },
    descriptions: { es: descripcion, en: descripcion },
  })
  // Solo en español (como las guías): sin versión en inglés que anunciar. Las páginas 2, 3… no compiten con la primera.
  const meta = { ...base, alternates: { canonical: `${SITE_URL}/es${ruta}` } }
  return toPage((await searchParams).p) > 1 ? { ...meta, robots: { index: false, follow: true } } : meta
}

export default async function RecursosPage({ params, searchParams }: Props) {
  const { locale, seccion: partes } = await params
  const seccion = leerSeccion(partes)
  if (!seccion) notFound()
  if (locale !== 'es') permanentRedirect(rutaDeSeccion(seccion))
  setRequestLocale('es')

  const n = toPage((await searchParams).p)
  const todo = await cargarRecursos()
  const { items, hayMas } = paginar(todo[seccion], n)
  if (n > 1 && items.length === 0) notFound()

  return (
    <Recursos
      seccion={seccion}
      items={items}
      pagina={n}
      hayMas={hayMas}
      cuantos={{ guias: todo.guias.length, noticias: todo.noticias.length, descargables: todo.descargables.length }}
    />
  )
}
