'use client'

import { useState } from 'react'
import { iniciales } from '@/lib/crm/tipos'
import type { CanalKnox } from '@/lib/knox/conversar/tipos'
import { CanalIcono } from '@/components/crm/piezas'

// La foto de la persona (la de su red) o sus iniciales, con el ícono del canal en la esquina. Si la foto ya venció,
// quedan las iniciales
export function FotoPersona({ nombre, foto, canal, grande = false }: { nombre: string; foto: string | null; canal?: CanalKnox; grande?: boolean }) {
  const [rota, setRota] = useState(false)
  return (
    <span className={`relative shrink-0 ${grande ? 'h-14 w-14' : 'h-11 w-11'}`}>
      {foto && !rota ? (
        // <img> y no next/image: la foto viene del CDN de la red, vence y no vale la pena optimizarla
        <img
          src={foto}
          alt=""
          referrerPolicy="no-referrer"
          loading="lazy"
          decoding="async"
          onError={() => setRota(true)}
          className="h-full w-full rounded-full bg-fg/[0.08] object-cover"
        />
      ) : (
        <span aria-hidden className={`grid h-full w-full place-items-center rounded-full bg-fg/[0.08] font-medium text-fg/75 ${grande ? 'text-lg' : 'text-sm'}`}>
          {iniciales(nombre)}
        </span>
      )}
      {canal && (
        <span aria-hidden className="absolute -bottom-0.5 -right-0.5 grid h-5 w-5 place-items-center rounded-full bg-solid text-fg/80 shadow-[0_0_0_2px_var(--solid)]">
          <CanalIcono canal={canal} size={11} />
        </span>
      )}
    </span>
  )
}
