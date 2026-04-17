import slugify from 'slugify'
import { nanoid } from 'nanoid'

export function generateContractSlug(empresaNombre: string): string {
  const base = slugify(empresaNombre, {
    lower: true,
    strict: true,
    locale: 'es',
    trim: true,
  }).slice(0, 40) // cap slug length

  const suffix = nanoid(4)
  return `${base}-${suffix}`
}
