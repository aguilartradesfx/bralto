import { Geist, Geist_Mono, JetBrains_Mono, Sora } from 'next/font/google'

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

// Las del centro de mando de Knox (knox.bralto.io), que usa las del sitio
export const panelFonts = `${sora.variable} ${jetbrainsMono.variable}`

// El panel interno (admin.bralto.io) y su login: Geist, neutra y fácil de leer en tablas (components/internal/panel.css)
const geistAdmin = Geist({
  subsets: ['latin'],
  variable: '--font-admin',
  display: 'swap',
})

const geistMonoAdmin = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-admin-mono',
  display: 'swap',
  preload: false,
})

export const adminFonts = `${geistAdmin.variable} ${geistMonoAdmin.variable}`
