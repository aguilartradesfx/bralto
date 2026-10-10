import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { NextIntlClientProvider } from 'next-intl'
import { setRequestLocale } from 'next-intl/server'
import { Document } from '@/components/document'
import { SiteShell } from '@/components/home/shell'

export const metadata: Metadata = {
  title: 'Centro de pagos',
  description: 'Cuentas bancarias y pago con tarjeta para clientes de Bralto.',
  // Página para clientes con datos bancarios: fuera de los buscadores
  robots: { index: false, follow: false },
}

// /payment-info vive fuera de /es y /en (es el enlace que se manda a los clientes) pero usa
// el mismo sitio: tema, nav enfocado y banner de cookies. Solo en español.
export default function PaymentInfoLayout({ children }: { children: ReactNode }) {
  setRequestLocale('es')
  return (
    <Document lang="es">
      <NextIntlClientProvider locale="es" messages={null}>
        <SiteShell locale="es">{children}</SiteShell>
      </NextIntlClientProvider>
    </Document>
  )
}
