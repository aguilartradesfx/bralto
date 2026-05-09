'use client'

import Image from 'next/image'
import { useActionState } from 'react'
import { login } from './actions'

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, null)

  return (
    <div className="min-h-screen bg-[#060607] flex items-center justify-center p-4">
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_60%_50%_at_50%_40%,rgba(91,182,255,0.04),transparent)]" />

      <div className="relative z-10 w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <Image src="/logo-white.svg" alt="Bralto" width={130} height={32} className="h-8 w-auto object-contain" />
          </div>
          <p className="text-white/35 text-sm">Panel de administración</p>
        </div>

        <div className="rounded-card border border-white/[0.06] bg-[#131316] p-6">
          <form action={formAction} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-white/40 mb-1.5" htmlFor="email">
                Correo electrónico
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#5bb6ff]/40 focus:bg-[#5bb6ff]/[0.03] transition-all"
                placeholder="tu@bralto.io"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-white/40 mb-1.5" htmlFor="password">
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#5bb6ff]/40 focus:bg-[#5bb6ff]/[0.03] transition-all"
                placeholder="••••••••"
              />
            </div>

            {state?.error && (
              <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">
                {state.error}
              </p>
            )}

            <button
              type="submit"
              disabled={pending}
              className="w-full bg-[#5bb6ff] hover:bg-[#7cc5ff] disabled:opacity-50 disabled:cursor-not-allowed text-black font-semibold rounded-full px-4 py-2.5 text-sm transition-colors"
            >
              {pending ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
