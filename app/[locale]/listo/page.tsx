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
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-20 bg-[#060607]">
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_60%_50%_at_50%_40%,rgba(52,211,153,0.04),transparent)]" />

      <div className="relative z-10 max-w-md w-full text-center">
        <img src="/logo.png" alt="Bralto" className="h-6 mx-auto mb-12 opacity-60" />

        <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-full border border-emerald-500/25 bg-emerald-500/10">
          <CheckCircle size={40} className="text-emerald-400" />
        </div>

        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400 mb-4">
          ¡Todo listo!
        </p>

        <h1 className="text-3xl font-bold text-white mb-4 leading-tight tracking-tight">
          Proceso completado
        </h1>

        <p className="text-white/40 leading-relaxed mb-8 text-sm">
          Hemos registrado tu firma y recibirás un correo de confirmación con el documento en los próximos minutos.
        </p>

        {contractUrl && (
          <Link
            href={contractUrl}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/[0.06] hover:bg-white/[0.10] border border-white/[0.08] hover:border-white/[0.14] text-white text-sm font-semibold transition-all mb-4"
          >
            <FileText size={15} />
            Ver contrato firmado
          </Link>
        )}

        <p className="text-xs text-white/25 mt-6">
          ¿Tenés dudas?{' '}
          <a href="mailto:hola@bralto.io" className="text-[#5bb6ff] hover:underline underline-offset-4">
            Escribinos
          </a>
        </p>
      </div>
    </div>
  )
}
