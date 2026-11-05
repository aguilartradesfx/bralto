import '@/components/home/tokens.css'
import '@/components/internal/panel.css'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Document } from '@/components/document'
import { adminFonts } from '@/components/home/fonts'
import { themeBootScript } from '@/lib/home/theme'
import { Marco, menuBootScript } from '@/components/internal/shell/marco'
import { getCurrentSession } from '@/lib/panel-session'
import { menuPara, piePara } from '@/lib/panel/navegacion'
import { cuentasDelMenu } from '@/lib/panel/cuentas'

export const metadata: Metadata = { title: { default: 'Panel', template: '%s · Panel Bralto' }, robots: { index: false, follow: false } }

export default async function InternalLayout({ children }: { children: React.ReactNode }) {
  const { user, profile } = await getCurrentSession()
  if (!user) redirect('/login')

  const cuentas = profile?.is_admin ? await cuentasDelMenu() : {}

  return (
    <Document lang="es" fonts={adminFonts}>
      <div className="pn" data-theme="dark" suppressHydrationWarning>
        {/* Fijan el tema y el ancho del menú guardados antes del primer pintado (sin flash); deben ser los primeros hijos */}
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
        <script dangerouslySetInnerHTML={{ __html: menuBootScript }} />
        <Marco menu={menuPara(profile)} pie={piePara(profile)} cuentas={cuentas} perfil={profile} nombre={profile?.full_name?.trim() ?? ''} correo={user.email ?? ''}>
          {children}
        </Marco>
      </div>
    </Document>
  )
}
