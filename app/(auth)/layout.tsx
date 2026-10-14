import '@/components/home/tokens.css'
import '@/components/internal/panel.css'
import type { Metadata } from 'next'
import { Document } from '@/components/document'
import { panelFonts } from '@/components/home/fonts'
import { PanelAmbient } from '@/components/internal/panel-ambient'
import { themeBootScript } from '@/lib/home/theme'

export const metadata: Metadata = {
  title: 'Ingresar',
  robots: { index: false, follow: false },
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <Document lang="es" fonts={panelFonts}>
      <div className="pn" data-theme="dark" suppressHydrationWarning>
        {/* Fija el tema guardado antes del primer pintado (sin flash); debe ser el primer hijo */}
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
        <PanelAmbient />
        {children}
      </div>
    </Document>
  )
}
