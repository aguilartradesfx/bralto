import Link from 'next/link'
import { Arrow } from './icons'
import { StatusCard } from './status-card'

// 404 con la marca: el nav arriba y dos salidas, al inicio y a los servicios. Es una sola
// página estática para cualquier ruta (Next no sabe el idioma de una ruta que no existe):
// en español, con una línea en inglés hacia el sitio en inglés.
export function NotFoundCard() {
  return (
    <StatusCard
      tone="notice"
      eyebrow="Error 404"
      title="No encontramos esta página."
      actions={
        <>
          <Link href="/es" className="hm-btn hm-btn--solid">
            Ir al inicio
            <Arrow />
          </Link>
          <Link href="/es/precios" className="hm-btn hm-btn--glass hm-glass">
            Ver servicios
          </Link>
        </>
      }
    >
      <p>Puede que el enlace esté mal escrito o que la página ya no exista.</p>
      <p lang="en" className="st-alt">
        We couldn’t find this page. <Link href="/en">Go to the English site</Link>
      </p>
    </StatusCard>
  )
}
