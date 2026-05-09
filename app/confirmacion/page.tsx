'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle } from 'lucide-react'

export default function ConfirmacionPage() {
  const [count, setCount] = useState(10)
  const router = useRouter()

  useEffect(() => {
    if (count === 0) {
      router.push('/')
      return
    }
    const t = setTimeout(() => setCount((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [count, router])

  const circumference = 2 * Math.PI * 28
  const strokeDash = circumference - (circumference * count) / 10

  return (
    <div className="min-h-screen bg-[#060607] flex flex-col items-center justify-center px-6">
      {/* Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_40%,rgba(91,182,255,0.05),transparent)] pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center text-center max-w-md">
        {/* Check icon */}
        <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-full border border-[#5bb6ff]/25 bg-[#5bb6ff]/10">
          <CheckCircle size={40} className="text-[#5bb6ff]" />
        </div>

        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#5bb6ff] mb-4">
          ¡Solicitud recibida!
        </p>

        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-4">
          Su llamada está agendada.
        </h1>

        <p className="text-base text-white/40 leading-relaxed mb-3">
          Le enviaremos la confirmación y el enlace de la llamada a su correo electrónico en los próximos minutos.
        </p>
        <p className="text-sm text-white/25 mb-12">
          Revise su carpeta de spam si no lo encuentra.
        </p>

        {/* Countdown ring */}
        <div className="relative flex items-center justify-center">
          <svg width="72" height="72" className="-rotate-90">
            <circle
              cx="36"
              cy="36"
              r="28"
              fill="none"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="3"
            />
            <circle
              cx="36"
              cy="36"
              r="28"
              fill="none"
              stroke="#5bb6ff"
              strokeWidth="3"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDash}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 1s linear' }}
            />
          </svg>
          <span className="absolute text-xl font-bold text-white">{count}</span>
        </div>

        <p className="mt-4 text-xs text-white/30">
          Redirigiendo al inicio en {count} segundo{count !== 1 ? 's' : ''}…
        </p>

        <a
          href="/"
          className="mt-8 text-sm text-white/40 underline underline-offset-4 hover:text-white/60 transition-colors"
        >
          Ir al inicio ahora
        </a>
      </div>
    </div>
  )
}
