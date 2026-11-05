import { ProposalForm } from '@/components/proposals/proposal-form'

export const metadata = { title: 'Nueva solicitud de propuesta' }

export default function NuevaSolicitudPage() {
  return (
    <div className="max-w-3xl px-4 pb-12 md:px-8">
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-fg">Nueva solicitud</h1>
        <p className="text-sm text-fg/40 mt-0.5">
          Llena este formulario para registrar un cliente potencial. Alejandro lo revisará para preparar la propuesta.
        </p>
      </div>
      <ProposalForm />
    </div>
  )
}
