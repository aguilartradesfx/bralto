import { JetBrains_Mono, Sora } from 'next/font/google'

// El sitio y el panel interno usan estas fuentes; la firma de contratos sigue con Geist.
export const sora = Sora({
  subsets: ['latin'],
  variable: '--font-sora',
  display: 'swap',
})

// Solo etiquetas chicas: sin preload, para no competir con Sora (la fuente del LCP)
export const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jbmono',
  display: 'swap',
  preload: false,
})

// Variables de fuente del panel interno y el login (components/internal/panel.css)
export const panelFonts = `${sora.variable} ${jetbrainsMono.variable}`
