import { Geist, Geist_Mono, Instrument_Serif } from 'next/font/google'

// Fuentes del panel, el login, la firma de contratos y el funnel viejo (Tailwind: font-sans,
// font-mono y font-serif). El sitio público usa Sora y JetBrains Mono (components/home/fonts.ts):
// si este módulo lo importara su layout, cada página precargaría estas tres sin usarlas.

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

export const appFonts = `${geist.variable} ${geistMono.variable} ${instrumentSerif.variable}`
