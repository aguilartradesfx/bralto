// Slug de una URL pública de propuesta: https://bralto.io/propuestas/<slug>
export function proposalSlugFromUrl(url: string | null | undefined): string | null {
  if (!url) return null
  const match = url.match(/\/propuestas\/([^/?#]+)/)
  return match ? match[1] : null
}
