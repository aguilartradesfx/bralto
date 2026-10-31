import type { Metadata } from 'next'
import { Document } from '@/components/document'
import { panelFonts } from '@/components/home/fonts'

// El Centro de mando de Knox va solo, sin el menú ni la cabecera del panel: es una pantalla completa (la app de Mac
// la abre así). Las mismas fuentes del sitio y del panel (Sora y JetBrains Mono)
export const metadata: Metadata = {
  title: { absolute: 'Knox · Centro de mando' },
  robots: { index: false, follow: false },
}

export default function CentroLayout({ children }: { children: React.ReactNode }) {
  return (
    <Document lang="es" fonts={panelFonts}>
      {children}
    </Document>
  )
}
