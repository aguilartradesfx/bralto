import { Document } from '@/components/document'
import { NotFoundCard } from '@/components/home/not-found-card'
import { SiteShell } from '@/components/home/shell'

// 404 de todo el sitio (cualquier ruta que no existe, también bajo /es y /en), con el nav y
// el tema del sitio. Tiene que quedar estático: si se vuelve dinámico, Next lo entrega como
// página de error que se arma en el navegador (sin HTML del servidor y a veces en blanco).
// Next también lo arma dentro de cada página (es el respaldo de notFound()), así que no puede
// fijar el idioma de la petición: con setRequestLocale('es'), /en/agendar salía en español.
// No hace falta: SiteShell pide sus textos con el idioma explícito y nada aquí usa next-intl
// en el cliente. Como el layout raíz solo pasa los hijos, arma su propio <html>.
export default function NotFound() {
  return (
    <Document lang="es">
      <SiteShell locale="es">
        <NotFoundCard />
      </SiteShell>
    </Document>
  )
}
