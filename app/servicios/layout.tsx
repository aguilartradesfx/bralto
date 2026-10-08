import { Document } from '@/components/document'

// Rutas viejas sin idioma: solo redirigen a /es/servicios/…
export default function ServiciosLayout({ children }: { children: React.ReactNode }) {
  return <Document lang="es">{children}</Document>
}
