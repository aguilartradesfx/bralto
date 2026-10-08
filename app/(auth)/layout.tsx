import type { Metadata } from 'next'
import { Document } from '@/components/document'

export const metadata: Metadata = {
  title: 'Ingresar',
  robots: { index: false, follow: false },
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <Document lang="es">{children}</Document>
}
