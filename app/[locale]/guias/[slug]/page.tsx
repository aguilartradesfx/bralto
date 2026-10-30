import { cache } from 'react'
import type { Metadata } from 'next'
import { cookies, headers } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'
import { GuiaArticulo } from '@/components/guias/guia-articulo'
import { COOKIE_GUIAS, leerAcceso, secretoGuias } from '@/lib/guias/acceso'
import { bloquesVisibles, secciones, tieneAcceso } from '@/lib/guias/contenido'
import { obtenerGuia } from '@/lib/guias/servidor'
import { SITE_URL, buildPageMetadata } from '@/lib/seo'

// Cada visita se arma en el servidor: la parte bloqueada solo viaja si la cookie es válida
export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ locale: string; slug: string }>; searchParams: Promise<{ o?: string; abierta?: string }> }

const cargar = cache((slug: string) => obtenerGuia(slug))

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const g = await cargar(slug)
  if (!g) return {}
  const base = buildPageMetadata({
    locale: 'es',
    pathByLocale: { es: `/guias/${slug}`, en: `/guias/${slug}` },
    titles: { es: g.titulo, en: g.titulo },
    descriptions: { es: g.resumen, en: g.resumen },
    ...(g.imagenUrl ? { ogImage: g.imagenUrl } : {}),
  })
  // Las guías son solo en español: sin versión en inglés que anunciar
  return { ...base, alternates: { canonical: `${SITE_URL}/es/guias/${slug}` } }
}

export default async function GuiaPage({ params, searchParams }: Props) {
  const { locale, slug } = await params
  const { o, abierta } = await searchParams
  if (locale !== 'es') redirect(`/es/guias/${slug}${o ? `?o=${encodeURIComponent(o)}` : ''}`)
  setRequestLocale('es')

  const guia = await cargar(slug)
  if (!guia) notFound()
  const firmaValida = leerAcceso(secretoGuias(process.env), (await cookies()).get(COOKIE_GUIAS)?.value) !== null
  const conAcceso = tieneAcceso(guia, firmaValida)

  // Los componentes reciben solo los bloques visibles: la guía entera nunca baja por props.
  // Los títulos de las secciones sí se muestran a todos («Ir directo a»): dicen qué trae, no el contenido.
  const { abierto: _abierto, bloqueado: _bloqueado, ...datos } = guia
  return (
    <GuiaArticulo
      guia={datos}
      visibles={bloquesVisibles(guia, conAcceso)}
      secciones={secciones(guia)}
      conAcceso={conAcceso}
      recienAbierta={conAcceso && abierta === '1'}
      origen={o}
      pais={conAcceso ? null : (await headers()).get('x-vercel-ip-country')}
    />
  )
}
