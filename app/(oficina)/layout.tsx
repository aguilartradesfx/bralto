import type { Metadata } from 'next'
import { Document } from '@/components/document'
import { adminFonts } from '@/components/home/fonts'

// La Oficina de Knox va sola, sin el menú ni la cabecera del panel: es una pantalla completa en su propia pestaña
export const metadata: Metadata = {
  title: { absolute: 'La Oficina de Knox' },
  robots: { index: false, follow: false },
}

export default function OficinaLayout({ children }: { children: React.ReactNode }) {
  return (
    <Document lang="es" fonts={adminFonts}>
      <div className="min-h-screen" style={{ background: '#0b0d12' }}>
        {children}
      </div>
    </Document>
  )
}
