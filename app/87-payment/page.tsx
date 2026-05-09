import Link from 'next/link'
import { CheckCircle, Mail, ArrowRight, Clock } from 'lucide-react'

export default function PaymentConfirmationPage() {
  return (
    <div className="min-h-screen bg-[#131316] text-white px-4 py-12 md:py-20">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_70%_45%_at_50%_0%,rgba(91,182,255,0.05),transparent)] pointer-events-none" />

      <div className="relative z-10 max-w-lg mx-auto">

        {/* Check icon */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-[#5bb6ff]/20 blur-xl scale-150" />
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-[#5bb6ff]/10 border border-[#5bb6ff]/25">
              <CheckCircle size={38} className="text-[#5bb6ff]" />
            </div>
          </div>
        </div>

        {/* Heading */}
        <div className="text-center mb-10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#5bb6ff] mb-3">
            Pago recibido
          </p>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-4">
            ¡Todo listo por tu parte!
          </h1>
          <p className="text-sm text-white/40 leading-relaxed">
            Tu pago de <span className="text-white/65 font-semibold">$87</span> fue procesado correctamente.
            Ahora nos toca a nosotros — en los próximos minutos recibirás un correo con todo lo que necesitas.
          </p>
        </div>

        {/* Steps */}
        <div className="rounded-2xl border border-white/8 bg-white/[0.025] divide-y divide-white/[0.06] mb-4">

          <div className="flex items-start gap-4 p-5">
            <div className="shrink-0 flex h-8 w-8 items-center justify-center rounded-lg bg-[#5bb6ff]/10 border border-[#5bb6ff]/20 mt-0.5">
              <Mail size={14} className="text-[#5bb6ff]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white mb-1">Revisá tu correo</p>
              <p className="text-xs text-white/40 leading-relaxed">
                Te enviaremos las instrucciones para configurar tu cuenta Bralto — credenciales, pasos iniciales y el enlace de activación. Revisá también la carpeta de spam si no llega en los próximos minutos.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-5">
            <div className="shrink-0 flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 border border-white/10 mt-0.5">
              <Clock size={14} className="text-white/35" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white mb-1">Completá la configuración inicial</p>
              <p className="text-xs text-white/40 leading-relaxed">
                Seguí los pasos del correo antes de ingresar a la plataforma. Tu cuenta <span className="text-white/55">no estará activa</span> hasta completar ese proceso — es rápido y lo hacemos juntos.
              </p>
            </div>
          </div>

        </div>

        {/* App link — disabled state warning */}
        <div className="rounded-2xl border border-white/8 bg-white/[0.025] p-5 mb-8">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <p className="text-sm font-semibold text-white mb-1">Tu plataforma</p>
              <p className="text-xs font-mono text-white/30">app.bralto.io</p>
            </div>
            <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-white/30">
              Pendiente
            </span>
          </div>

          <div className="rounded-xl bg-[#5bb6ff]/[0.06] border border-[#5bb6ff]/15 px-4 py-3 mb-4">
            <p className="text-xs text-[#5bb6ff]/80 leading-relaxed">
              Si intentás acceder antes de completar la configuración del correo, la cuenta no funcionará. Esperá las instrucciones primero.
            </p>
          </div>

          <a
            href="https://app.bralto.io"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between w-full px-4 py-3 rounded-xl bg-white/5 hover:bg-white/8 border border-white/8 hover:border-white/14 text-white/45 hover:text-white/65 text-sm transition-all group"
          >
            <span>Ir a app.bralto.io</span>
            <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
          </a>
        </div>

        {/* Footer */}
        <div className="text-center space-y-3">
          <p className="text-xs text-white/20">
            ¿Alguna duda? Respondé el correo que te enviemos y te ayudamos de inmediato.
          </p>
          <Link
            href="/"
            className="inline-block text-xs text-white/25 hover:text-white/45 underline underline-offset-4 transition-colors"
          >
            Volver al inicio
          </Link>
        </div>

      </div>
    </div>
  )
}
