// El slug sale del título en español y lo comparten las dos versiones de la nota
export function slugify(title: string, max = 80): string {
  const s = title
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  if (!s) return 'nota'
  if (s.length <= max) return s
  const cut = s.slice(0, max + 1)
  const at = cut.lastIndexOf('-')
  return (at > 0 ? cut.slice(0, at) : s.slice(0, max)).replace(/-+$/, '')
}

// Si dos notas dan el mismo slug, la nueva lleva -2, -3…
export function uniqueSlug(base: string, taken: string[]): string {
  const used = new Set(taken)
  if (!used.has(base)) return base
  let n = 2
  while (used.has(`${base}-${n}`)) n++
  return `${base}-${n}`
}
