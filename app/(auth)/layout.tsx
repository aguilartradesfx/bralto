import '@/components/home/tokens.css'
import '@/components/internal/panel.css'
import type { Metadata } from 'next'
import { Document } from '@/components/document'
import { panelFonts } from '@/components/home/fonts'

export const metadata: Metadata = {
  title: 'Ingresar',
  robots: { index: false, follow: false },
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <Document lang="es" fonts={panelFonts}>
      <div className="pn">{children}</div>
    </Document>
  )
}
