import { JetBrains_Mono, Sora } from 'next/font/google'

// Solo el home usa estas fuentes; el resto del sitio sigue con Geist.
export const sora = Sora({
  subsets: ['latin'],
  variable: '--font-sora',
  display: 'swap',
})

export const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jbmono',
  display: 'swap',
})
