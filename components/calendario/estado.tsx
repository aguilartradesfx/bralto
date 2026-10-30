import { Check, Clapperboard, GalleryHorizontalEnd, type LucideIcon } from 'lucide-react'
import type { Estado, Tipo } from '@/lib/redes/publicacion/tipos'

export const ESTADO_LABEL: Record<Estado, string> = {
  borrador: 'Borrador',
  programado: 'Programado',
  publicando: 'Publicando',
  publicado: 'Publicado',
  error: 'No salió',
  cancelado: 'Cancelado',
}

export const TIPO_LABEL: Record<Tipo, string> = { carrusel: 'Carrusel', reel: 'Reel' }
export const TIPO_ICONO: Record<Tipo, LucideIcon> = { carrusel: GalleryHorizontalEnd, reel: Clapperboard }

// El estado, discreto: hecho (check), la señal naranja (programado, late mientras se publica),
// hueco (borrador), rojo (no salió), apagado (cancelado)
export function Marca({ estado }: { estado: Estado }) {
  if (estado === 'publicado') return <Check size={11} strokeWidth={2.5} absoluteStrokeWidth className="shrink-0 text-fg/60" aria-hidden />
  if (estado === 'programado') return <span className="pn-signal" aria-hidden />
  if (estado === 'publicando') return <span className="pn-signal animate-pulse motion-reduce:animate-none" aria-hidden />
  if (estado === 'borrador') return <span className="h-1.5 w-1.5 shrink-0 rounded-full border border-fg/45" aria-hidden />
  if (estado === 'error') return <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" aria-hidden />
  return <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-fg/20" aria-hidden />
}

// Etiqueta con su marca, para la lista del teléfono y la ficha de la publicación
export function EstadoTexto({ estado, className = '' }: { estado: Estado; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 ${estado === 'error' ? 'text-red-300' : 'text-fg/55'} ${className}`}>
      <Marca estado={estado} />
      {ESTADO_LABEL[estado]}
    </span>
  )
}
