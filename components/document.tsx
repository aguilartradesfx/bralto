import type { ReactNode } from 'react'
import { ParticlesBackground } from '@/components/particles-background'
import { OrganizationJsonLd, WebSiteJsonLd } from '@/components/seo/JsonLd'
import { tagManagerBootScript } from '@/lib/consent'
import { motionBootScript } from '@/lib/home/motion'
import { PRIVATE_SURFACE_JS } from '@/lib/host-routing'
import { scrollRestorationScript } from '@/lib/scroll-restoration'

const GTM_ID = 'GTM-KTGZ86BC'

// <html> y <body> de cada sección. El layout raíz solo pasa los hijos: así cada sección
// (/es, /en, el panel, /payment-info, el 404…) sale del servidor con su idioma en <html lang>,
// sin un script que lo corrija en el navegador.
// fonts: las variables de fuente de la sección (el sitio público pone las suyas en .hm)
export function Document({ lang, fonts, children }: { lang: 'es' | 'en'; fonts?: string; children: ReactNode }) {
  return (
    <html lang={lang} suppressHydrationWarning className={fonts ? `dark ${fonts}` : 'dark'} data-scroll-behavior="smooth">
      <head>
        {/* GTM según el consentimiento de cookies (lib/consent.ts); nunca en el panel ni en la firma de contratos */}
        <script
          dangerouslySetInnerHTML={{ __html: tagManagerBootScript({ gtmId: GTM_ID, privateSurfaceJs: PRIVATE_SURFACE_JS }) }}
        />
        {/* Cada carga arranca arriba; la URL (query y #ancla) queda intacta */}
        <script dangerouslySetInnerHTML={{ __html: scrollRestorationScript }} />
        {/* Animaciones pausadas desde el pie: se aplica antes del primer pintado */}
        <script dangerouslySetInnerHTML={{ __html: motionBootScript }} />
        <OrganizationJsonLd />
        <WebSiteJsonLd />
      </head>
      <body>
        {/* Sin el iframe noscript de GTM: sin JavaScript no hay banner para aceptar ni rechazar */}
        {/* Partículas con scroll: una sola vez para todo el sitio público */}
        <ParticlesBackground />
        {/* All content above background layers; el banner de cookies vive en SiteShell */}
        <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
      </body>
    </html>
  )
}
