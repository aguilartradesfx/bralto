import { appFonts } from '@/components/app-fonts'
import { Document } from '@/components/document'

export default function FunnelLayout({ children }: { children: React.ReactNode }) {
  return <Document lang="es" fonts={appFonts}>{children}</Document>
}
