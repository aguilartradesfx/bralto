'use client'

import { useActionState } from 'react'
import { KeyRound, Mail } from 'lucide-react'
import { ThemeToggle } from '@/components/home/theme-toggle'
import { Marca } from '@/components/internal/shell/menu-lateral'
import { TRAZO } from '@/components/internal/shell/iconos'
import { Barrita, Medidor } from '@/components/internal/inicio/graficas'
import { login } from './actions'

const CAMPO =
  'h-11 w-full rounded-[10px] border border-fg/[0.1] bg-[var(--solid)] pl-10 pr-3 text-[14px] text-fg placeholder:text-fg/30 transition-colors focus:border-fg/50'

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, null)

  return (
    <div className="grid min-h-dvh gap-4 p-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:p-4">
      <div className="flex flex-col px-4 py-6 sm:px-10 lg:px-16 lg:py-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Marca grande />
            <div>
              <p className="text-[17px] font-medium leading-none tracking-tight text-fg">Bralto</p>
              <p className="mt-1.5 text-[12px] leading-none text-fg/45">Panel interno</p>
            </div>
          </div>
          <ThemeToggle label="Cambiar entre tema claro y oscuro" />
        </div>

        <div className="my-auto w-full max-w-[400px] py-14">
          <h1 className="text-[30px] font-normal leading-tight tracking-[-0.02em] text-fg">Hola de nuevo</h1>
          <p className="mt-1.5 text-[15px] text-fg/55">Entra con tu cuenta para seguir.</p>

          <form action={formAction} className="mt-8 space-y-4">
            <div>
              <label className="mb-1.5 block text-[12px] text-fg/50" htmlFor="email">
                Correo
              </label>
              <div className="relative">
                <Mail size={15} {...TRAZO} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-fg/35" />
                <input id="email" name="email" type="email" required autoComplete="email" className={CAMPO} placeholder="tu@bralto.io" />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-[12px] text-fg/50" htmlFor="password">
                Contraseña
              </label>
              <div className="relative">
                <KeyRound size={15} {...TRAZO} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-fg/35" />
                <input id="password" name="password" type="password" required autoComplete="current-password" className={CAMPO} placeholder="••••••••" />
              </div>
              <p className="mt-2 text-[12px] text-fg/40">¿La olvidaste? Pídele a un administrador que te mande una nueva.</p>
            </div>

            {state?.error && (
              <p role="alert" className="rounded-[10px] px-3.5 py-2.5 text-[13px] text-red-400" style={{ background: 'color-mix(in srgb, var(--pn-bad) 10%, transparent)' }}>
                {state.error}
              </p>
            )}

            <button type="submit" disabled={pending} className="pn-btn-solid h-11 w-full text-[14px] font-medium disabled:cursor-not-allowed disabled:opacity-60">
              {pending ? 'Entrando…' : 'Entrar'}
            </button>
          </form>

          <p className="mt-8 text-center text-[12.5px] text-fg/40">¿No tienes cuenta? Pídesela a un administrador.</p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 text-[12px] text-fg/35">
          <span>© {new Date().getFullYear()} Bralto</span>
          <span className="flex gap-4">
            <a href="https://www.bralto.io/es/privacidad" className="underline underline-offset-2 hover:text-fg/60">
              Privacidad
            </a>
            <a href="https://www.bralto.io/es/terminos" className="underline underline-offset-2 hover:text-fg/60">
              Términos
            </a>
            <a href="https://www.bralto.io" className="underline underline-offset-2 hover:text-fg/60">
              Sitio web
            </a>
          </span>
        </div>
      </div>

      <Vitrina />
    </div>
  )
}

// La imagen de la derecha: persianas con grano en tonos de naranja y dos tarjetas del panel encima (de muestra)
function Vitrina() {
  return (
    <div aria-hidden className="pn-vitrina relative hidden overflow-hidden rounded-[18px] lg:block">
      <div className="absolute inset-0 pn-vitrina__persianas" />
      <div className="absolute inset-0 pn-vitrina__grano" />
      <div className="pn-vitrina__sombra absolute inset-x-0 bottom-0 h-1/3" />

      <div className="absolute left-[12%] top-[34%] w-[min(560px,70%)] rounded-[14px] bg-[#1b1b1b] p-5 text-fg shadow-[0_30px_80px_-20px_rgba(0,0,0,.7)] ring-1 ring-fg/[0.07] [--pn-fg:236_236_236] [--pn-card:#1b1b1b]">
        <p className="text-[13.5px] font-medium">Salud del seguimiento</p>
        <p className="mt-1 text-[11.5px] text-fg/45">Qué tan bien le das seguimiento a quien te escribe.</p>
        <div className="mt-3 grid grid-cols-[150px_1fr] items-center gap-5">
          <Medidor valor={82} />
          <ul className="space-y-2.5 text-[11.5px] text-fg/75">
            {[
              ['Contestas en menos de 24 h', 91],
              ['Pipeline al día', 74],
              ['Conversaciones en el pipeline', 80],
              ['Llegan a las citas', 68],
            ].map(([n, v]) => (
              <li key={n} className="grid grid-cols-[1fr_70px_22px] items-center gap-2.5">
                <span className="truncate">{n}</span>
                <Barrita valor={Number(v)} />
                <span className="text-right tabular-nums text-fg/55">{v}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="absolute right-[8%] top-[18%] w-[min(300px,40%)] rounded-[14px] bg-[#1b1b1b] p-4 text-fg shadow-[0_30px_80px_-20px_rgba(0,0,0,.7)] ring-1 ring-fg/[0.07] [--pn-fg:236_236_236] [--pn-card:#1b1b1b]">
        <div className="flex items-center justify-between">
          <p className="text-[13px] font-medium">Mensajes recibidos</p>
          <span className="rounded-md bg-fg/[0.06] px-1.5 text-[10.5px] leading-[18px] text-fg/50">30 días</span>
        </div>
        <div className="mt-4 flex items-end justify-between">
          <div>
            <p className="text-[24px] leading-none tabular-nums">248</p>
            <p className="mt-1.5 text-[11px] text-fg/45">
              <span className="text-[#4ade80]">+18 %</span> vs antes
            </p>
          </div>
          <svg viewBox="0 0 120 36" className="h-9 w-[110px]">
            <polyline points="0,30 14,27 26,29 40,22 54,24 68,16 82,19 96,10 110,12 120,5" fill="none" stroke="rgba(236,236,236,.7)" strokeWidth="1.5" strokeLinejoin="round" />
            <circle cx="120" cy="5" r="2.75" fill="#ff6d28" stroke="#1b1b1b" strokeWidth="1.5" />
          </svg>
        </div>
      </div>
    </div>
  )
}
