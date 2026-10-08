import type { Metadata } from 'next'
import { Document } from '@/components/document'

// Contract signing pages: the slug alone grants access, so keep them out of search engines
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function ContractLayout({ children }: { children: React.ReactNode }) {
  return <Document lang="es">{children}</Document>
}
