import type { ReactNode } from 'react'
import { Geist, Geist_Mono, Instrument_Serif } from 'next/font/google'
import { ParticlesBackground } from '@/components/particles-background'
import { OrganizationJsonLd, WebSiteJsonLd } from '@/components/seo/JsonLd'
import { tagManagerBootScript } from '@/lib/consent'
import { PRIVATE_SURFACE_JS } from '@/lib/host-routing'
import { scrollRestorationScript } from '@/lib/scroll-restoration'

const GTM_ID = 'GTM-KTGZ86BC'

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-geist',
  display: 'swap',
})

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
  display: 'swap',
})

const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-instrument-serif',
  display: 'swap',
})

// <html> y <body> de cada sección. El layout raíz solo pasa los hijos: así cada sección
// (/es, /en, el panel, /payment-info, el 404…) sale del servidor con su idioma en <html lang>,
// sin un script que lo corrija en el navegador.
export function Document({ lang, children }: { lang: 'es' | 'en'; children: ReactNode }) {
  return (
    <html lang={lang} suppressHydrationWarning className={`dark ${geist.variable} ${geistMono.variable} ${instrumentSerif.variable}`}>
      <head>
        {/* GTM según el consentimiento de cookies (lib/consent.ts); nunca en el panel ni en la firma de contratos */}
        <script
          dangerouslySetInnerHTML={{ __html: tagManagerBootScript({ gtmId: GTM_ID, privateSurfaceJs: PRIVATE_SURFACE_JS }) }}
        />
        {/* Cada carga arranca arriba; la URL (query y #ancla) queda intacta */}
        <script dangerouslySetInnerHTML={{ __html: scrollRestorationScript }} />
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
