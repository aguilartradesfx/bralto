import Image from 'next/image'
import Link from 'next/link'
import type { ClientProject } from '@/app/servicios/sitios-web/clients'
import { cn } from '@/lib/utils'
import { Arrow } from './icons'
import type { Locale } from './primitives'

// Un caso real (los mismos proyectos de las páginas de cada trabajo). Toda la tarjeta
// lleva a su página. compact: fila del home; feature: tarjeta de la grilla de /casos.
export function CaseRow({
  client,
  locale,
  viewLabel,
  size = 'compact',
  priority = false,
}: {
  client: ClientProject
  locale: Locale
  viewLabel: string
  size?: 'compact' | 'feature'
  priority?: boolean
}) {
  const info = locale === 'en' && client.en ? client.en : client
  return (
    <Link
      href={`/${locale}/servicios/sitios-web/${client.id}`}
      className={cn('hm-case hm-glass hm-rv', size === 'feature' && 'hm-case--feature')}
    >
      <div className="hm-case__media">
        <Image
          src={client.coverImage}
          alt=""
          fill
          priority={priority}
          sizes={size === 'feature' ? '(min-width: 900px) 600px, 100vw' : '(min-width: 900px) 280px, 100vw'}
        />
      </div>
      <div className="hm-case__body">
        <span className="hm-case__tag">{info.industry}</span>
        <h3>{client.name}</h3>
        <p>{info.tagline}</p>
      </div>
      <span className="hm-case__go">
        {viewLabel}
        <Arrow />
      </span>
    </Link>
  )
}
