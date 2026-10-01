import { JetBrains_Mono, Sora } from 'next/font/google'

// Solo el home usa estas fuentes; el resto del sitio sigue con Geist.
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
