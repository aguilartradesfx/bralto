import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft, Check } from 'lucide-react'
import { getCurrentSession } from '@/lib/panel-session'
import { hasPermission } from '@/lib/panel-access'
import { PRONTO } from '@/lib/panel/pronto'
import { TRAZO } from '@/components/internal/shell/iconos'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return { title: PRONTO[slug]?.titulo ?? 'Próximamente' }
}

// Una sección que viene: qué va a hacer y cómo se va a ver (una vista previa en gris)
export default async function ProntoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { user, profile } = await getCurrentSession()
  if (!user) redirect('/login')
  if (!hasPermission(profile, 'is_admin')) redirect('/admin')
  const { slug } = await params
  const seccion = PRONTO[slug]
  if (!seccion) notFound()

  return (
    <div className="px-4 pb-12 md:px-8">
      <section className="pn-glass pn-rise relative overflow-hidden rounded-[16px]">
        {/* La luz naranja, tenue, de arriba */}
        <div aria-hidden className="pointer-events-none absolute -right-24 -top-32 h-80 w-80 rounded-full" style={{ background: 'radial-gradient(closest-side, var(--pn-accent-glow), transparent)' }} />
        <div className="relative grid gap-10 p-6 md:p-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-center">
          <div className="max-w-xl">
            <span className="pn-pronto !text-[11.5px] !px-2 !py-0.5">Próximamente</span>
            <h1 className="mt-4 text-[28px] font-normal leading-tight tracking-[-0.02em] text-fg text-balance md:text-[32px]">{seccion.titulo}</h1>
            <p className="mt-3 text-[15px] leading-relaxed text-fg/60 text-pretty">{seccion.resumen}</p>
            <ul className="mt-7 space-y-3">
              {seccion.incluye.map((x) => (
                <li key={x} className="flex items-start gap-3 text-[14px] text-fg/80">
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md bg-[var(--pn-accent-soft)] text-[var(--pn-accent-ink)]">
                    <Check size={12} {...TRAZO} strokeWidth={2} />
                  </span>
                  {x}
                </li>
              ))}
            </ul>
            <Link href="/admin" className="pn-btn-glass mt-8 inline-flex items-center gap-1.5 px-3.5 py-2 text-[13px]">
              <ArrowLeft size={14} {...TRAZO} />
              Volver al inicio
            </Link>
          </div>
          <Vista />
        </div>
      </section>
    </div>
  )
}

// Cómo se va a ver, en gris: tarjetas de números y una tabla, que se desvanecen hacia abajo
function Vista() {
  return (
    <div aria-hidden className="relative select-none [mask-image:linear-gradient(to_bottom,black_55%,transparent)]">
      <div className="grid grid-cols-3 gap-3">
        {[0.72, 0.5, 0.62].map((w, i) => (
          <div key={i} className="pn-solid rounded-[12px] p-4">
            <div className="pn-skeleton h-2.5 w-2/3" />
            <div className="pn-skeleton mt-5 h-5" style={{ width: `${w * 100}%` }} />
            <svg viewBox="0 0 100 24" className="mt-3 h-6 w-full text-fg/20" preserveAspectRatio="none">
              <polyline fill="none" stroke="currentColor" strokeWidth="1.5" points={i === 1 ? '0,18 15,16 30,19 45,12 60,14 75,8 100,10' : '0,20 18,15 32,17 50,11 66,13 82,6 100,4'} />
            </svg>
          </div>
        ))}
      </div>
      <div className="pn-solid mt-3 rounded-[12px] p-2">
        {[0.8, 0.55, 0.7, 0.45, 0.6].map((w, i) => (
          <div key={i} className="flex items-center gap-3 border-b border-fg/[0.05] px-2 py-3 last:border-0">
            <div className="h-6 w-6 rounded-full bg-fg/[0.07]" />
            <div className="pn-skeleton h-2.5" style={{ width: `${w * 38}%` }} />
            <div className="pn-skeleton ml-auto h-2.5 w-14" />
            <div className="h-4 w-16 rounded-md bg-fg/[0.06]" />
          </div>
        ))}
      </div>
    </div>
  )
}
