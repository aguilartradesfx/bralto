import { redirect } from 'next/navigation'
import { clients } from '../clients'

export function generateStaticParams() {
  return clients.map(c => ({ slug: c.id }))
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  redirect(`/es/servicios/sitios-web/${slug}`)
}
