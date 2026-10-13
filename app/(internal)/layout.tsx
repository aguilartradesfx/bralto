import '@/components/home/tokens.css'
import '@/components/internal/panel.css'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Document } from '@/components/document'
import { panelFonts } from '@/components/home/fonts'
import { InternalNav } from '@/components/internal/internal-nav'
import { getCurrentSession } from '@/lib/panel-session'

export const metadata: Metadata = { robots: { index: false, follow: false } }

export default async function InternalLayout({ children }: { children: React.ReactNode }) {
  const { user, profile } = await getCurrentSession()
  if (!user) redirect('/login')

  return (
    <Document lang="es" fonts={panelFonts}>
      <div className="pn text-white">
        <InternalNav profile={profile} />
        <main className="pt-14 md:pt-0 md:pl-[248px] min-h-screen">{children}</main>
      </div>
    </Document>
  )
}
