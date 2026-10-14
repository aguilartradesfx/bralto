'use client'

import { useActionState } from 'react'
import { BraltoLogo } from '@/components/home/logo'
import { ThemeToggle } from '@/components/home/theme-toggle'
import { login } from './actions'

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, null)

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="fixed top-4 right-4 z-20">
        <ThemeToggle label="Cambiar entre tema claro y oscuro" />
      </div>
      <div className="relative z-10 w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <BraltoLogo className="h-8 w-auto" />
            <span className="sr-only">Bralto</span>
          </div>
          <p className="text-fg/45 text-sm">Panel de administración</p>
        </div>

        <div className="pn-glass rounded-[28px] p-6">
          <form action={formAction} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-fg/40 mb-1.5" htmlFor="email">
                Correo electrónico
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="w-full bg-fg/[0.04] border border-fg/[0.08] rounded-xl px-4 py-2.5 text-fg text-sm placeholder-fg/20 focus:outline-none focus:border-fg/50 focus:bg-fg/[0.06] transition-all"
                placeholder="tu@bralto.io"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-fg/40 mb-1.5" htmlFor="password">
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="w-full bg-fg/[0.04] border border-fg/[0.08] rounded-xl px-4 py-2.5 text-fg text-sm placeholder-fg/20 focus:outline-none focus:border-fg/50 focus:bg-fg/[0.06] transition-all"
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
              className="pn-btn-solid w-full font-semibold px-4 py-2.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {pending ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
