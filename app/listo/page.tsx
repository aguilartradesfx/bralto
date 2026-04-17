import Link from 'next/link'
import { CheckCircle, FileText } from 'lucide-react'

interface Props {
  searchParams: Promise<{ c?: string; from?: string }>
}

export const metadata = { title: 'Listo — Bralto' }

export default async function ListoPage({ searchParams }: Props) {
  const { c } = await searchParams
  const contractUrl = c ? `/c/${c}` : null

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-20"
      style={{ background: 'linear-gradient(180deg,#f8f8f8 0%,#ffffff 40%,#f8f8f8 100%)' }}>

      <div className="max-w-md w-full text-center">
        {/* Logo */}
        <img src="/logo.png" alt="Bralto" className="h-8 mx-auto mb-10 opacity-80" />

        {/* Check */}
        <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-green-50 border border-green-200">
          <CheckCircle size={40} className="text-green-500" />
        </div>

        <p className="text-xs font-semibold uppercase tracking-widest text-orange-500 mb-3">
          ¡Todo listo!
        </p>

        <h1 className="text-3xl font-bold text-gray-900 mb-4 leading-tight">
          Proceso completado
        </h1>

        <p className="text-gray-500 leading-relaxed mb-8">
          Hemos registrado tu firma y recibirás un correo de confirmación con el documento en los próximos minutos.
        </p>

        {contractUrl && (
          <Link
            href={contractUrl}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 transition-colors mb-4"
          >
            <FileText size={15} />
            Ver contrato firmado
          </Link>
        )}

        <p className="text-xs text-gray-400 mt-6">
          ¿Tenés dudas?{' '}
          <a href="mailto:hola@bralto.io" className="text-orange-500 hover:underline">
            Escribinos
          </a>
        </p>
      </div>
    </div>
  )
}
