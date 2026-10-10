import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { appFonts } from '@/components/app-fonts'
import { Document } from '@/components/document'
import { InternalNav } from '@/components/internal/internal-nav'
import { getCurrentSession } from '@/lib/panel-session'

export const metadata: Metadata = { robots: { index: false, follow: false } }

export default async function InternalLayout({ children }: { children: React.ReactNode }) {
  const { user, profile } = await getCurrentSession()
  if (!user) redirect('/login')

  return (
    <Document lang="es" fonts={appFonts}>
      <div className="min-h-screen bg-[#060607] text-white">
        <InternalNav profile={profile} />
        <main className="pt-14 md:pt-0 md:ml-56 min-h-screen">{children}</main>
      </div>
    </Document>
  )
}
