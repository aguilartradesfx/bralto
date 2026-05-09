'use client'

import { InfiniteSlider } from '@/components/ui/infinite-slider'
import {
  Utensils, BedDouble, Building2, Dumbbell, Scale, GraduationCap,
  Pill, Wrench, ShieldCheck, Scissors, Calculator, Plane,
  ShoppingBag, Car, TrendingUp, Stethoscope, Smile, Printer, PawPrint, Cross,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const niches: { icon: LucideIcon; label: string }[] = [
  { icon: Utensils,      label: 'Restaurantes' },
  { icon: BedDouble,     label: 'Hoteles' },
  { icon: Stethoscope,   label: 'Clínicas' },
  { icon: Building2,     label: 'Inmobiliarias' },
  { icon: Dumbbell,      label: 'Gimnasios' },
  { icon: Scale,         label: 'Abogados' },
  { icon: GraduationCap, label: 'Academias' },
  { icon: Pill,          label: 'Farmacias' },
  { icon: Wrench,        label: 'Talleres' },
  { icon: ShieldCheck,   label: 'Aseguradoras' },
  { icon: Scissors,      label: 'Salones de Belleza' },
  { icon: Calculator,    label: 'Contadores' },
  { icon: Plane,         label: 'Agencias de Viaje' },
  { icon: ShoppingBag,   label: 'Tiendas Online' },
  { icon: Car,           label: 'Concesionarios' },
  { icon: TrendingUp,    label: 'Asesores Financieros' },
  { icon: Smile,         label: 'Dentistas' },
  { icon: Printer,       label: 'Imprentas' },
  { icon: PawPrint,      label: 'Veterinarias' },
  { icon: Cross,         label: 'Centros Médicos' },
]

const loopedNiches = [...niches, ...niches, ...niches]

function NicheItem({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <div className="flex items-center gap-3 whitespace-nowrap select-none">
      <Icon size={15} className="text-white/30 shrink-0" />
      <span className="text-sm font-medium text-white/28 tracking-wide">{label}</span>
      <span className="ml-3 text-white/12">·</span>
    </div>
  )
}

export function LogoCloud() {
  return (
    <section className="relative bg-[#060607] py-10">
      {/* Top separator */}
      <div className="mx-auto max-w-3xl px-6 text-center mb-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/20 mb-4">
          Nichos con los que funciona
        </p>
        <div className="mx-auto h-px max-w-xs bg-gradient-to-r from-transparent via-white/[0.07] to-transparent" />
      </div>

      <div className="[mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
        <InfiniteSlider gap={32} duration={533} durationOnHover={1600}>
          {loopedNiches.map((niche, i) => (
            <NicheItem key={`${niche.label}-${i}`} icon={niche.icon} label={niche.label} />
          ))}
        </InfiniteSlider>
      </div>

      <div className="mx-auto mt-5 max-w-3xl px-6">
        <div className="mx-auto h-px max-w-xs bg-gradient-to-r from-transparent via-white/[0.07] to-transparent" />
      </div>
    </section>
  )
}
